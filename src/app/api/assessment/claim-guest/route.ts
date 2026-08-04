import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTestConfig, isCompleteFormAnswerSet } from "@/lib/questions";
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
  const testType = "TRITAN" as const;

  // Find or create profile, force-assign TRITAN
  const profile = await prisma.userProfile.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, testType, testTypeAssignedAt: new Date() },
    update: {},
  });

  // If profile has no test type, assign TRITAN
  if (!profile.testType) {
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { testType, testTypeAssignedAt: new Date() },
    });
  }

  // Validate answers against TRITAN config — a rövid (TSFI-S) és a teljes
  // forma hiánytalan kitöltése egyaránt érvényes.
  const config = getTestConfig(testType);
  const expectedIds = new Set(config.questions.map((q) => q.id));
  const relevantAnswers = answers.filter((a) => expectedIds.has(a.questionId));

  const answeredIds = new Set(relevantAnswers.map((a) => a.questionId));
  if (answeredIds.size !== relevantAnswers.length) {
    return NextResponse.json(
      { error: "DUPLICATE_ANSWER" },
      { status: 400 },
    );
  }

  if (!isCompleteFormAnswerSet(testType, answeredIds)) {
    return NextResponse.json(
      { error: "ANSWER_COUNT_MISMATCH" },
      { status: 400 },
    );
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

  // Több-lépéses kampány: a megszerzett self-eredmény lépteti az OBSERVER_360 lépést
  import("@/lib/campaign-steps").then(({ advanceCampaignStepForUser }) =>
    advanceCampaignStepForUser(profile.id, "OBSERVER_360").catch(() => {}),
  );

  return NextResponse.json({ id: result.id });
}
