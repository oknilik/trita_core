import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isCompletePsychSafetyAnswerSet } from "@/lib/psych-safety";
import { isStepOpenFor } from "@/lib/campaign-steps-core";
import { advanceCampaignStepForUser } from "@/lib/campaign-steps";

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
      campaign: { select: { type: true, status: true, steps: true } },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (participant.campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "CAMPAIGN_NOT_ACTIVE" }, { status: 409 });
  }
  // Több-lépéses kampány: a pulse csak akkor tölthető, ha épp ez a nyitott lépés.
  if (!isStepOpenFor(participant.campaign, participant, "PSYCH_SAFETY")) {
    return NextResponse.json({ error: "STEP_LOCKED" }, { status: 409 });
  }
  if (participant.completedAt) {
    return NextResponse.json({ error: "ALREADY_SUBMITTED" }, { status: 409 });
  }

  // Nap pontosságúra csonkolt beküldési dátum (anonimitás).
  const submittedOn = new Date();
  submittedOn.setUTCHours(0, 0, 0, 0);

  await prisma.$transaction([
    prisma.psychSafetyResponse.create({
      data: {
        campaignId: body.data.campaignId,
        answers: body.data.answers,
        submittedOn,
      },
    }),
    prisma.campaignParticipant.update({
      where: { id: participant.id },
      data: { completedAt: new Date() },
    }),
  ]);

  // Lépés-léptetés (következő mérés megnyitása + értesítés)
  await advanceCampaignStepForUser(profile.id, "PSYCH_SAFETY").catch(() => {});

  return NextResponse.json({ ok: true });
}
