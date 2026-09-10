import { HEXACO_ORDER, normalizeDimensionKeys } from "@/lib/hexaco";
import type { TeamReportAggregates } from "@/lib/team-report";

/** Read compatibility only: never regenerate a published narrative or pattern. */
export function normalizeReportDimensions(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const normalized = normalizeDimensionKeys(value as Record<string, unknown>);
  const dimensions = Object.fromEntries(
    HEXACO_ORDER.filter((code) => normalized[code] !== undefined)
      .map((code) => [code, normalized[code]]),
  );
  return Object.keys(dimensions).length > 0 ? dimensions : null;
}

export function normalizeTeamReportAggregates(value: unknown): TeamReportAggregates | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const aggregates = value as TeamReportAggregates;
  return {
    ...aggregates,
    dimensionAverages: normalizeReportDimensions(aggregates.dimensionAverages),
    dimensionSpread: normalizeReportDimensions(aggregates.dimensionSpread),
  };
}

/** A six-axis radar must not imply completeness for an incomplete snapshot. */
export function hasCompleteReportDimensions(value: Record<string, number> | null | undefined): boolean {
  return HEXACO_ORDER.every((code) => typeof value?.[code] === "number" && Number.isFinite(value[code]));
}

/** Old engine placeholders are not a consultant-approved interpretation. */
export function reportPatternLabel(label: string | null | undefined): string | null {
  const trimmed = label?.trim();
  return trimmed && !/^(?:ismeretlen minta|unknown pattern)(?:\s|[—–-]|$)/iu.test(trimmed)
    ? trimmed
    : null;
}
