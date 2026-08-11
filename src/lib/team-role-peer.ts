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
import { MIN_RATERS_FOR_ANONYMOUS_AGGREGATE } from "./anonymity";

export const TEAM_ROLE_PEER_MIN_RATERS = MIN_RATERS_FOR_ANONYMOUS_AGGREGATE;

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

  // Kerekítetlen átlagok: a top-rangsor holtverseny-feloldásához ez a valódi
  // evidencia (S2) — két azonosra kerekített szerep közül az áll előrébb,
  // amelyik mögött ténylegesen magasabb az átlag. A megjelenített scores
  // marad egészre kerekítve.
  const exactMeans = Object.fromEntries(
    (Object.keys(sums) as TeamRoleCode[]).map((role) => [
      role,
      sums[role] / raterCount,
    ]),
  ) as Record<TeamRoleCode, number>;

  const scores = Object.fromEntries(
    (Object.keys(exactMeans) as TeamRoleCode[]).map((role) => [
      role,
      Math.round(exactMeans[role]),
    ]),
  ) as TeamRoleScores;

  return { raterCount, scores, topRoles: getTopRoles(scores, 3, exactMeans) };
}

/** Egy nyers peer-observation sor (a szerver-oldali betöltő alakja). */
export interface PeerObservationRow {
  aboutUserId: string;
  raterUserId: string;
  selections: TeamRoleSelections;
}

/**
 * Observation-sorok → értékelt tagonkénti selection-halmazok (S4 fix).
 *
 * A rater- ÉS az értékelt-halmaz a JELENLEGI csapattagokra szűkül:
 *  - a kilépett tagok korábbi körökből ittmaradt jelölései nélkül az
 *    értékelő-szám felülről korlátos (≤ aktuális taglétszám − 1), tehát a
 *    lefedettség (értékelők / aktuális tagok) nem lépheti túl a 100%-ot;
 *  - a kilépők elavult adata nem keveredik súlyozatlanul a friss körbe.
 * Egy (értékelt, értékelő) párnál a LEGUTOLSÓ kör számít — a sorokat
 * updatedAt szerint NÖVEKVŐ sorrendben kell átadni, a későbbi felülírja a
 * korábbit. Az anonimitás-padló (≥ TEAM_ROLE_PEER_MIN_RATERS) a szűkítés
 * UTÁN, az aggregátorban érvényesül — ha a szűrés küszöb alá visz, a profil
 * helyesen rejtve marad.
 */
export function poolPeerSelectionsByRatedMember(
  observations: PeerObservationRow[],
  currentMemberIds: ReadonlySet<string>,
): Map<string, TeamRoleSelections[]> {
  const byAbout = new Map<string, Map<string, TeamRoleSelections>>();
  for (const obs of observations) {
    if (!currentMemberIds.has(obs.raterUserId)) continue;
    if (!currentMemberIds.has(obs.aboutUserId)) continue;
    // Védekező ág: önjelölés nem peer-adat (a beküldő API is tiltja).
    if (obs.aboutUserId === obs.raterUserId) continue;
    const raters =
      byAbout.get(obs.aboutUserId) ?? new Map<string, TeamRoleSelections>();
    raters.set(obs.raterUserId, obs.selections);
    byAbout.set(obs.aboutUserId, raters);
  }
  const pooled = new Map<string, TeamRoleSelections[]>();
  for (const [aboutUserId, raters] of byAbout) {
    pooled.set(aboutUserId, [...raters.values()]);
  }
  return pooled;
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
