import type { SerializedTeamReport } from "@/lib/team-report";
import {
  independentMeanDiffStandardError,
  teamMeanDiffStandardError,
} from "@/lib/psychometrics";

// ── Pszichológiai biztonság mérési-hiba priorok ─────────────────────
// PRIOROK, NEM MÉRT TRITA-RELIABILITÁS: a saját, 8 itemes TPS skálán még
// nincs pilotból becsült Cronbach-α és eloszlási SD. Addig konzervatív
// α=.70 + SD=20 priorból számolunk egyéni SEM-et. Ezeket a pilot első
// elegendő mintáján kötelező újrabecsülni; a konstansok szándékosan itt,
// auditálható blokkban élnek (nem rejtett UI-küszöbként).
export const PSYCH_SAFETY_RELIABILITY_PRIOR = 0.7;
export const PSYCH_SAFETY_SCORE_SD_PRIOR = 20;
export const PSYCH_SAFETY_SEM_PRIOR =
  PSYCH_SAFETY_SCORE_SD_PRIOR * Math.sqrt(1 - PSYCH_SAFETY_RELIABILITY_PRIOR);

/** A kisebbik kör legalább ekkora része legyen közös. */
export const TEAM_REPORT_COMPOSITION_MIN_OVERLAP = 0.7;
/** A stabil magot az anonimitási minimum alatt akkor sem mutatjuk. */
export const TEAM_REPORT_COMPOSITION_MIN_COMMON = 3;

type DimensionChange = {
  code: string;
  previous: number;
  current: number;
  delta: number;
  /** Mérési hibán túli elmozdulás; nem klasszikus NHST p-érték. */
  significant: boolean;
};

export interface TeamReportCompositionComparison {
  status: "comparable" | "changed" | "unknown";
  common: number | null;
  joined: number | null;
  left: number | null;
  /** common / min(előző kör, aktuális kör), egész százalék. */
  overlapPct: number | null;
  reason: "missing_basis" | "low_overlap" | "too_few_common" | null;
}

export interface TeamReportComparisonResult {
  completionDelta: number | null;
  psychSafetyDelta: number | null;
  psychSafetySignificant: boolean | null;
  /** Teljes csapat nyers profil-deltája — kompozíciós kontextus, nem fejlődés. */
  dimensionChanges: DimensionChange[];
  /** Kizárólag a mindkét körben jelen lévő, megfelelő méretű stabil mag deltája. */
  stableCoreDimensionChanges: Array<DimensionChange & { sampleSize: number }>;
  composition: TeamReportCompositionComparison;
}

function contributorMap(report: SerializedTeamReport) {
  const basis = report.aggregates?.comparisonBasis;
  if (!basis || basis.version !== 1 || !Array.isArray(basis.contributors)) {
    return null;
  }
  return new Map(
    basis.contributors
      .filter(
        (item) =>
          typeof item?.key === "string" &&
          item.key.length > 0 &&
          item.dimensions &&
          typeof item.dimensions === "object",
      )
      .map((item) => [item.key, item.dimensions] as const),
  );
}

function compareComposition(
  current: SerializedTeamReport,
  previous: SerializedTeamReport,
): {
  result: TeamReportCompositionComparison;
  commonKeys: string[];
  currentMap: Map<string, Record<string, number>> | null;
  previousMap: Map<string, Record<string, number>> | null;
} {
  const currentMap = contributorMap(current);
  const previousMap = contributorMap(previous);
  if (!currentMap || !previousMap) {
    return {
      result: {
        status: "unknown",
        common: null,
        joined: null,
        left: null,
        overlapPct: null,
        reason: "missing_basis",
      },
      commonKeys: [],
      currentMap,
      previousMap,
    };
  }

  const commonKeys = [...currentMap.keys()].filter((key) => previousMap.has(key));
  const joined = [...currentMap.keys()].filter((key) => !previousMap.has(key)).length;
  const left = [...previousMap.keys()].filter((key) => !currentMap.has(key)).length;
  const denominator = Math.min(currentMap.size, previousMap.size);
  const overlap = denominator > 0 ? commonKeys.length / denominator : 0;
  const overlapPct = Math.round(overlap * 100);
  const tooFew = commonKeys.length < TEAM_REPORT_COMPOSITION_MIN_COMMON;
  const lowOverlap = overlap < TEAM_REPORT_COMPOSITION_MIN_OVERLAP;

  return {
    result: {
      status: !tooFew && !lowOverlap ? "comparable" : "changed",
      common: commonKeys.length,
      joined,
      left,
      overlapPct,
      reason: tooFew ? "too_few_common" : lowOverlap ? "low_overlap" : null,
    },
    commonKeys,
    currentMap,
    previousMap,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function compareTeamReports(
  current: SerializedTeamReport,
  previous: SerializedTeamReport,
): TeamReportComparisonResult {
  const currentAgg = current.aggregates;
  const previousAgg = previous.aggregates;
  const completionDelta = currentAgg && previousAgg
    ? currentAgg.completionPct - previousAgg.completionPct
    : null;
  const psychSafetyDelta =
    currentAgg?.psychSafety && previousAgg?.psychSafety
      ? Math.round((currentAgg.psychSafety.index - previousAgg.psychSafety.index) * 10) / 10
      : null;
  const psychSafetyThreshold =
    currentAgg?.psychSafety && previousAgg?.psychSafety
      ? independentMeanDiffStandardError(
          PSYCH_SAFETY_SEM_PRIOR,
          previousAgg.psychSafety.count,
          PSYCH_SAFETY_SEM_PRIOR,
          currentAgg.psychSafety.count,
        )
      : null;
  const psychSafetySignificant =
    psychSafetyDelta !== null && psychSafetyThreshold !== null
      ? Math.abs(psychSafetyDelta) >= psychSafetyThreshold
      : null;

  const currentDimensions = currentAgg?.dimensionAverages ?? {};
  const previousDimensions = previousAgg?.dimensionAverages ?? {};
  const dimensionChanges = Object.keys(currentDimensions)
    .filter((code) => typeof previousDimensions[code] === "number")
    .map((code) => ({
      code,
      previous: previousDimensions[code],
      current: currentDimensions[code],
      delta: currentDimensions[code] - previousDimensions[code],
      // A jelenlegi operating mode alapformája TSFI-S. A rövid forma SEM-je
      // a teljesénél nagyobb, ezért vegyes/örökölt adatnál is konzervatív
      // fallback, amíg a pillanatkép nem tárol forma-összetételt.
      significant:
        Math.abs(currentDimensions[code] - previousDimensions[code]) >=
        teamMeanDiffStandardError(
          "short",
          previousAgg?.completedCount ?? 0,
          currentAgg?.completedCount ?? 0,
          code,
        ),
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const compositionData = compareComposition(current, previous);
  const stableCoreDimensionChanges: Array<DimensionChange & { sampleSize: number }> = [];
  if (
    compositionData.result.status === "comparable" &&
    compositionData.currentMap &&
    compositionData.previousMap
  ) {
    for (const code of Object.keys(currentDimensions)) {
      if (typeof previousDimensions[code] !== "number") continue;
      const pairs = compositionData.commonKeys.flatMap((key) => {
        const currentValue = compositionData.currentMap!.get(key)?.[code];
        const previousValue = compositionData.previousMap!.get(key)?.[code];
        return typeof currentValue === "number" && typeof previousValue === "number"
          ? [{ currentValue, previousValue }]
          : [];
      });
      if (pairs.length < TEAM_REPORT_COMPOSITION_MIN_COMMON) continue;
      const previousMean = mean(pairs.map((pair) => pair.previousValue));
      const currentMean = mean(pairs.map((pair) => pair.currentValue));
      const rawDelta = currentMean - previousMean;
      stableCoreDimensionChanges.push({
        code,
        previous: round1(previousMean),
        current: round1(currentMean),
        delta: round1(rawDelta),
        sampleSize: pairs.length,
        significant:
          Math.abs(rawDelta) >=
          teamMeanDiffStandardError("short", pairs.length, pairs.length, code),
      });
    }
    stableCoreDimensionChanges.sort(
      (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
    );
  }

  return {
    completionDelta,
    psychSafetyDelta,
    psychSafetySignificant,
    dimensionChanges,
    stableCoreDimensionChanges,
    composition: compositionData.result,
  };
}
