// ─────────────────────────────────────────────────────────────────────
// Csapattársi szerep-visszajelzés (peer-kör) — TISZTA aggregátum-logika.
// Prisma-mentes, kliens-oldalon is importálható. A szerver-oldali
// betöltés a team-role-peer.server.ts-ben él.
//
// Anonimitás-szabály: aggregált kép CSAK legalább MIN_RATERS értékelőnél
// létezik — alatta null (a pulse-küszöb mintája). Terv és döntések:
// docs/product/team-role-360-plan.md
// ─────────────────────────────────────────────────────────────────────

import {
  calculateTeamRoleScores,
  getTopRoles,
  TEAM_ROLES,
  type TeamRoleCode,
  type TeamRoleScores,
} from "./team-role-scoring";
import type { TeamRoleSelections } from "./team-role-questions";

export const TEAM_ROLE_PEER_MIN_RATERS = 3;

export interface PeerRoleProfile {
  /** Hány értékelő visszajelzéséből áll össze a kép. */
  raterCount: number;
  /** Átlagolt szerep-profil (0–100) — null, ha raterCount < küszöb. */
  scores: TeamRoleScores | null;
  /** Top 3 szerep a peer-kép alapján — üres, ha küszöb alatt. */
  topRoles: { role: TeamRoleCode; score: number }[];
}

/**
 * Peer-profil egy értékelt személyre: raterenkénti szerep-profilok
 * átlaga. Küszöb alatt csak a darabszámot adjuk vissza (scores: null).
 */
export function aggregatePeerRoleScores(
  selectionSets: TeamRoleSelections[],
): PeerRoleProfile {
  const raterCount = selectionSets.length;
  if (raterCount < TEAM_ROLE_PEER_MIN_RATERS) {
    return { raterCount, scores: null, topRoles: [] };
  }

  const sums = Object.fromEntries(
    Object.keys(TEAM_ROLES).map((k) => [k, 0]),
  ) as TeamRoleScores;

  for (const selections of selectionSets) {
    const profile = calculateTeamRoleScores(selections);
    for (const role of Object.keys(sums) as TeamRoleCode[]) {
      sums[role] += profile[role];
    }
  }

  const scores = Object.fromEntries(
    (Object.keys(sums) as TeamRoleCode[]).map((role) => [
      role,
      Math.round(sums[role] / raterCount),
    ]),
  ) as TeamRoleScores;

  return { raterCount, scores, topRoles: getTopRoles(scores) };
}

/**
 * Önkép vs. csapatkép: a két top-3 halmaz metszete/eltérése.
 * A debrief kulcs-száma — csak akkor értelmezhető, ha mindkét oldal él.
 */
export function compareSelfAndPeerTopRoles(
  selfTop: { role: TeamRoleCode }[],
  peerTop: { role: TeamRoleCode }[],
): {
  shared: TeamRoleCode[];
  selfOnly: TeamRoleCode[];
  peerOnly: TeamRoleCode[];
} {
  const selfSet = new Set(selfTop.map((r) => r.role));
  const peerSet = new Set(peerTop.map((r) => r.role));
  return {
    shared: [...selfSet].filter((r) => peerSet.has(r)),
    selfOnly: [...selfSet].filter((r) => !peerSet.has(r)),
    peerOnly: [...peerSet].filter((r) => !selfSet.has(r)),
  };
}
