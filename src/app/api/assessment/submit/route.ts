import { Prisma, type TestType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assignTestType } from "@/lib/assignTestType";
import { getAcceptedAnswerIds, isCompleteFormAnswerSet } from "@/lib/questions";
import { prisma } from "@/lib/prisma";
import { calculateScores } from "@/lib/scoring";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";
import {
  advanceCampaignStepForUser,
  notifyCampaignStepOpenings,
  resolveActiveSelfAssessmentCampaign,
} from "@/lib/campaign-steps";
import { resolveAssessmentSubmitViewerClerkId } from "@/lib/assessment-submit-auth";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

const submissionSchema = z.object({
  testType: z.enum(["TRITAN"]),
  answers: z.array(answerSchema),
  campaignId: z.string().min(1).max(191).optional(),
});

function canonicalAnswers(answers: Array<{ questionId: number; value: number }>): string {
  return JSON.stringify([...answers].sort((a, b) => a.questionId - b.questionId));
}

function persistedAnswers(scores: unknown): string | null {
  if (!scores || typeof scores !== "object" || Array.isArray(scores)) return null;
  const answers = (scores as { answers?: unknown }).answers;
  if (!Array.isArray(answers)) return null;
  return canonicalAnswers(
    answers.flatMap((entry): Array<{ questionId: number; value: number }> => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
      const item = entry as Record<string, unknown>;
      const questionId = Number(item.questionId);
      const value = Number(item.value);
      return Number.isInteger(questionId) && Number.isInteger(value)
        ? [{ questionId, value }]
        : [];
    }),
  );
}

export async function POST(req: Request) {
  const log = await getRequestLogger("assessment");
  const userId = await resolveAssessmentSubmitViewerClerkId();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const rateLimitResponse = await checkRateLimit("api", userId);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json();
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    log.warn({ event: "assessment.submit_invalid", issues: parsed.error.flatten() }, "Zod validation failed");
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { testType: clientTestType, answers, campaignId: requestedCampaignId } = parsed.data;
  log.info({ event: "assessment.submit_received", clientTestType, answerCount: answers.length, clerkId: userId }, "Submission received");

  const profile = await prisma.userProfile.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId },
    update: {},
  });

  let testType = profile.testType;
  if (!testType) {
    testType = await assignTestType(profile.id);
  }

  if (clientTestType !== testType) {
    log.warn({ event: "assessment.submit_testtype_mismatch", clientTestType, profileTestType: testType }, "Test type mismatch");
    return NextResponse.json(
      { error: "A teszttípus nem egyezik a hozzárendelt teszttel." },
      { status: 400 }
    );
  }

  const campaignStep = await resolveActiveSelfAssessmentCampaign(
    profile.id,
    requestedCampaignId ? { campaignId: requestedCampaignId } : undefined,
  );
  const campaignId = campaignStep?.campaignId ?? null;
  if (requestedCampaignId && campaignId !== requestedCampaignId) {
    log.warn(
      { event: "assessment.submit_campaign_not_open", requestedCampaignId },
      "Campaign step is not open for user",
    );
    return NextResponse.json(
      { error: "Ez a mérési kör már nem nyitott ehhez a kérdőívhez." },
      { status: 409 },
    );
  }

  // Validate answers — a rövid (TSFI-S) és a teljes forma hiánytalan
  // kitöltése egyaránt érvényes, ahogy egy KORÁBBI rövid forma pontos
  // id-halmaza is (beragadt bundle / forma-váltás közben futó kitöltés).
  const expectedIds = getAcceptedAnswerIds(testType as TestType);

  // Filter to only the expected question IDs (drops stale answers from old test versions)
  const relevantAnswers = answers.filter((a) => expectedIds.has(a.questionId));

  const answeredIds = new Set(relevantAnswers.map((a) => a.questionId));
  if (answeredIds.size !== relevantAnswers.length) {
    return NextResponse.json(
      { error: "Duplikált válasz érkezett ugyanarra a kérdésre." },
      { status: 400 }
    );
  }

  if (!isCompleteFormAnswerSet(testType as TestType, answeredIds)) {
    log.warn({ event: "assessment.submit_form_mismatch", answered: answeredIds.size }, "Answer count does not match form");
    return NextResponse.json(
      { error: "A válaszok száma nem egyezik a kérdőív-forma kérdésszámával." },
      { status: 400 }
    );
  }

  for (const answer of relevantAnswers) {
    if (typeof answer.value !== "number" || Number.isNaN(answer.value)) {
      return NextResponse.json(
        { error: "Érvénytelen Likert válasz." },
        { status: 400 }
      );
    }
  }

  const typedAnswers = relevantAnswers.map((a) => ({
    questionId: a.questionId,
    value: Number(a.value),
  }));

  const scores = calculateScores(testType as TestType, typedAnswers);

  let created = false;
  let openings: Awaited<ReturnType<typeof advanceCampaignStepForUser>> = [];
  let result: { id: string };
  const scopedCampaignId = campaignId;
  try {
    result = await prisma.$transaction(async (tx) => {
      const existing = campaignId
        ? await tx.assessmentResult.findUnique({
            where: { userProfileId_campaignId: { userProfileId: profile.id, campaignId: scopedCampaignId! } },
            select: { id: true, scores: true },
          })
        : null;
      if (existing) {
        if (persistedAnswers(existing.scores) !== canonicalAnswers(relevantAnswers)) {
          throw new Error("CAMPAIGN_ALREADY_SUBMITTED_DIFFERENT");
        }
        openings = campaignStep
          ? await advanceCampaignStepForUser(profile.id, campaignStep.stepType, {
              campaignId: scopedCampaignId!,
              db: tx,
              emitNotifications: false,
            })
          : [];
        return { id: existing.id };
      }

      const saved = await tx.assessmentResult.create({
        data: {
          userProfileId: profile.id,
          campaignId: scopedCampaignId,
          testType: testType as TestType,
          scores: {
            ...scores,
            answers: relevantAnswers,
            questionCount: relevantAnswers.length,
          },
        },
        select: { id: true },
      });
      created = true;
      await tx.assessmentDraft.deleteMany({
        where: {
          userProfileId: profile.id,
          scope: scopedCampaignId ? `campaign:${scopedCampaignId}` : "self",
        },
      });
      openings = campaignStep
        ? await advanceCampaignStepForUser(profile.id, campaignStep.stepType, {
            campaignId: scopedCampaignId!,
            db: tx,
            emitNotifications: false,
          })
        : [];
      return saved;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CAMPAIGN_ALREADY_SUBMITTED_DIFFERENT") {
      return NextResponse.json({ error: "ALREADY_SUBMITTED" }, { status: 409 });
    }
    if (campaignId && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.assessmentResult.findUnique({
        where: { userProfileId_campaignId: { userProfileId: profile.id, campaignId } },
        select: { id: true, scores: true },
      });
      if (existing && persistedAnswers(existing.scores) === canonicalAnswers(relevantAnswers)) {
        result = { id: existing.id };
      } else {
        return NextResponse.json({ error: "ALREADY_SUBMITTED" }, { status: 409 });
      }
    } else {
      throw error;
    }
  }

  await notifyCampaignStepOpenings(openings).catch((err) =>
    log.error({ event: "assessment.step_notification_failed", err }, "Step notification failed"),
  );

  // Analitika: a kitöltés BEFEJEZÉSE szerver-oldali igazság — a kliens
  // oldali „kész" esemény ad-blockolható és hamisítható lenne, ez pedig a
  // tölcsér legfontosabb lépése.
  if (created) {
    trackServerEvent(
      "assessment.complete",
      { mode: "user" },
      { userProfileId: profile.id },
    );
  }

  // In-app notification via orchestrator (fire-and-forget)
  import("@/lib/notifications").then(({ handleResultReady }) =>
    handleResultReady({
      userId: profile.id,
      assessmentResultId: result.id,
    }).catch((err) => log.error({ event: "notification.result_ready_failed", err }, "Result ready notification failed")),
  );

  return NextResponse.json({ id: result.id });
}
