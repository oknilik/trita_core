export type ProfileCategory = "high" | "medium" | "low";

export type ActivePair = {
  dimA: string;
  dimB: string;
  risk: boolean;
  contentKey: string;
};

export type ProfileEngineOutput = {
  categories: Record<string, ProfileCategory>;
  block6Pairs: ActivePair[];
  block7Pairs: ActivePair[];
  showBlock6: boolean;
  showBlock7: boolean;
};

const HIGH = 65;
const LOW = 35;

function categorize(score: number): ProfileCategory {
  if (score > HIGH) return "high";
  if (score < LOW) return "low";
  return "medium";
}

type TensionPairDef = {
  dimA: string;
  levelA: ProfileCategory;
  dimB: string;
  levelB: ProfileCategory;
  risk: boolean;
  contentKey: string;
};

const TENSION_PAIRS: TensionPairDef[] = [
  { dimA: "H", levelA: "high", dimB: "X", levelB: "high", risk: false, contentKey: "ethicalLeader" },
  { dimA: "H", levelA: "high", dimB: "A", levelB: "low",  risk: false, contentKey: "principledConfronter" },
  { dimA: "H", levelA: "high", dimB: "O", levelB: "high", risk: false, contentKey: "responsibleInnovator" },
  { dimA: "E", levelA: "high", dimB: "X", levelB: "high", risk: true,  contentKey: "supportedVisibility" },
  { dimA: "E", levelA: "high", dimB: "C", levelB: "high", risk: true,  contentKey: "structuredStability" },
  { dimA: "E", levelA: "high", dimB: "O", levelB: "high", risk: true,  contentKey: "safeExperimentation" },
  { dimA: "X", levelA: "low",  dimB: "A", levelB: "high", risk: false, contentKey: "deepCollaboration" },
  { dimA: "X", levelA: "low",  dimB: "O", levelB: "high", risk: false, contentKey: "solitaryInnovator" },
  { dimA: "A", levelA: "high", dimB: "O", levelB: "high", risk: false, contentKey: "facilitatedInnovation" },
  { dimA: "A", levelA: "low",  dimB: "C", levelB: "high", risk: false, contentKey: "structuredCompetitor" },
  { dimA: "C", levelA: "high", dimB: "O", levelB: "high", risk: false, contentKey: "structuredInnovator" },
];

/**
 * Maps Big Five codes to the internal HEXACO-like model:
 * - N (Neuroticism) → E (Emotionality)
 * - E (Extraversion) → X
 * - O, C, A → unchanged
 * - H is not available in Big Five (will be undefined → H-pairs are skipped)
 */
function normalizeToCodes(
  dimensions: Record<string, number>,
  testType: string
): Record<string, number> {
  if (testType === "BIG_FIVE") {
    const normalized: Record<string, number> = {};
    if (dimensions.O !== undefined) normalized.O = dimensions.O;
    if (dimensions.C !== undefined) normalized.C = dimensions.C;
    if (dimensions.A !== undefined) normalized.A = dimensions.A;
    // Big Five E (Extraversion) → internal X
    if (dimensions.E !== undefined) normalized.X = dimensions.E;
    // Big Five N (Neuroticism) → internal E
    if (dimensions.N !== undefined) normalized.E = dimensions.N;
    // H is not available — intentionally omitted
    return normalized;
  }
  // HEXACO and HEXACO_MODIFIED use codes directly
  return dimensions;
}

export function runProfileEngine(
  dimensions: Record<string, number>,
  testType: string
): ProfileEngineOutput {
  const normalized = normalizeToCodes(dimensions, testType);

  const categories: Record<string, ProfileCategory> = {};
  for (const [code, score] of Object.entries(normalized)) {
    // Skip interstitial dimensions like "I" (Altruism)
    if (code === "I") continue;
    categories[code] = categorize(score);
  }

  const activeTensionPairs: ActivePair[] = [];
  for (const def of TENSION_PAIRS) {
    const catA = categories[def.dimA];
    const catB = categories[def.dimB];
    // Skip if either dimension is not available (e.g. H in Big Five)
    if (!catA || !catB) continue;
    if (catA === def.levelA && catB === def.levelB) {
      activeTensionPairs.push({
        dimA: def.dimA,
        dimB: def.dimB,
        risk: def.risk,
        contentKey: def.contentKey,
      });
    }
  }

  const block6Pairs = activeTensionPairs.filter((p) => !p.risk);
  const block7Pairs = activeTensionPairs.filter((p) => p.risk);

  return {
    categories,
    block6Pairs,
    block7Pairs,
    showBlock6: block6Pairs.length > 0,
    showBlock7: block7Pairs.length > 0,
  };
}
