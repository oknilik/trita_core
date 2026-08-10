// Estimate TeamRole team roles from TRITAN dimension scores
// TRITAN coding: H=Honesty-Humility, E=Emotionality, X=eXtraversion,
//                A=Agreeableness, C=Conscientiousness, O=Openness
// Scores are 0-100 (percentage)

import type { TeamRoleCode, TeamRoleScores } from "./team-role-scoring";
import { TEAM_ROLES } from "./team-role-scoring";

type TritanDimCode = "INTE" | "RESO" | "TEMP" | "ADAP" | "THOR" | "OPEN";
type WeightMap = Partial<Record<TritanDimCode, number>>;

const TRITAN_DIM_CODES: TritanDimCode[] = [
  "INTE",
  "RESO",
  "TEMP",
  "ADAP",
  "THOR",
  "OPEN",
];

/**
 * Becslés csak TELJES dimenzió-készletből készül: részleges (örökség/sérült)
 * score-sorból a hiányzó dimenziók default-feltöltése mért-kinézetű, de
 * valójában kitalált szerepet adna.
 */
export function hasCompleteTritanDims(
  scores: Partial<Record<TritanDimCode, number>> | null | undefined,
): scores is Record<TritanDimCode, number> {
  return TRITAN_DIM_CODES.every((dim) => typeof scores?.[dim] === "number");
}

// Weights derived from personality-role literature
// Each role gets a weighted sum of TRITAN dim scores (positive = boosted by high score)
export const TRITAN_TEAM_ROLE_WEIGHTS: Record<TeamRoleCode, WeightMap> = {
  OG: { OPEN: +0.45, THOR: -0.15, INTE: -0.10, TEMP: -0.10 }, // Creative, unconventional
  KE: { TEMP: +0.45, ADAP: +0.20, OPEN: +0.15, RESO: -0.10 }, // Outgoing, networker
  KO: { ADAP: +0.30, INTE: +0.30, THOR: +0.20, TEMP: +0.10 }, // Mature, trusting chair
  HA: { TEMP: +0.40, ADAP: -0.30, RESO: -0.20, THOR: +0.10 }, // Drive, challenge, impatient
  ER: { THOR: +0.30, OPEN: +0.25, TEMP: -0.20, RESO: -0.10 }, // Sober, strategic, critical
  CS: { ADAP: +0.45, RESO: +0.15, TEMP: +0.10, INTE: +0.10 }, // Cooperative, diplomatic
  MV: { THOR: +0.45, INTE: +0.25, OPEN: -0.15, RESO: -0.05 }, // Disciplined, reliable
  MI: { THOR: +0.30, RESO: +0.25, TEMP: -0.20, OPEN: -0.05 }, // Painstaking, quality-focused
  SZ: { OPEN: +0.30, THOR: +0.25, TEMP: -0.15, ADAP: -0.05 }, // Single-minded, dedicated
};

// Estimate TeamRole scores from TRITAN dimension scores (0-100 range)
// Returns TeamRoleScores where values are arbitrary weighted sums (not constrained to 0-10)
// Suitable for relative ranking, not absolute comparison to questionnaire scores
export function estimateTeamRolesFromTritan(
  tritan: Record<TritanDimCode, number>,
): TeamRoleScores {
  const raw = {} as TeamRoleScores;

  for (const roleCode of Object.keys(TEAM_ROLES) as TeamRoleCode[]) {
    const weights = TRITAN_TEAM_ROLE_WEIGHTS[roleCode];
    let score = 50; // baseline
    for (const [dim, w] of Object.entries(weights) as [TritanDimCode, number][]) {
      const dimVal = tritan[dim] ?? 50;
      score += (dimVal - 50) * w;
    }
    raw[roleCode] = Math.max(0, Math.round(score));
  }

  return raw;
}

// A megjelenítési precedencia-szabály egyetlen helyen: kitöltött kérdőív >
// TRITAN-becslés. A perzisztált pontszámok kulcsai közül csak az ismert
// szerep-kódokat tartjuk meg (legacy kulcsú régi sorokra becslés-fallback),
// hogy a TEAM_ROLES-feloldás sose fusson undefined-ra. Null, ha se mért
// eredmény, se teljes dimenzió-készlet nincs — ilyenkor nincs mit mutatni.
export function resolveDisplayRoleScores(
  measured: Record<string, number> | null | undefined,
  tritan: Partial<Record<TritanDimCode, number>> | null | undefined,
): { scores: TeamRoleScores; source: "questionnaire" | "estimate" } | null {
  if (measured) {
    const filtered = Object.fromEntries(
      Object.entries(measured).filter(([code]) => code in TEAM_ROLES),
    );
    if (Object.keys(filtered).length > 0) {
      return { scores: filtered as TeamRoleScores, source: "questionnaire" };
    }
  }
  if (!hasCompleteTritanDims(tritan)) return null;
  return { scores: estimateTeamRolesFromTritan(tritan), source: "estimate" };
}
