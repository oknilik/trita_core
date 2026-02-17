import { auth } from "@clerk/nextjs/server";
import type { TestType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assignTestType } from "@/lib/assignTestType";
import { getTestConfig } from "@/lib/questions";
import { prisma } from "@/lib/prisma";
import { calculateScores } from "@/lib/scoring";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  value: z.number().int().min(1).max(5),
});

const submissionSchema = z.object({
  testType: z.enum(["HEXACO", "HEXACO_MODIFIED", "BIG_FIVE"]),
  answers: z.array(answerSchema),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    console.error('[submit] Zod validation failed', JSON.stringify(parsed.error.flatten()));
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { testType: clientTestType, answers } = parsed.data;
  console.log('[submit] received', { clientTestType, answerCount: answers.length, userId });

  const profile = await prisma.userProfile.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId },
    update: {},
  });

  let testType = profile.testType;
  if (!testType) {
    testType = await assignTestType(profile.id);
  }

  console.log('[submit] testTypes', { clientTestType, profileTestType: testType });

  if (clientTestType !== testType) {
    console.error('[submit] testType mismatch', { clientTestType, profileTestType: testType });
    return NextResponse.json(
      { error: "A teszttípus nem egyezik a hozzárendelt teszttel." },
      { status: 400 }
    );
  }

  // Validate that all questions are answered and unique
  const config = getTestConfig(testType as TestType);
  const expectedIds = new Set(config.questions.map((q) => q.id));

  // Filter to only the expected question IDs (drops stale answers from old test versions)
  const relevantAnswers = answers.filter((a) => expectedIds.has(a.questionId));

  console.log('[submit] counts', { relevantAnswers: relevantAnswers.length, expectedIds: expectedIds.size });

  if (relevantAnswers.length !== expectedIds.size) {
    console.error('[submit] count mismatch', { relevantAnswers: relevantAnswers.length, expectedIds: expectedIds.size });
    return NextResponse.json(
      { error: "A válaszok száma nem egyezik a kérdések számával." },
      { status: 400 }
    );
  }

  const answeredIds = new Set(relevantAnswers.map((a) => a.questionId));
  if (answeredIds.size !== relevantAnswers.length) {
    return NextResponse.json(
      { error: "Duplikált válasz érkezett ugyanarra a kérdésre." },
      { status: 400 }
    );
  }
  for (const id of expectedIds) {
    if (!answeredIds.has(id)) {
      return NextResponse.json(
        { error: `Missing answer for question ${id}` },
        { status: 400 }
      );
    }
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

  return NextResponse.json({ id: result.id });
}
