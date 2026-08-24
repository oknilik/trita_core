import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  advanceCampaignStepForUser,
  type CampaignStepOpening,
} from "@/lib/campaign-steps";

/**
 * Egy anonim pulse-válasz atomi rögzítése.
 *
 * A válaszban szándékosan nincs user-azonosító. Emiatt az egyediség csak a
 * résztvevő-sor egyszeri, feltételes claimjével garantálható. Ha két kérés
 * egyszerre fut, pontosan az egyik kapja meg a `completedAt IS NULL` sort;
 * a vesztes kérés nem hozhat létre második, utólag már nem azonosítható
 * anonim választ. A create hibája a claimet is visszagörgeti.
 */
export async function recordAnonymousPsychSafetyResponse(input: {
  participantId: string;
  profileId: string;
  campaignId: string;
  teamId: string;
  answers: Prisma.InputJsonValue;
  submittedOn: Date;
  completedAt?: Date;
}): Promise<{ created: boolean; openings: CampaignStepOpening[] }> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.campaignParticipant.updateMany({
      where: {
        id: input.participantId,
        campaignId: input.campaignId,
        completedAt: null,
      },
      data: { completedAt: input.completedAt ?? new Date() },
    });

    if (claimed.count !== 1) return { created: false, openings: [] };

    await tx.psychSafetyResponse.create({
      data: {
        campaignId: input.campaignId,
        teamId: input.teamId,
        answers: input.answers,
        submittedOn: input.submittedOn,
      },
    });
    const openings = await advanceCampaignStepForUser(input.profileId, "PSYCH_SAFETY", {
      campaignId: input.campaignId,
      db: tx,
      emitNotifications: false,
    });
    return { created: true, openings };
  });
}
