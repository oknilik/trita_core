import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTestConfig } from "@/lib/questions";
import { prisma } from "@/lib/prisma";
import { calculateScores } from "@/lib/scoring";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

const claimSchema = z.object({
  answers: z.array(answerSchema),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { answers } = parsed.data;
  const testType = "HEXACO" as const;

  // Find or create profile, force-assign HEXACO
  const profile = await prisma.userProfile.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, testType, testTypeAssignedAt: new Date() },
    update: {},
  });

  // If profile has no test type, assign HEXACO
  if (!profile.testType) {
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { testType, testTypeAssignedAt: new Date() },
    });
  }

  // Validate answers against HEXACO config
  const config = getTestConfig(testType);
  const expectedIds = new Set(config.questions.map((q) => q.id));
  const relevantAnswers = answers.filter((a) => expectedIds.has(a.questionId));

  if (relevantAnswers.length !== expectedIds.size) {
    return NextResponse.json(
      { error: "ANSWER_COUNT_MISMATCH" },
      { status: 400 },
    );
  }

  const answeredIds = new Set(relevantAnswers.map((a) => a.questionId));
  if (answeredIds.size !== relevantAnswers.length) {
    return NextResponse.json(
      { error: "DUPLICATE_ANSWER" },
      { status: 400 },
    );
  }

  for (const id of expectedIds) {
    if (!answeredIds.has(id)) {
      return NextResponse.json(
        { error: "MISSING_ANSWER" },
        { status: 400 },
      );
    }
  }

  const typedAnswers = relevantAnswers.map((a) => ({
    questionId: a.questionId,
    value: Number(a.value),
  }));

  const scores = calculateScores(testType, typedAnswers);

  const result = await prisma.assessmentResult.create({
    data: {
      userProfileId: profile.id,
      testType,
      scores: {
        ...scores,
        answers: relevantAnswers,
        questionCount: relevantAnswers.length,
      },
    },
  });

  return NextResponse.json({ id: result.id });
}
