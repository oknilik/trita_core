import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isStepOpenFor } from "@/lib/campaign-steps-core";
import {
  advanceCampaignStepForUser,
  notifyCampaignStepOpenings,
  resolveCampaignTeamIdForUser,
} from "@/lib/campaign-steps";
import { isValidTrustAnswerSet } from "@/lib/trust-network";

const bodySchema = z.object({
  campaignId: z.string().min(1),
  observations: z
    .array(
      z.object({
        aboutUserId: z.string().min(1),
        answers: z.record(z.string(), z.number()),
      }),
    )
    .min(1)
    .max(50),
});

/**
 * POST /api/trust/peers/submit — bizalmi visszajelzés(ek) beküldése
 * (batch: a kliens akár személyenként, akár egyben küldhet).
 *
 * Guard-ok: aktív kampány + résztvevő + nyitott TRUST_360 lépés
 * (STEP_LOCKED, 409) + minden értékelt a cél-csapat tagja. Upsert:
 * ismételt beküldés ugyanarról a személyről felülírja a korábbit.
 * Ha a rater ezzel lefedte a csapat minden tagját, a TRUST_360 lépés
 * teljesül (idempotens léptető). Minta: /api/team-roles/peers/submit.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const { campaignId, observations } = body.data;

  for (const obs of observations) {
    if (obs.aboutUserId === profile.id) {
      return NextResponse.json({ error: "SELF_RATING_FORBIDDEN" }, { status: 400 });
    }
    if (!isValidTrustAnswerSet(obs.answers)) {
      return NextResponse.json({ error: "INVALID_ANSWERS" }, { status: 400 });
    }
  }

  const participant = await prisma.campaignParticipant.findUnique({
    where: { campaignId_userId: { campaignId, userId: profile.id } },
    select: {
      currentStep: true,
      nextStepOpensAt: true,
      campaign: { select: { status: true, type: true, steps: true, teamId: true, teamIds: true } },
    },
  });
  if (!participant) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (participant.campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "CAMPAIGN_NOT_ACTIVE" }, { status: 409 });
  }
  if (!isStepOpenFor(participant.campaign, participant, "TRUST_360")) {
    return NextResponse.json({ error: "STEP_LOCKED" }, { status: 409 });
  }
  // Több-csapatos kampányban a tag SAJÁT csapata a cél.
  const teamId = await resolveCampaignTeamIdForUser(participant.campaign, profile.id);
  if (!teamId) return NextResponse.json({ error: "NO_TARGET_TEAM" }, { status: 409 });

  // Minden értékelt legyen a cél-csapat tagja.
  const memberIds = new Set(
    (
      await prisma.teamMember.findMany({
        where: { teamId },
        select: { userId: true },
      })
    ).map((m) => m.userId),
  );
  for (const obs of observations) {
    if (!memberIds.has(obs.aboutUserId)) {
      return NextResponse.json({ error: "NOT_A_TEAM_MEMBER" }, { status: 400 });
    }
  }

  const totalTargets = [...memberIds].filter((id) => id !== profile.id).length;
  const { covered, openings } = await prisma.$transaction(async (tx) => {
    for (const obs of observations) {
      await tx.trustObservation.upsert({
        where: {
          campaignId_aboutUserId_raterUserId: {
            campaignId,
            aboutUserId: obs.aboutUserId,
            raterUserId: profile.id,
          },
        },
        create: {
          teamId,
          campaignId,
          aboutUserId: obs.aboutUserId,
          raterUserId: profile.id,
          answers: obs.answers,
        },
        update: { answers: obs.answers },
      });
    }
    const count = await tx.trustObservation.count({
      where: { campaignId, teamId, raterUserId: profile.id },
    });
    const isCovered = totalTargets > 0 && count >= totalTargets;
    const stepOpenings = isCovered
      ? await advanceCampaignStepForUser(profile.id, "TRUST_360", {
          campaignId,
          db: tx,
          emitNotifications: false,
        })
      : [];
    return { covered: isCovered, openings: stepOpenings };
  });
  await notifyCampaignStepOpenings(openings);

  return NextResponse.json({ ok: true, covered });
}
