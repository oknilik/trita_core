export type ProfileCategory = "high" | "medium" | "low";

export type ActivePair = {
  dimA: string;
  dimB: string;
  risk: boolean;
  contentKey: string;
};

export type SoloDim = {
  dim: string;
  level: ProfileCategory;
};

export type ProfileEngineOutput = {
  categories: Record<string, ProfileCategory>;
  block6Pairs: ActivePair[];
  block7Pairs: ActivePair[];
  showBlock6: boolean;
  showBlock7: boolean;
  topSoloDims: SoloDim[];
};

// Pólus-küszöbök — a kategorizálás házi konvenciója (szigorú > / <
// összehasonlítás). Az interakció-motor és a csapat-pressure ugyanezt a
// határt importálja, hogy a küszöb ne csússzon szét.
export const PROFILE_HIGH_THRESHOLD = 65;
export const PROFILE_LOW_THRESHOLD = 35;

function categorize(score: number): ProfileCategory {
  if (score > PROFILE_HIGH_THRESHOLD) return "high";
  if (score < PROFILE_LOW_THRESHOLD) return "low";
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

export const TENSION_PAIRS: TensionPairDef[] = [
  { dimA: "INTE", levelA: "high", dimB: "TEMP", levelB: "high", risk: false, contentKey: "ethicalLeader" },
  { dimA: "INTE", levelA: "high", dimB: "ADAP", levelB: "low",  risk: false, contentKey: "principledConfronter" },
  { dimA: "INTE", levelA: "high", dimB: "OPEN", levelB: "high", risk: false, contentKey: "responsibleInnovator" },
  { dimA: "RESO", levelA: "high", dimB: "TEMP", levelB: "high", risk: true,  contentKey: "supportedVisibility" },
  { dimA: "RESO", levelA: "high", dimB: "THOR", levelB: "high", risk: true,  contentKey: "structuredStability" },
  { dimA: "RESO", levelA: "high", dimB: "OPEN", levelB: "high", risk: true,  contentKey: "safeExperimentation" },
  { dimA: "TEMP", levelA: "low",  dimB: "ADAP", levelB: "high", risk: false, contentKey: "deepCollaboration" },
  { dimA: "TEMP", levelA: "low",  dimB: "OPEN", levelB: "high", risk: false, contentKey: "solitaryInnovator" },
  { dimA: "ADAP", levelA: "high", dimB: "OPEN", levelB: "high", risk: false, contentKey: "facilitatedInnovation" },
  { dimA: "ADAP", levelA: "low",  dimB: "THOR", levelB: "high", risk: false, contentKey: "structuredCompetitor" },
  { dimA: "THOR", levelA: "high", dimB: "OPEN", levelB: "high", risk: false, contentKey: "structuredInnovator" },
  // New pairs – congruent combinations
  { dimA: "RESO", levelA: "low",  dimB: "TEMP", levelB: "high", risk: false, contentKey: "resilientLeader" },
  { dimA: "RESO", levelA: "low",  dimB: "THOR", levelB: "high", risk: false, contentKey: "calmExecution" },
  { dimA: "RESO", levelA: "low",  dimB: "OPEN", levelB: "high", risk: false, contentKey: "exploratoryAnalyst" },
  { dimA: "TEMP", levelA: "high", dimB: "THOR", levelB: "high", risk: false, contentKey: "organizedLeader" },
  { dimA: "TEMP", levelA: "high", dimB: "ADAP", levelB: "high", risk: false, contentKey: "harmoniousConnector" },
  { dimA: "INTE", levelA: "low",  dimB: "THOR", levelB: "high", risk: false, contentKey: "performanceDriver" },
  { dimA: "ADAP", levelA: "low",  dimB: "OPEN", levelB: "high", risk: false, contentKey: "disruptiveInnovator" },
];

function getTopSoloDims(
  normalized: Record<string, number>,
  categories: Record<string, ProfileCategory>,
  count = 2
): SoloDim[] {
  return Object.entries(categories)
    .filter(([, level]) => level === "high" || level === "low")
    .map(([dim, level]) => ({
      dim,
      level,
      deviation: Math.abs((normalized[dim] ?? 50) - 50),
    }))
    .sort((a, b) => b.deviation - a.deviation)
    .slice(0, count)
    .map(({ dim, level }) => ({ dim, level }));
}

export function runProfileEngine(
  dimensions: Record<string, number>,
  _testType: string
): ProfileEngineOutput {
  const categories: Record<string, ProfileCategory> = {};
  for (const [code, score] of Object.entries(dimensions)) {
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

  const topSoloDims = getTopSoloDims(dimensions, categories);

  return {
    categories,
    block6Pairs,
    block7Pairs,
    showBlock6: block6Pairs.length > 0,
    showBlock7: block7Pairs.length > 0,
    topSoloDims,
  };
}
