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
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { testType: clientTestType, answers } = parsed.data;

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
    return NextResponse.json(
      { error: "A teszttípus nem egyezik a hozzárendelt teszttel." },
      { status: 400 }
    );
  }

  // Validate that all questions are answered and unique
  const config = getTestConfig(testType as TestType);
  const expectedIds = new Set(config.questions.map((q) => q.id));
  if (answers.length !== expectedIds.size) {
    return NextResponse.json(
      { error: "A válaszok száma nem egyezik a kérdések számával." },
      { status: 400 }
    );
  }

  const answeredIds = new Set(answers.map((a) => a.questionId));
  if (answeredIds.size !== answers.length) {
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

  for (const answer of answers) {
    if (typeof answer.value !== "number" || Number.isNaN(answer.value)) {
      return NextResponse.json(
        { error: "Érvénytelen Likert válasz." },
        { status: 400 }
      );
    }
  }

  const typedAnswers = answers.map((a) => ({
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
          answers,
          questionCount: answers.length,
        },
      },
    }),
    prisma.assessmentDraft.deleteMany({
      where: { userProfileId: profile.id },
    }),
  ]);

  return NextResponse.json({ id: result.id });
}
