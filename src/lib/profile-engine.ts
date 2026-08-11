import {
  resolvePairTone,
  type DeclaredPairTone,
  type PairTone,
  type ValenceSurface,
} from "@/lib/score-valence";

export type ProfileCategory = "high" | "medium" | "low";

// A hangnem-típusok a kanonikus valencia-modulból jönnek (score-valence.ts) —
// innen csak kényelmi re-export, hogy a megjelenítők egy helyről importáljanak.
export type { DeclaredPairTone, PairTone };

export type ActivePair = {
  dimA: string;
  dimB: string;
  /**
   * A pár megjelenítendő hangneme (a korábbi `risk: boolean` helyett):
   *  - "resolution" — pozitív/semleges feloldás;
   *  - "risk"       — valódi figyelendő mintázat;
   *  - "note"       — semleges mintázat-megfigyelés (fordított skála) —
   *                   TILOS hiányosságként keretezni.
   * A besorolás a score-valence.resolvePairTone-on megy át.
   */
  tone: PairTone;
  contentKey: string;
};

export type SoloDim = {
  dim: string;
  level: ProfileCategory;
};

export type ProfileEngineOutput = {
  categories: Record<string, ProfileCategory>;
  /** Minden aktív pár, a TENSION_PAIRS tábla sorrendjében, hangnemmel. */
  pairs: ActivePair[];
  /** tone === "resolution" — feloldás-narratívák. */
  block6Pairs: ActivePair[];
  /** tone === "risk" — VALÓDI figyelendő párok (deficit-keretezhető). */
  block7Pairs: ActivePair[];
  /** tone === "note" — semleges mintázat-megfigyelések (fordított skála). */
  notePairs: ActivePair[];
  showBlock6: boolean;
  showBlock7: boolean;
  showNotes: boolean;
  topSoloDims: SoloDim[];
};

// Pólus-küszöbök — a kategorizálás házi konvenciója (szigorú > / <
// összehasonlítás). Az interakció-motor és a csapat-pressure ugyanezt a
// határt importálja, hogy a küszöb ne csússzon szét.
//
// TUDATOSAN KÜLÖN a vizuális tier-küszöbtől (dimension-utils.ts
// getDimensionTier = 70/40): ez a 65/35 a tension-pár / interakció / pressure
// NARRATÍVA-logika kapuja (a TENSION_PAIRS „high/low" pólusai erre a vágásra
// vannak hangolva), a 70/40 a vizuális erősség-jelölést vezérli. A kettő egy
// 65–70 (ill. 35–40) közti pontszámnál eltérő besorolást ad — ez a motor-audit
// F3-lelete. NEM hangoljuk össze itt: a 65/35 átállítása 70/40-re elmozdítaná,
// mely tension-párok tüzelnek (tuningolt narratíva-viselkedés). A helyes közös
// vágópont normált mintát (pilot) igényel; addig a duplázódás dokumentált, az
// értékek változatlanok.
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
  /**
   * SZERZŐI hangnem: „ez a mintázat feloldás vagy figyelendő minta?".
   * A MEGJELENÍTENDŐ hangnem ebből a valencia-kapun keresztül áll elő
   * (score-valence.resolvePairTone) — a fordított skálát (E) érintő
   * párok „note"-tá szelídülnek, mert egyik pólusuk sem hiányosság.
   * Itt tehát TILOS kézzel „note"-ot deklarálni: a tábla a tartalom
   * szándékát írja le, a valencia-döntés egy helyen dől el.
   */
  tone: DeclaredPairTone;
  contentKey: string;
};

export const TENSION_PAIRS: TensionPairDef[] = [
  { dimA: "H", levelA: "high", dimB: "X", levelB: "high", tone: "resolution", contentKey: "ethicalLeader" },
  { dimA: "H", levelA: "high", dimB: "A", levelB: "low",  tone: "resolution", contentKey: "principledConfronter" },
  { dimA: "H", levelA: "high", dimB: "O", levelB: "high", tone: "resolution", contentKey: "responsibleInnovator" },
  { dimA: "E", levelA: "high", dimB: "X", levelB: "high", tone: "risk",       contentKey: "supportedVisibility" },
  { dimA: "E", levelA: "high", dimB: "C", levelB: "high", tone: "risk",       contentKey: "structuredStability" },
  { dimA: "E", levelA: "high", dimB: "O", levelB: "high", tone: "risk",       contentKey: "safeExperimentation" },
  { dimA: "X", levelA: "low",  dimB: "A", levelB: "high", tone: "resolution", contentKey: "deepCollaboration" },
  { dimA: "X", levelA: "low",  dimB: "O", levelB: "high", tone: "resolution", contentKey: "solitaryInnovator" },
  { dimA: "A", levelA: "high", dimB: "O", levelB: "high", tone: "resolution", contentKey: "facilitatedInnovation" },
  { dimA: "A", levelA: "low",  dimB: "C", levelB: "high", tone: "resolution", contentKey: "structuredCompetitor" },
  { dimA: "C", levelA: "high", dimB: "O", levelB: "high", tone: "resolution", contentKey: "structuredInnovator" },
  // New pairs – congruent combinations
  { dimA: "E", levelA: "low",  dimB: "X", levelB: "high", tone: "resolution", contentKey: "resilientLeader" },
  { dimA: "E", levelA: "low",  dimB: "C", levelB: "high", tone: "resolution", contentKey: "calmExecution" },
  { dimA: "E", levelA: "low",  dimB: "O", levelB: "high", tone: "resolution", contentKey: "exploratoryAnalyst" },
  { dimA: "X", levelA: "high", dimB: "C", levelB: "high", tone: "resolution", contentKey: "organizedLeader" },
  { dimA: "X", levelA: "high", dimB: "A", levelB: "high", tone: "resolution", contentKey: "harmoniousConnector" },
  { dimA: "H", levelA: "low",  dimB: "C", levelB: "high", tone: "resolution", contentKey: "performanceDriver" },
  { dimA: "A", levelA: "low",  dimB: "O", levelB: "high", tone: "resolution", contentKey: "disruptiveInnovator" },
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

/**
 * @param surface Melyik felület-típus kéri a párokat — a valencia-kapu ezt
 *   kapja meg (score-valence). Alapértelmezés: "self" (saját eredmény, PDF,
 *   share). Az ÉRTÉKELŐ felületek (hiring, döntéstámogatás) adják át az
 *   "evaluative"-ot: ott a feloldás-párok valenciás („Erősség") badge-et
 *   kapnak, ezért a fordított skálát érintő párok is semleges hangnemre
 *   szelídülnek.
 */
export function runProfileEngine(
  dimensions: Record<string, number>,
  _testType: string,
  surface: ValenceSurface = "self",
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
        // A hangnem a kanonikus valencia-kapun át (NEM literál-összehasonlítás
        // a hívási helyeken): fordított skálájú tag → semleges „note".
        tone: resolvePairTone(
          def.tone,
          [
            { code: def.dimA, level: def.levelA },
            { code: def.dimB, level: def.levelB },
          ],
          surface,
        ),
        contentKey: def.contentKey,
      });
    }
  }

  const block6Pairs = activeTensionPairs.filter((p) => p.tone === "resolution");
  const block7Pairs = activeTensionPairs.filter((p) => p.tone === "risk");
  const notePairs = activeTensionPairs.filter((p) => p.tone === "note");

  const topSoloDims = getTopSoloDims(dimensions, categories);

  return {
    categories,
    pairs: activeTensionPairs,
    block6Pairs,
    block7Pairs,
    notePairs,
    showBlock6: block6Pairs.length > 0,
    showBlock7: block7Pairs.length > 0,
    showNotes: notePairs.length > 0,
    topSoloDims,
  };
}
