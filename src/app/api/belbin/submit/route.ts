import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { calculateBelbinScores } from "@/lib/belbin-scoring";
import type { BelbinAnswers } from "@/lib/belbin-scoring";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  let answers: BelbinAnswers;
  try {
    const body = await req.json();
    answers = body.answers as BelbinAnswers;
    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const scores = calculateBelbinScores(answers);

  // Upsert BelbinAnswer
  const belbinAnswer = await prisma.belbinAnswer.upsert({
    where: { userProfileId: profile.id },
    create: { userProfileId: profile.id, answers: answers as object },
    update: { answers: answers as object },
  });

  // Upsert BelbinScore
  await prisma.belbinScore.upsert({
    where: { userProfileId: profile.id },
    create: {
      userProfileId: profile.id,
      scores: scores as object,
      source: "questionnaire",
      belbinAnswerId: belbinAnswer.id,
    },
    update: {
      scores: scores as object,
      source: "questionnaire",
      belbinAnswerId: belbinAnswer.id,
    },
  });

  return NextResponse.json({ ok: true });
}
