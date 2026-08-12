import type { SerializedTeamReport } from "@/lib/team-report";

export interface TeamReportComparisonResult {
  completionDelta: number | null;
  psychSafetyDelta: number | null;
  dimensionChanges: Array<{
    code: string;
    previous: number;
    current: number;
    delta: number;
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

  return { completionDelta, psychSafetyDelta, dimensionChanges };
}
