import type { TestType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTestConfig } from "@/lib/questions";
import { prisma } from "@/lib/prisma";
import { calculateScores } from "@/lib/scoring";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.union([z.number().int().min(1).max(5), z.string()]),
});

const submitSchema = z.object({
  token: z.string().min(1),
  relationshipType: z.enum(["FRIEND", "COLLEAGUE", "FAMILY", "PARTNER", "OTHER"]),
  knownDuration: z.string().min(1),
  answers: z.array(answerSchema),
  confidence: z.number().int().min(1).max(5).optional(),
});

const MBTI_VALUES = new Set(["A", "B"]);

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

  if (invitation.status === "COMPLETED") {
    return NextResponse.json({ error: "ALREADY_USED" }, { status: 400 });
  }

  if (invitation.status === "CANCELED") {
    return NextResponse.json({ error: "INVITE_CANCELED" }, { status: 400 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "INVITE_EXPIRED" }, { status: 400 });
  }

  // Validate all questions answered
  const config = getTestConfig(invitation.testType as TestType);
  const expectedIds = new Set(config.questions.map((q) => q.id));
  if (answers.length !== expectedIds.size) {
    return NextResponse.json({ error: "ANSWER_COUNT_MISMATCH" }, { status: 400 });
  }

  const answeredIds = new Set(answers.map((a) => a.questionId));
  if (answeredIds.size !== answers.length) {
    return NextResponse.json({ error: "DUPLICATE_ANSWER" }, { status: 400 });
  }
  for (const id of expectedIds) {
    if (!answeredIds.has(id)) {
      return NextResponse.json({ error: "MISSING_ANSWER" }, { status: 400 });
    }
  }

  if (invitation.testType === "MBTI") {
    for (const answer of answers) {
      if (typeof answer.value !== "string" || !MBTI_VALUES.has(answer.value)) {
        return NextResponse.json({ error: "INVALID_MBTI_ANSWER" }, { status: 400 });
      }
    }
  } else {
    for (const answer of answers) {
      if (typeof answer.value !== "number" || Number.isNaN(answer.value)) {
        return NextResponse.json({ error: "INVALID_LIKERT_ANSWER" }, { status: 400 });
      }
    }
  }

  // Score
  const typedAnswers =
    invitation.testType === "MBTI"
      ? answers.map((a) => ({ questionId: a.questionId, value: String(a.value) }))
      : answers.map((a) => ({ questionId: a.questionId, value: Number(a.value) }));

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
          answers,
          questionCount: answers.length,
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

  return NextResponse.json({ success: true });
}
