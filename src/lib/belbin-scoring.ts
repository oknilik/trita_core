// Belbin Team Role scoring — standard Self-Perception Inventory mapping
// 7 sections × 8 statements (a–h) × 10 points per section

export const BELBIN_ROLES = {
  PL: { hu: "Ötletgazda",          en: "Plant" },
  RI: { hu: "Erőforrás-felderítő", en: "Resource Investigator" },
  CO: { hu: "Koordinátor",          en: "Coordinator" },
  SH: { hu: "Formáló",             en: "Shaper" },
  ME: { hu: "Értékelő-elemző",     en: "Monitor Evaluator" },
  TW: { hu: "Csapatsegítő",        en: "Teamworker" },
  IM: { hu: "Megvalósító",         en: "Implementer" },
  CF: { hu: "Tökéletesítő",       en: "Completer Finisher" },
  SP: { hu: "Szakember",           en: "Specialist" },
} as const;

export type BelbinRoleCode = keyof typeof BELBIN_ROLES;

// [sectionIndex 0-6][statementIndex 0-7] → role code
// Based on the standard Belbin SPI mapping
export const BELBIN_SCORING_MAP: BelbinRoleCode[][] = [
  ["IM", "SH", "CO", "ME", "RI", "TW", "CF", "PL"], // Section 1
  ["TW", "CF", "RI", "PL", "ME", "CO", "SH", "IM"], // Section 2
  ["PL", "RI", "CO", "SH", "TW", "IM", "ME", "CF"], // Section 3
  ["RI", "TW", "ME", "CO", "CF", "SH", "PL", "IM"], // Section 4
  ["ME", "CO", "IM", "PL", "TW", "CF", "RI", "SH"], // Section 5
  ["CO", "IM", "SH", "RI", "CF", "PL", "TW", "ME"], // Section 6
  ["CF", "PL", "IM", "TW", "SH", "ME", "CO", "RI"], // Section 7
];

export type BelbinAnswers = Record<number, Record<number, number>>;
// answers[groupIndex][statementIndex] = points (0-10 per group, sum must equal 10)

export type BelbinScores = Record<BelbinRoleCode, number>;

export function calculateBelbinScores(answers: BelbinAnswers): BelbinScores {
  const totals = Object.fromEntries(
    Object.keys(BELBIN_ROLES).map((k) => [k, 0]),
  ) as BelbinScores;

  for (let group = 0; group < 7; group++) {
    const groupAnswers = answers[group] ?? {};
    for (let stmt = 0; stmt < 8; stmt++) {
      const points = groupAnswers[stmt] ?? 0;
      const role = BELBIN_SCORING_MAP[group]?.[stmt];
      if (role) {
        totals[role] += points;
      }
    }
  }

  return totals;
}

export function getTopRoles(
  scores: BelbinScores,
  n = 3,
): { role: BelbinRoleCode; score: number }[] {
  return (Object.entries(scores) as [BelbinRoleCode, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([role, score]) => ({ role, score }));
}
