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

  // Append-only körök: minden beadás ÚJ sort ír (a régi kör megmarad az
  // összehasonlításhoz), kör-címkével arra a kampányra, ahol a lépés nyitott.
  const { advanceCampaignStepForUser, resolveActiveCampaignIdForStep } =
    await import("@/lib/campaign-steps");
  const campaignId = await resolveActiveCampaignIdForStep(
    profile.id,
    "TEAM_ROLE",
  ).catch(() => null);

  const teamRoleAnswer = await prisma.teamRoleAnswer.create({
    data: { userProfileId: profile.id, campaignId, answers: selections as object },
  });

  await prisma.teamRoleScore.create({
    data: {
      userProfileId: profile.id,
      campaignId,
      scores: scores as object,
      source: "questionnaire",
      teamRoleAnswerId: teamRoleAnswer.id,
    },
  });

  // Több-lépéses kampány: a szerep-kérdőív teljesítése lépteti a TEAM_ROLE lépést
  if (campaignId) {
    advanceCampaignStepForUser(profile.id, "TEAM_ROLE", { campaignId }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
