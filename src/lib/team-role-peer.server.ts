// ─────────────────────────────────────────────────────────────────────
// Csapattársi szerep-visszajelzés — SZERVER-oldali betöltők (prisma).
// A tiszta aggregátum-logika a team-role-peer.ts-ben él.
// ─────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import {
  aggregatePeerRoleScores,
  type PeerRoleProfile,
} from "@/lib/team-role-peer";
import type { TeamRoleSelections } from "@/lib/team-role-questions";

/**
 * Peer-profilok egy csapat minden értékelt tagjára (aboutUserId →
 * profil). MINDEN eddigi kampány-kör observationjeit összesíti; egy
 * (aboutUserId, raterUserId) párnál a legfrissebb kör számít, hogy az
 * ismételt körök felülírják a korábbit, ne duplázódjanak.
 */
export async function buildTeamPeerRoleProfiles(
  teamId: string,
): Promise<Map<string, PeerRoleProfile>> {
  const observations = await prisma.teamRoleObservation.findMany({
    where: { teamId },
    orderBy: { updatedAt: "asc" },
    select: {
      aboutUserId: true,
      raterUserId: true,
      selections: true,
    },
  });

  // aboutUserId → (raterUserId → legfrissebb selections)
  const byAbout = new Map<string, Map<string, TeamRoleSelections>>();
  for (const obs of observations) {
    const raters = byAbout.get(obs.aboutUserId) ?? new Map();
    raters.set(obs.raterUserId, obs.selections as TeamRoleSelections);
    byAbout.set(obs.aboutUserId, raters);
  }

  const profiles = new Map<string, PeerRoleProfile>();
  for (const [aboutUserId, raters] of byAbout) {
    profiles.set(aboutUserId, aggregatePeerRoleScores([...raters.values()]));
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
