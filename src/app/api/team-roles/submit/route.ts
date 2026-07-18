import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { calculateTeamRoleScores } from "@/lib/team-role-scoring";
import type { TeamRoleAnswers } from "@/lib/team-role-scoring";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  let answers: TeamRoleAnswers;
  try {
    const body = await req.json();
    answers = body.answers as TeamRoleAnswers;
    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const scores = calculateTeamRoleScores(answers);

  // Upsert TeamRoleAnswer
  const teamRoleAnswer = await prisma.teamRoleAnswer.upsert({
    where: { userProfileId: profile.id },
    create: { userProfileId: profile.id, answers: answers as object },
    update: { answers: answers as object },
  });

  // Upsert TeamRoleScore
  await prisma.teamRoleScore.upsert({
    where: { userProfileId: profile.id },
    create: {
      userProfileId: profile.id,
      scores: scores as object,
      source: "questionnaire",
      teamRoleAnswerId: teamRoleAnswer.id,
    },
    update: {
      scores: scores as object,
      source: "questionnaire",
      teamRoleAnswerId: teamRoleAnswer.id,
    },
  });

  // Több-lépéses kampány: a szerep-kérdőív teljesítése lépteti a TEAM_ROLE lépést
  import("@/lib/campaign-steps").then(({ advanceCampaignStepForUser }) =>
    advanceCampaignStepForUser(profile.id, "TEAM_ROLE").catch(() => {}),
  );

  return NextResponse.json({ ok: true });
}
