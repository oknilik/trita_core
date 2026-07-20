// ─────────────────────────────────────────────────────────────────────
// Trita csapatszerep-modell — 9 szerep, saját névtér és scoring.
//
// A korábbi 7×8-as pontelosztásos SPI-scoring kivezetve (jogi kiváltás,
// ld. docs/product/team-role-instrument-replacement-plan.md). Az új
// formátum: 27 itemes kiválasztás (8–12 jelölés + 3 kiemelt, dupla
// súllyal) — az itembank a team-role-questions.ts-ben él, és self + peer
// perspektívában ugyanaz.
// ─────────────────────────────────────────────────────────────────────

import type { TeamRoleSelections } from "./team-role-questions";

export const TEAM_ROLES = {
  OG: { hu: "Ötletgazda", en: "Idea Generator" },
  KE: { hu: "Kapcsolatépítő", en: "Opportunity Scout" },
  KO: { hu: "Koordinátor", en: "Coordinator" },
  HA: { hu: "Hajtóerő", en: "Driver" },
  ER: { hu: "Értékelő-elemző", en: "Critical Evaluator" },
  CS: { hu: "Csapatsegítő", en: "Team Supporter" },
  MV: { hu: "Megvalósító", en: "Executor" },
  MI: { hu: "Minőségőr", en: "Quality Guardian" },
  SZ: { hu: "Szakértő", en: "Domain Expert" },
} as const;

export type TeamRoleCode = keyof typeof TEAM_ROLES;

export type TeamRoleScores = Record<TeamRoleCode, number>;

/** Item-id → szerep-kód (az id prefixe a szerep-kód: "OG1" → "OG"). */
function itemRole(itemId: string): TeamRoleCode | null {
  const prefix = itemId.slice(0, 2);
  return prefix in TEAM_ROLES ? (prefix as TeamRoleCode) : null;
}

/**
 * Szerep-pontszámok egy kiválasztás-halmazból, 0–100 skálán.
 *
 * Szerepenként az elméleti maximum: mind a 3 item kiemelt jelöléssel
 * (3 × 2 = 6 súly) — a gyakorlatban a 3 kiemelt-limit miatt ritka, de a
 * skála így stabil, és a self és peer profilok összevethetők rajta.
 */
export function calculateTeamRoleScores(
  selections: TeamRoleSelections,
): TeamRoleScores {
  const totals = Object.fromEntries(
    Object.keys(TEAM_ROLES).map((k) => [k, 0]),
  ) as TeamRoleScores;

  for (const [itemId, weight] of Object.entries(selections)) {
    const role = itemRole(itemId);
    if (role && (weight === 1 || weight === 2)) {
      totals[role] += weight;
    }
  }

  const MAX_PER_ROLE = 6; // 3 item × 2 súly
  for (const role of Object.keys(totals) as TeamRoleCode[]) {
    totals[role] = Math.round((totals[role] / MAX_PER_ROLE) * 100);
  }

  return totals;
}

export function getTopRoles(
  scores: TeamRoleScores,
  n = 3,
): { role: TeamRoleCode; score: number }[] {
  return (Object.entries(scores) as [TeamRoleCode, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([role, score]) => ({ role, score }));
}
