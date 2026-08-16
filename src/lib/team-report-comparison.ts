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

export interface TeamReportComparisonResult {
  completionDelta: number | null;
  psychSafetyDelta: number | null;
  psychSafetySignificant: boolean | null;
  dimensionChanges: Array<{
    code: string;
    previous: number;
    current: number;
    delta: number;
    /** Mérési hibán túli elmozdulás; nem klasszikus NHST p-érték. */
    significant: boolean;
  }>;
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

  return {
    completionDelta,
    psychSafetyDelta,
    psychSafetySignificant,
    dimensionChanges,
  };
}
