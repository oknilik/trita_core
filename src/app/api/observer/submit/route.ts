import type { TestType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTestConfig, isCompleteFormAnswerSet } from "@/lib/questions";
import { prisma } from "@/lib/prisma";
import { calculateScores } from "@/lib/scoring";
import { sendObserverCompletionEmail } from "@/lib/emails";
import {
  resolveObserverTokenLifecycle,
  toObserverTokenErrorCode,
} from "@/lib/observer/token-validation";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

const submitSchema = z.object({
  token: z.string().min(1),
  relationshipType: z.enum(["FRIEND", "COLLEAGUE", "FAMILY", "PARTNER", "OTHER"]),
  knownDuration: z.string().min(1),
  answers: z.array(answerSchema),
  confidence: z.number().int().min(1).max(5).optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, relationshipType, knownDuration, answers, confidence } = parsed.data;

  const invitation = await prisma.observerInvitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 404 });
  }

  const lifecycle = resolveObserverTokenLifecycle(invitation);
  if (lifecycle !== "active") {
    const code = toObserverTokenErrorCode(lifecycle);
    return NextResponse.json({ error: code }, { status: code === "INVALID_TOKEN" ? 404 : 400 });
  }

  // Validate all questions answered
  const config = getTestConfig(invitation.testType as TestType);
  const expectedIds = new Set(config.questions.map((q) => q.id));

  // Filter to only the expected question IDs (drops stale answers from old test versions)
  const relevantAnswers = answers.filter((a) => expectedIds.has(a.questionId));

  const answeredIds = new Set(relevantAnswers.map((a) => a.questionId));
  const hasDuplicates = answeredIds.size !== relevantAnswers.length;
  if (hasDuplicates) {
    return NextResponse.json({ error: "DUPLICATE_ANSWER" }, { status: 400 });
  }
  // A rövid (TSFI-S) és a teljes forma hiánytalan kitöltése egyaránt érvényes.
  if (!isCompleteFormAnswerSet(invitation.testType as TestType, answeredIds)) {
    return NextResponse.json({ error: "MISSING_ANSWER" }, { status: 400 });
  }

  for (const answer of relevantAnswers) {
    if (typeof answer.value !== "number" || Number.isNaN(answer.value)) {
      return NextResponse.json({ error: "INVALID_LIKERT_ANSWER" }, { status: 400 });
    }
  }

  // Score
  const typedAnswers = relevantAnswers.map((a) => ({
    questionId: a.questionId,
    value: Number(a.value),
  }));

  const scores = calculateScores(invitation.testType as TestType, typedAnswers);

  // Save observer assessment + update invitation status
  await prisma.$transaction([
    prisma.observerAssessment.create({
      data: {
        invitationId: invitation.id,
        relationshipType,
        knownDuration,
        confidence: confidence ?? null,
        scores: {
          ...scores,
          answers: relevantAnswers,
          questionCount: relevantAnswers.length,
        },
      },
    }),
    prisma.observerInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    }),
  ]);

  // In-app notification — notify inviter that observer completed (fire-and-forget)
  import("@/lib/notifications").then(({ handleObserverCompleted }) =>
    handleObserverCompleted({
      inviterId: invitation.inviterId,
      observerName: invitation.observerName ?? "Valaki",
      invitationId: invitation.id,
    }).catch((err) => console.error("[Notification] Observer completed error:", err)),
  );

  // In-app notification — notify observer that their submission was received (if registered user)
  // observerProfileId may be null if the link wasn't opened while signed in,
  // so we also try to match by observerEmail.
  (async () => {
    let observerUserId = invitation.observerProfileId;

    if (!observerUserId && invitation.observerEmail) {
      const observer = await prisma.userProfile.findFirst({
        where: { email: invitation.observerEmail, deleted: false },
        select: { id: true },
      });
      observerUserId = observer?.id ?? null;
    }

    if (!observerUserId) return;

    const inviter = await prisma.userProfile.findUnique({
      where: { id: invitation.inviterId },
      select: { username: true, email: true },
    });
    if (!inviter) return;

    const { handleObserverSubmitted } = await import("@/lib/notifications");
    await handleObserverSubmitted({
      observerUserId,
      inviterName: inviter.username ?? inviter.email ?? "—",
      invitationId: invitation.id,
    });
  })().catch((err) => console.error("[Notification] Observer submitted error:", err));

  // Email — only from the 2nd completed observer onward (fire-and-forget)
  prisma.observerAssessment.count({
    where: {
      invitation: { inviterId: invitation.inviterId },
    },
  }).then(async (completedCount) => {
    if (completedCount < 2) return;
    const inviter = await prisma.userProfile.findUnique({
      where: { id: invitation.inviterId },
      select: { email: true, locale: true, username: true },
    });
    if (!inviter?.email) return;
    const locale = (["hu", "en"].includes(inviter.locale ?? "")
      ? inviter.locale
      : undefined) as "hu" | "en" | undefined;
    sendObserverCompletionEmail({
      to: inviter.email,
      inviterName: inviter.username ?? inviter.email,
      locale,
    }).catch((err) => console.error("[Email] Observer completion send error:", err));
  }).catch((err) => console.error("[Email] Inviter lookup error:", err));

  return NextResponse.json({ success: true });
}
