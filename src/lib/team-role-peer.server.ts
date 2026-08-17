// ─────────────────────────────────────────────────────────────────────
// Csapattársi szerep-visszajelzés — SZERVER-oldali betöltők (prisma).
// A tiszta aggregátum-logika a team-role-peer.ts-ben él.
// ─────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import {
  aggregatePeerRoleScores,
  poolPeerSelectionsByRatedMember,
  type PeerRoleProfile,
} from "@/lib/team-role-peer";
import type { TeamRoleSelections } from "@/lib/team-role-questions";

/**
 * Peer-profilok egy csapat minden értékelt tagjára (aboutUserId → profil).
 * Alapból MINDEN eddigi kampány-kört összesít; explicit campaignId-nál csak
 * az adott riportkört. Egy párnál a legfrissebb válasz számít.
 *
 * S4: mind az értékelő-, mind az értékelt-halmaz a JELENLEGI
 * csapattagokra szűkül (poolPeerSelectionsByRatedMember) — a kilépett
 * tagok ittmaradt observationjei nélkül az értékelő-szám nem lépheti túl
 * az aktuális taglétszám − 1-et, így a lefedettség sem a 100%-ot; az
 * anonimitás-padló a szűkített halmazon érvényesül.
 */
export async function buildTeamPeerRoleProfiles(
  teamId: string,
  options?: { campaignId?: string },
): Promise<Map<string, PeerRoleProfile>> {
  const [observations, members] = await Promise.all([
    prisma.teamRoleObservation.findMany({
      where: {
        teamId,
        ...(options?.campaignId ? { campaignId: options.campaignId } : {}),
      },
      orderBy: { updatedAt: "asc" },
      select: {
        aboutUserId: true,
        raterUserId: true,
        selections: true,
      },
    }),
    prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    }),
  ]);

  const currentMemberIds = new Set(members.map((m) => m.userId));
  const pooled = poolPeerSelectionsByRatedMember(
    observations.map((obs) => ({
      aboutUserId: obs.aboutUserId,
      raterUserId: obs.raterUserId,
      selections: obs.selections as TeamRoleSelections,
    })),
    currentMemberIds,
  );

  const profiles = new Map<string, PeerRoleProfile>();
  for (const [aboutUserId, selectionSets] of pooled) {
    profiles.set(aboutUserId, aggregatePeerRoleScores(selectionSets));
  }
  return profiles;
}

/**
 * Lefedte-e a rater a kampány cél-csapatának minden AKTUÁLIS tagját
 * (önmagán kívül)? A TEAM_ROLE_360 lépés teljesítés-feltétele.
 */
export async function hasRaterCoveredTeam(
  campaignId: string,
  teamId: string,
  raterUserId: string,
): Promise<boolean> {
  const [members, rated] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    }),
    prisma.teamRoleObservation.findMany({
      where: { campaignId, raterUserId },
      select: { aboutUserId: true },
    }),
  ]);

  const ratedSet = new Set(rated.map((r) => r.aboutUserId));
  const targets = members.map((m) => m.userId).filter((id) => id !== raterUserId);
  if (targets.length === 0) return true;
  return targets.every((id) => ratedSet.has(id));
}
