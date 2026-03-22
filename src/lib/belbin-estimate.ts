// Estimate Belbin team roles from HEXACO dimension scores
// HEXACO coding: H=Honesty-Humility, E=Emotionality, X=eXtraversion,
//                A=Agreeableness, C=Conscientiousness, O=Openness
// Scores are 0-100 (percentage)

import type { BelbinRoleCode, BelbinScores } from "./belbin-scoring";
import { BELBIN_ROLES } from "./belbin-scoring";

type HexacoDimCode = "H" | "E" | "X" | "A" | "C" | "O";
type WeightMap = Partial<Record<HexacoDimCode, number>>;

// Weights derived from personality-role literature
// Each role gets a weighted sum of HEXACO dim scores (positive = boosted by high score)
export const HEXACO_BELBIN_WEIGHTS: Record<BelbinRoleCode, WeightMap> = {
  PL: { O: +0.45, C: -0.15, H: -0.10, X: -0.10 }, // Creative, unconventional
  RI: { X: +0.45, A: +0.20, O: +0.15, E: -0.10 }, // Outgoing, networker
  CO: { A: +0.30, H: +0.30, C: +0.20, X: +0.10 }, // Mature, trusting chair
  SH: { X: +0.40, A: -0.30, E: -0.20, C: +0.10 }, // Drive, challenge, impatient
  ME: { C: +0.30, O: +0.25, X: -0.20, E: -0.10 }, // Sober, strategic, critical
  TW: { A: +0.45, E: +0.15, X: +0.10, H: +0.10 }, // Cooperative, diplomatic
  IM: { C: +0.45, H: +0.25, O: -0.15, E: -0.05 }, // Disciplined, reliable
  CF: { C: +0.30, E: +0.25, X: -0.20, O: -0.05 }, // Painstaking, anxious
  SP: { O: +0.30, C: +0.25, X: -0.15, A: -0.05 }, // Single-minded, dedicated
};

// Estimate Belbin scores from HEXACO dimension scores (0-100 range)
// Returns BelbinScores where values are arbitrary weighted sums (not constrained to 0-10)
// Suitable for relative ranking, not absolute comparison to questionnaire scores
export function estimateBelbinFromHexaco(
  hexaco: Record<HexacoDimCode, number>,
): BelbinScores {
  const raw = {} as BelbinScores;

  for (const roleCode of Object.keys(BELBIN_ROLES) as BelbinRoleCode[]) {
    const weights = HEXACO_BELBIN_WEIGHTS[roleCode];
    let score = 50; // baseline
    for (const [dim, w] of Object.entries(weights) as [HexacoDimCode, number][]) {
      const dimVal = hexaco[dim] ?? 50;
      score += (dimVal - 50) * w;
    }
    raw[roleCode] = Math.max(0, Math.round(score));
  }

  return raw;
}
