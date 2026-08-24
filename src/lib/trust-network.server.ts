// ─────────────────────────────────────────────────────────────────────
// Bizalmi háló — SZERVER-oldali betöltők (prisma). A tiszta háló-logika
// a trust-network.ts-ben él. Minta: team-role-peer.server.ts.
// ─────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import {
  computeTrustNetwork,
  dedupeLatestTrustObservations,
  type TrustAnswerSet,
  type TrustNetwork,
} from "@/lib/trust-network";
import { hasCoveredCurrentPeerTargets } from "@/lib/peer-submission-coverage";

/**
 * A csapat bizalmi hálója. Alapból MINDEN eddigi kampány-kört összesít;
 * explicit campaignId-nál csak az adott riportkört. Egy (aboutUserId,
 * raterUserId) párnál a legfrissebb válasz számít, nincs duplázás.
 */
export async function buildTeamTrustNetwork(
  teamId: string,
  options?: { campaignId?: string },
): Promise<TrustNetwork> {
  const [observations, members] = await Promise.all([
    prisma.trustObservation.findMany({
      where: {
        teamId,
        ...(options?.campaignId ? { campaignId: options.campaignId } : {}),
      },
      orderBy: { updatedAt: "asc" },
      select: { aboutUserId: true, raterUserId: true, answers: true },
    }),
    prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    }),
  ]);

  // (rater → értékelt) páronként a legfrissebb válasz nyer — közös helper
  // (trust-network.ts), a manager-cockpit kötegelt betöltője is ezt használja.
  const deduped = dedupeLatestTrustObservations(
    observations.map((obs) => ({
      aboutUserId: obs.aboutUserId,
      raterUserId: obs.raterUserId,
      answers: obs.answers as TrustAnswerSet,
    })),
  );

  return computeTrustNetwork(
    deduped,
    members.map((m) => m.userId),
  );
}

/**
 * Lefedte-e a rater a kampány cél-csapatának minden AKTUÁLIS tagját
 * (önmagán kívül)? A TRUST_360 lépés teljesítés-feltétele.
 */
export async function hasRaterCoveredTeamTrust(
  campaignId: string,
  teamId: string,
  raterUserId: string,
): Promise<boolean> {
  const [members, rated] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    }),
    prisma.trustObservation.findMany({
      where: { campaignId, teamId, raterUserId },
      select: { aboutUserId: true },
    }),
  ]);

  return hasCoveredCurrentPeerTargets(
    members.map((member) => member.userId),
    raterUserId,
    rated.map((observation) => observation.aboutUserId),
  );
}
