import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateTeamRoleScores } from "@/lib/team-role-scoring";
import {
  isValidTeamRoleSelectionSet,
  type TeamRoleSelections,
} from "@/lib/team-role-questions";

const bodySchema = z.object({
  selections: z.record(z.string(), z.number()),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  if (!isValidTeamRoleSelectionSet(body.data.selections)) {
    return NextResponse.json({ error: "INVALID_SELECTIONS" }, { status: 400 });
  }
  const selections = body.data.selections as TeamRoleSelections;

  const scores = calculateTeamRoleScores(selections);

  // Upsert TeamRoleAnswer (a selections formátumot tárolja)
  const teamRoleAnswer = await prisma.teamRoleAnswer.upsert({
    where: { userProfileId: profile.id },
    create: { userProfileId: profile.id, answers: selections as object },
    update: { answers: selections as object },
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
