import { auth } from "@clerk/nextjs/server";
import type { TestType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assignTestType } from "@/lib/assignTestType";
import { getAcceptedAnswerIds, isCompleteFormAnswerSet } from "@/lib/questions";
import { prisma } from "@/lib/prisma";
import { calculateScores } from "@/lib/scoring";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

const submissionSchema = z.object({
  testType: z.enum(["TRITAN"]),
  answers: z.array(answerSchema),
});

export async function POST(req: Request) {
  const log = await getRequestLogger("assessment");
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    log.warn({ event: "assessment.submit_invalid", issues: parsed.error.flatten() }, "Zod validation failed");
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { testType: clientTestType, answers } = parsed.data;
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

  const [result] = await prisma.$transaction([
    prisma.assessmentResult.create({
      data: {
        userProfileId: profile.id,
        testType: testType as TestType,
        scores: {
          ...scores,
          answers: relevantAnswers,
          questionCount: relevantAnswers.length,
        },
      },
    }),
    prisma.assessmentDraft.deleteMany({
      where: { userProfileId: profile.id },
    }),
  ]);

  // Analitika: a kitöltés BEFEJEZÉSE szerver-oldali igazság — a kliens
  // oldali „kész" esemény ad-blockolható és hamisítható lenne, ez pedig a
  // tölcsér legfontosabb lépése.
  trackServerEvent(
    "assessment.complete",
    { mode: "user" },
    { userProfileId: profile.id },
  );

  // Több-lépéses kampány: a self teljesítése lépteti az OBSERVER_360 lépést
  import("@/lib/campaign-steps").then(({ advanceCampaignStepForUser }) =>
    advanceCampaignStepForUser(profile.id, "OBSERVER_360").catch(() => {}),
  );

  // In-app notification via orchestrator (fire-and-forget)
  import("@/lib/notifications").then(({ handleResultReady }) =>
    handleResultReady({
      userId: profile.id,
      assessmentResultId: result.id,
    }).catch((err) => log.error({ event: "notification.result_ready_failed", err }, "Result ready notification failed")),
  );

  return NextResponse.json({ id: result.id });
}
