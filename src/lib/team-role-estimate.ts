// Estimate TeamRole team roles from TRITAN dimension scores
// TRITAN coding: H=Honesty-Humility, E=Emotionality, X=eXtraversion,
//                A=Agreeableness, C=Conscientiousness, O=Openness
// Scores are 0-100 (percentage)

import type { TeamRoleCode, TeamRoleScores } from "./team-role-scoring";
import { TEAM_ROLES } from "./team-role-scoring";

type HexacoCode = "H" | "E" | "X" | "A" | "C" | "O";
type WeightMap = Partial<Record<HexacoCode, number>>;

const TRITAN_DIM_CODES: HexacoCode[] = [
  "H",
  "E",
  "X",
  "A",
  "C",
  "O",
];

/**
 * Becslés csak TELJES dimenzió-készletből készül: részleges (örökség/sérült)
 * score-sorból a hiányzó dimenziók default-feltöltése mért-kinézetű, de
 * valójában kitalált szerepet adna.
 */
export function hasCompleteTritanDims(
  scores: Partial<Record<HexacoCode, number>> | null | undefined,
): scores is Record<HexacoCode, number> {
  return TRITAN_DIM_CODES.every((dim) => typeof scores?.[dim] === "number");
}

// Weights derived from personality-role literature
// Each role gets a weighted sum of TRITAN dim scores (positive = boosted by high score)
export const TRITAN_TEAM_ROLE_WEIGHTS: Record<TeamRoleCode, WeightMap> = {
  OG: { O: +0.45, C: -0.15, H: -0.10, X: -0.10 }, // Creative, unconventional
  KE: { X: +0.45, A: +0.20, O: +0.15, E: -0.10 }, // Outgoing, networker
  KO: { A: +0.30, H: +0.30, C: +0.20, X: +0.10 }, // Mature, trusting chair
  HA: { X: +0.40, A: -0.30, E: -0.20, C: +0.10 }, // Drive, challenge, impatient
  ER: { C: +0.30, O: +0.25, X: -0.20, E: -0.10 }, // Sober, strategic, critical
  CS: { A: +0.45, E: +0.15, X: +0.10, H: +0.10 }, // Cooperative, diplomatic
  MV: { C: +0.45, H: +0.25, O: -0.15, E: -0.05 }, // Disciplined, reliable
  MI: { C: +0.30, E: +0.25, X: -0.20, O: -0.05 }, // Painstaking, quality-focused
  SZ: { O: +0.30, C: +0.25, X: -0.15, A: -0.05 }, // Single-minded, dedicated
};

/**
 * Kerekítetlen becslés-összegek. A megjelenítés a kerekített változatot
 * használja (estimateTeamRolesFromTritan); a kerekítetlen érték a
 * top-rangsor holtverseny-feloldásának evidenciája (S2): két azonosra
 * kerekített szerep közül az áll előrébb, amelyik súlyozott összege
 * ténylegesen magasabb.
 */
function estimateTeamRolesRaw(
  tritan: Record<HexacoCode, number>,
): Record<TeamRoleCode, number> {
  const raw = {} as Record<TeamRoleCode, number>;

  for (const roleCode of Object.keys(TEAM_ROLES) as TeamRoleCode[]) {
    const weights = TRITAN_TEAM_ROLE_WEIGHTS[roleCode];
    let score = 50; // baseline
    for (const [dim, w] of Object.entries(weights) as [HexacoCode, number][]) {
      const dimVal = tritan[dim] ?? 50;
      score += (dimVal - 50) * w;
    }
    raw[roleCode] = Math.max(0, score);
  }

  return raw;
}

// Estimate TeamRole scores from TRITAN dimension scores (0-100 range)
// Returns TeamRoleScores where values are arbitrary weighted sums (not constrained to 0-10)
// Suitable for relative ranking, not absolute comparison to questionnaire scores
export function estimateTeamRolesFromTritan(
  tritan: Record<HexacoCode, number>,
): TeamRoleScores {
  const raw = estimateTeamRolesRaw(tritan);
  const rounded = {} as TeamRoleScores;
  for (const roleCode of Object.keys(raw) as TeamRoleCode[]) {
    rounded[roleCode] = Math.round(raw[roleCode]);
  }
  return rounded;
}

// A megjelenítési precedencia-szabály egyetlen helyen: kitöltött kérdőív >
// TRITAN-becslés. A perzisztált pontszámok kulcsai közül csak az ismert
// szerep-kódokat tartjuk meg (legacy kulcsú régi sorokra becslés-fallback),
// hogy a TEAM_ROLES-feloldás sose fusson undefined-ra. Null, ha se mért
// eredmény, se teljes dimenzió-készlet nincs — ilyenkor nincs mit mutatni.
// Becslés-ágon az `exact` a kerekítetlen összegeket hordozza — a getTopRoles
// holtverseny-evidenciája; mért ágon nincs (a perzisztált pontszám a jel).
export function resolveDisplayRoleScores(
  measured: Record<string, number> | null | undefined,
  tritan: Partial<Record<HexacoCode, number>> | null | undefined,
): {
  scores: TeamRoleScores;
  source: "questionnaire" | "estimate";
  exact?: Partial<Record<TeamRoleCode, number>>;
} | null {
  if (measured) {
    // Own-key szűrés (nem prototípus-lánc): egy `in`-alapú szűrő a
    // "constructor"/"toString" jellegű kulcsokat is átengedné — a
    // getTopRoles (team-role-scoring) ugyanezért Object.hasOwn-t használ.
    const filtered = Object.fromEntries(
      Object.entries(measured).filter(([code]) => Object.hasOwn(TEAM_ROLES, code)),
    );
    // Mért ágnak MIND a 9 kanonikus szerep-kód kell: egy részleges sor
    // (pl. {"OG": 100} — örökség/sérült adat) mértként elfogadva a többi
    // 8 szerepre elnyomná a becslést, és csonka profilt mutatna
    // „kitöltött" badge-dzsel. A valódi submit (calculateTeamRoleScores)
    // mindig mind a 9 kódot perzisztálja, így élő adatot ez nem érint.
    const complete = (Object.keys(TEAM_ROLES) as TeamRoleCode[]).every(
      (code) => typeof filtered[code] === "number",
    );
    if (complete) {
      return { scores: filtered as TeamRoleScores, source: "questionnaire" };
    }
  }
  if (!hasCompleteTritanDims(tritan)) return null;
  return {
    scores: estimateTeamRolesFromTritan(tritan),
    source: "estimate",
    exact: estimateTeamRolesRaw(tritan),
  };
}
