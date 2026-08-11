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

/**
 * A csapat bizalmi hálója. MINDEN eddigi kampány-kör megfigyeléseit
 * összesíti; egy (aboutUserId, raterUserId) párnál a legfrissebb kör
 * számít — az ismételt körök felülírják a korábbit, nem duplázódnak.
 */
export async function buildTeamTrustNetwork(
  teamId: string,
): Promise<TrustNetwork> {
  const [observations, members] = await Promise.all([
    prisma.trustObservation.findMany({
      where: { teamId },
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
      where: { campaignId, raterUserId },
      select: { aboutUserId: true },
    }),
  ]);

  const ratedSet = new Set(rated.map((r) => r.aboutUserId));
  const targets = members.map((m) => m.userId).filter((id) => id !== raterUserId);
  if (targets.length === 0) return true;
  return targets.every((id) => ratedSet.has(id));
}
