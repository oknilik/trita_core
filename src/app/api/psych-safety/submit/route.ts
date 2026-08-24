import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isCompletePsychSafetyAnswerSet } from "@/lib/psych-safety";
import { isStepOpenFor } from "@/lib/campaign-steps-core";
import {
  notifyCampaignStepOpenings,
  resolveCampaignTeamIdForUser,
} from "@/lib/campaign-steps";
import { recordAnonymousPsychSafetyResponse } from "@/lib/psych-safety-submit.server";

const bodySchema = z.object({
  campaignId: z.string().min(1),
  answers: z.record(z.string(), z.number()),
});

/**
 * POST /api/psych-safety/submit — anonim pulse-válasz beküldése.
 *
 * Anonimitás-terv:
 * - A válaszrekord user-referencia NÉLKÜL jön létre (PsychSafetyResponse).
 * - A beküldési időt nap pontosságúra csonkoljuk, hogy a kitöltöttségi
 *   időbélyeggel (CampaignParticipant.completedAt) ne legyen párosítható.
 * - A kitöltöttség tényét a résztvevő-rekordon jelöljük, értékek nélkül —
 *   ez kell az emlékeztetőkhöz és a lefedettség kijelzéséhez.
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

  if (!isCompletePsychSafetyAnswerSet(body.data.answers)) {
    return NextResponse.json({ error: "INCOMPLETE_ANSWERS" }, { status: 400 });
  }

  const participant = await prisma.campaignParticipant.findUnique({
    where: {
      campaignId_userId: { campaignId: body.data.campaignId, userId: profile.id },
    },
    select: {
      id: true,
      completedAt: true,
      currentStep: true,
      nextStepOpensAt: true,
      campaign: {
        select: { id: true, type: true, status: true, steps: true, teamId: true, teamIds: true },
      },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (participant.campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "CAMPAIGN_NOT_ACTIVE" }, { status: 409 });
  }
  if (participant.completedAt) {
    // A korábbi anonim válasz már biztonságban van. A retry sikert ad; a
    // léptetés idempotens, ezért egy régi részleges tranzakciót is reconciliál.
    const { advanceCampaignStepForUser } = await import("@/lib/campaign-steps");
    const openings = await advanceCampaignStepForUser(profile.id, "PSYCH_SAFETY", {
      campaignId: body.data.campaignId,
      emitNotifications: false,
    });
    await notifyCampaignStepOpenings(openings);
    return NextResponse.json({ ok: true, replayed: true });
  }
  // Több-lépéses kampány: a pulse csak akkor tölthető, ha épp ez a nyitott lépés.
  if (!isStepOpenFor(participant.campaign, participant, "PSYCH_SAFETY")) {
    return NextResponse.json({ error: "STEP_LOCKED" }, { status: 409 });
  }
  const teamId = await resolveCampaignTeamIdForUser(participant.campaign, profile.id);
  if (!teamId) return NextResponse.json({ error: "NO_TARGET_TEAM" }, { status: 409 });

  // Nap pontosságúra csonkolt beküldési dátum (anonimitás).
  const submittedOn = new Date();
  submittedOn.setUTCHours(0, 0, 0, 0);

  const recorded = await recordAnonymousPsychSafetyResponse({
    participantId: participant.id,
    profileId: profile.id,
    campaignId: body.data.campaignId,
    teamId,
    answers: body.data.answers,
    submittedOn,
  });
  if (!recorded.created) {
    const { advanceCampaignStepForUser } = await import("@/lib/campaign-steps");
    const openings = await advanceCampaignStepForUser(profile.id, "PSYCH_SAFETY", {
      campaignId: body.data.campaignId,
      emitNotifications: false,
    });
    await notifyCampaignStepOpenings(openings);
    return NextResponse.json({ ok: true, replayed: true });
  }
  await notifyCampaignStepOpenings(recorded.openings);
  const { handleCampaignProgressMilestone } = await import("@/lib/notifications");
  await handleCampaignProgressMilestone(body.data.campaignId);

  return NextResponse.json({ ok: true });
}
