import type { TestType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import { calculateScores } from "@/lib/scoring";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

const submitSchema = z.object({
  answers: z.array(answerSchema),
});

// POST /api/candidate/[token]/submit — submit candidate assessment answers
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const body = submitSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", details: body.error.flatten() },
      { status: 400 }
    );
  }

  const { answers } = body.data;

  const invite = await prisma.candidateInvite.findUnique({
    where: { token },
    select: { id: true, testType: true, status: true, expiresAt: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 404 });
  }

  if (invite.status === "COMPLETED") {
    return NextResponse.json({ error: "ALREADY_USED" }, { status: 400 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "INVITE_EXPIRED" }, { status: 400 });
  }

  const testType = invite.testType as TestType;
  const config = getTestConfig(testType);
  const expectedIds = new Set(config.questions.map((q) => q.id));
  const relevantAnswers = answers.filter((a) => expectedIds.has(a.questionId));

  const answeredIds = new Set(relevantAnswers.map((a) => a.questionId));
  if (answeredIds.size !== relevantAnswers.length) {
    return NextResponse.json({ error: "DUPLICATE_ANSWER" }, { status: 400 });
  }
  if (answeredIds.size !== expectedIds.size) {
    return NextResponse.json({ error: "MISSING_ANSWER" }, { status: 400 });
  }

  const typedAnswers = relevantAnswers.map((a) => ({
    questionId: a.questionId,
    value: a.value,
  }));

  const scores = calculateScores(testType, typedAnswers);

  try {
    await prisma.$transaction([
      prisma.candidateResult.create({
        data: {
          inviteId: invite.id,
          testType: invite.testType,
          scores: {
            ...scores,
            answers: relevantAnswers,
            questionCount: relevantAnswers.length,
          },
        },
      }),
      prisma.candidateInvite.update({
        where: { id: invite.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      }),
    ]);
  } catch (e) {
    // Unique constraint violation: concurrent duplicate submission
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "ALREADY_USED" }, { status: 400 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
