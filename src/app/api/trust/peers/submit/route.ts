import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isStepOpenFor } from "@/lib/campaign-steps-core";
import {
  advanceCampaignStepForUser,
  notifyCampaignStepOpenings,
} from "@/lib/campaign-steps";
import { isValidTrustAnswerSet } from "@/lib/trust-network";
import {
  hasCoveredCurrentPeerTargets,
  lockAndValidatePeerSubmission,
} from "@/lib/peer-submission-coverage";

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
      campaign: { select: { status: true, type: true, steps: true } },
    },
  });
  if (!participant) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (participant.campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "CAMPAIGN_NOT_ACTIVE" }, { status: 409 });
  }
  if (!isStepOpenFor(participant.campaign, participant, "TRUST_360")) {
    return NextResponse.json({ error: "STEP_LOCKED" }, { status: 409 });
  }
  const result = await prisma.$transaction(async (tx) => {
    // A zar a teljes upsert + coverage + advance kritikus szakaszt
    // serializalja kampany + ertekelo szinten. Kulonben ket egyideju,
    // kulon celra irt observation egyike sem feltetlenul latna a masikat.
    const guard = await lockAndValidatePeerSubmission(
      tx,
      campaignId,
      profile.id,
      "TRUST_360",
    );
    if (!guard.ok) return { ok: false as const, error: guard.error };

    // A célcsapatot és annak tagságát a sorzár megszerzése után olvassuk:
    // egy záron váró, időközben stale-lé vált kérés így nem írhat régi
    // csapatra, és nem értékelhet már kilépett tagot.
    const currentMembers = await tx.teamMember.findMany({
      where: { teamId: guard.teamId },
      select: { userId: true },
    });
    const memberIds = new Set(currentMembers.map((member) => member.userId));
    if (
      observations.some(
        (observation) => !memberIds.has(observation.aboutUserId),
      )
    ) {
      return { ok: false as const, error: "NOT_A_TEAM_MEMBER" as const };
    }

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
          teamId: guard.teamId,
          campaignId,
          aboutUserId: obs.aboutUserId,
          raterUserId: profile.id,
          answers: obs.answers,
        },
        // A csapathatar az update-agban is koveti az aktualisan feloldott
        // celcsapatot; kulonben egy korabbi, stale teamId-ju sor az uj
        // bekuldes utan sem szamitana bele a helyes korbe.
        update: { teamId: guard.teamId, answers: obs.answers },
      });
    }

    const rated = await tx.trustObservation.findMany({
      where: { campaignId, teamId: guard.teamId, raterUserId: profile.id },
      select: { aboutUserId: true },
    });
    const isCovered = hasCoveredCurrentPeerTargets(
      currentMembers.map((member) => member.userId),
      profile.id,
      rated.map((observation) => observation.aboutUserId),
    );
    const stepOpenings = isCovered
      ? await advanceCampaignStepForUser(profile.id, "TRUST_360", {
          campaignId,
          db: tx,
          emitNotifications: false,
        })
      : [];
    return {
      ok: true as const,
      covered: isCovered,
      openings: stepOpenings,
    };
  });

  if (!result.ok) {
    const status =
      result.error === "NOT_A_TEAM_MEMBER"
        ? 400
        : result.error === "NOT_FOUND"
          ? 404
          : 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  await notifyCampaignStepOpenings(result.openings);

  return NextResponse.json({ ok: true, covered: result.covered });
}
