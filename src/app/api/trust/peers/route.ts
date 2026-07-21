import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isStepOpenFor } from "@/lib/campaign-steps-core";

/**
 * GET /api/trust/peers?campaignId=…
 *
 * A rater számára: a kampány cél-csapatának értékelendő tagjai + melyikről
 * adott már be bizalmi visszajelzést EBBEN a körben. Guard: aktív kampány,
 * résztvevő, és a TRUST_360 az aktuálisan nyitott lépése.
 * Minta: /api/team-roles/peers.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const campaignId = req.nextUrl.searchParams.get("campaignId") ?? "";
  if (!campaignId) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const participant = await prisma.campaignParticipant.findUnique({
    where: { campaignId_userId: { campaignId, userId: profile.id } },
    select: {
      currentStep: true,
      campaign: {
        select: { id: true, status: true, type: true, steps: true, teamId: true },
      },
    },
  });
  if (!participant) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (participant.campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "CAMPAIGN_NOT_ACTIVE" }, { status: 409 });
  }
  if (!isStepOpenFor(participant.campaign, participant, "TRUST_360")) {
    return NextResponse.json({ error: "STEP_LOCKED" }, { status: 409 });
  }
  const teamId = participant.campaign.teamId;
  if (!teamId) return NextResponse.json({ error: "NO_TARGET_TEAM" }, { status: 409 });

  const [members, rated] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId, userId: { not: profile.id } },
      select: {
        userId: true,
        user: { select: { id: true, username: true, email: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.trustObservation.findMany({
      where: { campaignId, raterUserId: profile.id },
      select: { aboutUserId: true },
    }),
  ]);

  const ratedSet = new Set(rated.map((r) => r.aboutUserId));
  return NextResponse.json({
    teamId,
    teammates: members.map((m) => ({
      userId: m.userId,
      name: m.user.username ?? m.user.email ?? m.user.id,
      done: ratedSet.has(m.userId),
    })),
  });
}
