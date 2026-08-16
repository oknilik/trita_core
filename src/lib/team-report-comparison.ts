import type { SerializedTeamReport } from "@/lib/team-report";
import {
  independentMeanDiffStandardError,
  teamMeanDiffStandardError,
} from "@/lib/psychometrics";
import { TEAM_ROLES } from "@/lib/team-role-scoring";
import {
  parseTeamActionTarget,
  type TeamActionTarget,
} from "@/lib/team-action-target";

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

// PRIOR, NEM MÉRT ITEM-SZÓRÁS: régi snapshotnál, ahol még nincs itemenkénti
// mért szórás, reális Likert-item fallbacket használunk az 1–5 skálán.
// A friss snapshotok már a tényleges itemSds értékeket tárolják; a priort a
// piloteloszlás után kötelező újrakalibrálni.
export const PSYCH_SAFETY_ITEM_SD_PRIOR = 1.1;

/** A kisebbik kör legalább ekkora része legyen közös. */
export const TEAM_REPORT_COMPOSITION_MIN_OVERLAP = 0.7;
/** A stabil magot az anonimitási minimum alatt akkor sem mutatjuk. */
export const TEAM_REPORT_COMPOSITION_MIN_COMMON = 3;

type DimensionChange = {
  code: string;
  previous: number;
  current: number;
  delta: number;
};

type StableCoreDimensionChange = DimensionChange & {
  sampleSize: number;
  /** Mérési hibán túli elmozdulás; nem klasszikus NHST p-érték. */
  significant: boolean;
};

export interface NumericChange {
  previous: number;
  current: number;
  delta: number;
}

export interface PsychSafetyItemChange extends NumericChange {
  id: string;
  /** Mérési-hiba prioron túli itemátlag-változás. */
  significant: boolean;
  weakness: "resolved" | "emerged" | "remained_weak" | "not_weak";
}

export interface TrustNetworkComparison {
  measuredPairs: NumericChange;
  coveragePct: NumericChange | null;
  hubCount: NumericChange | null;
  isolatedCount: NumericChange | null;
}

export interface RoleCoverageComparison {
  coveredRoles: NumericChange;
  gapCount: NumericChange;
  questionnaireCount: NumericChange;
  resolvedGaps: string[];
  newGaps: string[];
}

export interface PerspectiveGapComparison {
  coveredCount: NumericChange;
  gapCount: NumericChange;
  gapSharePct: NumericChange;
}

export interface PeerRolePerspectiveComparison {
  comparedCount: NumericChange;
  mismatchCount: NumericChange;
  mismatchSharePct: NumericChange;
}

export interface TeamActionOutcome {
  title: string;
  status: "not_started" | "in_progress" | "blocked" | "done";
  target: TeamActionTarget;
  metric: NumericChange | null;
  gate: "measurement_error" | "categorical" | "descriptive" | "unavailable";
  /** Null = ehhez a mutatóhoz még nincs kalibrált statisztikai kapu. */
  significant: boolean | null;
  direction:
    | "improved"
    | "worsened"
    | "unchanged"
    | "no_clear_change"
    | "context_only"
    | "unavailable";
}

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
  psychSafetyItemChanges: PsychSafetyItemChange[];
  trustNetwork: TrustNetworkComparison | null;
  roleCoverage: RoleCoverageComparison | null;
  /** HEXACO önkép ↔ saját observer-kör, személyen belül osztályozva. */
  externalPerspective: PerspectiveGapComparison | null;
  /** Csapatszerep-önkép ↔ peer top-3 eltérés, aggregáltan. */
  peerRolePerspective: PeerRolePerspectiveComparison | null;
  actionOutcomes: TeamActionOutcome[];
  /** Teljes csapat nyers profil-deltája — kompozíciós kontextus, nem fejlődés. */
  dimensionChanges: DimensionChange[];
  /** Kizárólag a mindkét körben jelen lévő, megfelelő méretű stabil mag deltája. */
  stableCoreDimensionChanges: StableCoreDimensionChange[];
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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function numericChange(
  previous: number,
  current: number,
  precision: 0 | 1 | 2 = 1,
): NumericChange {
  const round = precision === 0 ? Math.round : precision === 2 ? round2 : round1;
  return {
    previous: round(previous),
    current: round(current),
    delta: round(current - previous),
  };
}

function comparePsychSafetyItems(
  current: SerializedTeamReport["aggregates"],
  previous: SerializedTeamReport["aggregates"],
): PsychSafetyItemChange[] {
  if (!current?.psychSafety || !previous?.psychSafety) return [];
  const currentWeak = new Set(current.psychSafety.weakItemIds ?? []);
  const previousWeak = new Set(previous.psychSafety.weakItemIds ?? []);

  return Object.entries(current.psychSafety.itemMeans ?? {})
    .filter(([, value]) => typeof value === "number")
    .flatMap(([id, currentValue]) => {
      const previousValue = previous.psychSafety!.itemMeans?.[id];
      if (typeof previousValue !== "number") return [];
      const change = numericChange(previousValue, currentValue, 2);
      const previousSd = previous.psychSafety!.itemSds?.[id];
      const currentSd = current.psychSafety!.itemSds?.[id];
      const threshold = independentMeanDiffStandardError(
        typeof previousSd === "number" && Number.isFinite(previousSd) && previousSd >= 0
          ? previousSd
          : PSYCH_SAFETY_ITEM_SD_PRIOR,
        previous.psychSafety!.count,
        typeof currentSd === "number" && Number.isFinite(currentSd) && currentSd >= 0
          ? currentSd
          : PSYCH_SAFETY_ITEM_SD_PRIOR,
        current.psychSafety!.count,
      );
      const wasWeak = previousWeak.has(id);
      const isWeak = currentWeak.has(id);
      return [{
        id,
        ...change,
        significant: Math.abs(change.delta) > 0 && Math.abs(change.delta) >= threshold,
        weakness: wasWeak
          ? isWeak
            ? "remained_weak" as const
            : "resolved" as const
          : isWeak
            ? "emerged" as const
            : "not_weak" as const,
      }];
    })
    .sort(
      (a, b) =>
        Number(b.significant) - Number(a.significant) ||
        Math.abs(b.delta) - Math.abs(a.delta),
    );
}

function measuredTrustPairs(
  aggregates: NonNullable<SerializedTeamReport["aggregates"]>,
): number | null {
  if (aggregates.trustHighlights?.source === "trust_round") {
    return aggregates.trustHighlights.measuredPairCount;
  }
  // A legacy evidence.measuredEdgeCount az observer-forrást is „mért élként"
  // kezeli, ezért abból nem állítunk bizalmi hálót. Régi snapshotnál inkább
  // nincs összehasonlítás, mint rossz konstruktumú fallback.
  return null;
}

function compareTrustNetwork(
  current: SerializedTeamReport["aggregates"],
  previous: SerializedTeamReport["aggregates"],
): TrustNetworkComparison | null {
  if (!current || !previous) return null;
  const currentPairs = measuredTrustPairs(current);
  const previousPairs = measuredTrustPairs(previous);
  if (currentPairs === null || previousPairs === null) return null;
  const currentTrust = current.trustHighlights?.source === "trust_round"
    ? current.trustHighlights
    : null;
  const previousTrust = previous.trustHighlights?.source === "trust_round"
    ? previous.trustHighlights
    : null;
  return {
    measuredPairs: numericChange(previousPairs, currentPairs, 0),
    coveragePct:
      currentTrust?.coveragePct !== null &&
      currentTrust?.coveragePct !== undefined &&
      previousTrust?.coveragePct !== null &&
      previousTrust?.coveragePct !== undefined
        ? numericChange(previousTrust.coveragePct, currentTrust.coveragePct, 0)
        : null,
    hubCount:
      currentTrust && previousTrust
        ? numericChange(previousTrust.hubs.length, currentTrust.hubs.length, 0)
        : null,
    isolatedCount:
      currentTrust && previousTrust
        ? numericChange(
            previousTrust.isolated.length,
            currentTrust.isolated.length,
            0,
          )
        : null,
  };
}

function compareRoleCoverage(
  current: SerializedTeamReport["aggregates"],
  previous: SerializedTeamReport["aggregates"],
): RoleCoverageComparison | null {
  if (
    !current?.roleDistribution ||
    !previous?.roleDistribution ||
    !Array.isArray(current.roleGaps) ||
    !Array.isArray(previous.roleGaps)
  ) {
    return null;
  }
  const totalRoleCount = Object.keys(TEAM_ROLES).length;
  const currentGaps = new Set(current.roleGaps);
  const previousGaps = new Set(previous.roleGaps);
  return {
    coveredRoles: numericChange(
      totalRoleCount - previousGaps.size,
      totalRoleCount - currentGaps.size,
      0,
    ),
    gapCount: numericChange(previousGaps.size, currentGaps.size, 0),
    questionnaireCount: numericChange(
      previous.roleDistribution.questionnaireCount,
      current.roleDistribution.questionnaireCount,
      0,
    ),
    resolvedGaps: [...previousGaps].filter((role) => !currentGaps.has(role)),
    newGaps: [...currentGaps].filter((role) => !previousGaps.has(role)),
  };
}

function compareExternalPerspective(
  current: SerializedTeamReport["aggregates"],
  previous: SerializedTeamReport["aggregates"],
): PerspectiveGapComparison | null {
  const currentCulture = current?.feedbackCulture;
  const previousCulture = previous?.feedbackCulture;
  if (!currentCulture || !previousCulture) return null;
  return {
    coveredCount: numericChange(
      previousCulture.coveredCount,
      currentCulture.coveredCount,
      0,
    ),
    gapCount: numericChange(previousCulture.gapCount, currentCulture.gapCount, 0),
    gapSharePct: numericChange(
      (previousCulture.gapCount / previousCulture.coveredCount) * 100,
      (currentCulture.gapCount / currentCulture.coveredCount) * 100,
      0,
    ),
  };
}

function comparePeerRolePerspective(
  current: SerializedTeamReport["aggregates"],
  previous: SerializedTeamReport["aggregates"],
): PeerRolePerspectiveComparison | null {
  const currentPeer = current?.peerRoles;
  const previousPeer = previous?.peerRoles;
  if (
    !currentPeer ||
    !previousPeer ||
    currentPeer.comparedCount <= 0 ||
    previousPeer.comparedCount <= 0
  ) {
    return null;
  }
  return {
    comparedCount: numericChange(
      previousPeer.comparedCount,
      currentPeer.comparedCount,
      0,
    ),
    mismatchCount: numericChange(
      previousPeer.mismatchCount,
      currentPeer.mismatchCount,
      0,
    ),
    mismatchSharePct: numericChange(
      (previousPeer.mismatchCount / previousPeer.comparedCount) * 100,
      (currentPeer.mismatchCount / currentPeer.comparedCount) * 100,
      0,
    ),
  };
}

function directionFor(
  metric: NumericChange,
  better: "higher" | "lower",
  options?: { significant?: boolean | null; contextOnly?: boolean },
): TeamActionOutcome["direction"] {
  if (options?.contextOnly) return "context_only";
  if (metric.delta === 0) return "unchanged";
  if (options?.significant === false) return "no_clear_change";
  const improved = better === "higher" ? metric.delta > 0 : metric.delta < 0;
  return improved ? "improved" : "worsened";
}

function compareActionOutcomes(params: {
  current: SerializedTeamReport;
  previous: SerializedTeamReport;
  psychSafetySignificant: boolean | null;
  psychSafetyItemChanges: PsychSafetyItemChange[];
  trustNetwork: TrustNetworkComparison | null;
  compositionComparable: boolean;
}): TeamActionOutcome[] {
  const {
    current,
    previous,
    psychSafetySignificant,
    psychSafetyItemChanges,
    trustNetwork,
    compositionComparable,
  } = params;
  return (previous.actionItems ?? []).flatMap((item): TeamActionOutcome[] => {
    const target = parseTeamActionTarget(item.targetMetric);
    if (!target) return [];
    const base = {
      title: item.title,
      status: item.status ?? ("not_started" as const),
      target,
    };

    if (target.kind === "psych_safety_index") {
      const previousValue = previous.aggregates?.psychSafety?.index;
      const currentValue = current.aggregates?.psychSafety?.index;
      if (typeof previousValue !== "number" || typeof currentValue !== "number") {
        return [{
          ...base,
          metric: null,
          gate: "unavailable" as const,
          significant: null,
          direction: "unavailable" as const,
        }];
      }
      const metric = numericChange(previousValue, currentValue, 1);
      return [{
        ...base,
        metric,
        gate: "measurement_error" as const,
        significant: psychSafetySignificant,
        direction: directionFor(metric, "higher", {
          significant: psychSafetySignificant,
        }),
      }];
    }

    if (target.kind === "psych_safety_item") {
      const change = psychSafetyItemChanges.find(
        (itemChange) => itemChange.id === target.itemId,
      );
      if (!change) {
        return [{
          ...base,
          metric: null,
          gate: "unavailable" as const,
          significant: null,
          direction: "unavailable" as const,
        }];
      }
      const metric = numericChange(change.previous, change.current, 2);
      return [{
        ...base,
        metric,
        gate: "measurement_error" as const,
        significant: change.significant,
        direction: directionFor(metric, "higher", {
          significant: change.significant,
        }),
      }];
    }

    if (target.kind === "trust_coverage" || target.kind === "trust_isolated_count") {
      const currentTrust = current.aggregates?.trustHighlights?.source === "trust_round"
        ? current.aggregates.trustHighlights
        : null;
      const previousHasNoMeasuredRelationships =
        previous.aggregates?.evidence?.measuredEdgeCount === 0;
      const metric = target.kind === "trust_coverage"
        ? trustNetwork?.coveragePct ?? (
            currentTrust?.coveragePct !== null &&
            currentTrust?.coveragePct !== undefined &&
            previousHasNoMeasuredRelationships
              ? numericChange(0, currentTrust.coveragePct, 0)
              : null
          )
        : trustNetwork?.isolatedCount ?? null;
      if (!metric) {
        return [{
          ...base,
          metric: null,
          gate: "unavailable" as const,
          significant: null,
          direction: "unavailable" as const,
        }];
      }
      return [{
        ...base,
        metric,
        gate: "descriptive" as const,
        significant: null,
        direction: directionFor(
          metric,
          target.kind === "trust_coverage" ? "higher" : "lower",
          { contextOnly: !compositionComparable },
        ),
      }];
    }

    const previousGaps = previous.aggregates?.roleGaps;
    const currentGaps = current.aggregates?.roleGaps;
    if (!Array.isArray(previousGaps) || !Array.isArray(currentGaps)) {
      return [{
        ...base,
        metric: null,
        gate: "unavailable" as const,
        significant: null,
        direction: "unavailable" as const,
      }];
    }
    const metric = numericChange(
      previousGaps.includes(target.roleCode) ? 1 : 0,
      currentGaps.includes(target.roleCode) ? 1 : 0,
      0,
    );
    return [{
      ...base,
      metric,
      gate: "categorical" as const,
      significant: null,
      direction: directionFor(metric, "lower", {
        contextOnly: !compositionComparable,
      }),
    }];
  });
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
  const psychSafetyItemChanges = comparePsychSafetyItems(currentAgg, previousAgg);
  const trustNetwork = compareTrustNetwork(currentAgg, previousAgg);
  const roleCoverage = compareRoleCoverage(currentAgg, previousAgg);
  const externalPerspective = compareExternalPerspective(currentAgg, previousAgg);
  const peerRolePerspective = comparePeerRolePerspective(currentAgg, previousAgg);

  const currentDimensions = currentAgg?.dimensionAverages ?? {};
  const previousDimensions = previousAgg?.dimensionAverages ?? {};
  const dimensionChanges = Object.keys(currentDimensions)
    .filter((code) => typeof previousDimensions[code] === "number")
    .map((code) => ({
      code,
      previous: previousDimensions[code],
      current: currentDimensions[code],
      delta: currentDimensions[code] - previousDimensions[code],
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const compositionData = compareComposition(current, previous);
  const stableCoreDimensionChanges: StableCoreDimensionChange[] = [];
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
  const actionOutcomes = compareActionOutcomes({
    current,
    previous,
    psychSafetySignificant,
    psychSafetyItemChanges,
    trustNetwork,
    compositionComparable: compositionData.result.status === "comparable",
  });

  return {
    completionDelta,
    psychSafetyDelta,
    psychSafetySignificant,
    psychSafetyItemChanges,
    trustNetwork,
    roleCoverage,
    externalPerspective,
    peerRolePerspective,
    actionOutcomes,
    dimensionChanges,
    stableCoreDimensionChanges,
    composition: compositionData.result,
  };
}
