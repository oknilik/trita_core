import { t, tf } from "@/lib/i18n";
import { DEFAULT_PROGRAM_POLICY, type ProgramSnapshot } from "./core";
import type { TeamReportAggregates } from "@/lib/team-report";
import { AXES, AXIS_LABELS, type OperatingAxis } from "@/lib/team-operating-style/questions";
export interface ProgramReportEvidence {
  key: "TEAM_SCAN" | "FOLLOW_UP";
  policy?: ProgramSnapshot["policy"];
  trustNetwork?: { measuredPairCount: number; possiblePairCount: number; coveragePct: number };
  observerReady: boolean;
  participantCount: number;
  baseline?: { campaignId: string; reportId: string; revision: number; publishedAt: string | null };
  operatingChanges?: { axis: string; previous: number; current: number; delta: number }[];
  psychSafetyChange?: { previous: number; current: number; delta: number };
  cohortChanged?: boolean;
}
export function programDataError(agg: TeamReportAggregates): string | null {
  const p = agg.program;
  if (!p) return null;
  const policy = p.policy ?? DEFAULT_PROGRAM_POLICY;
  const op = agg.teamStyle?.operating;
  if (!op || AXES.some(a => op.axes[a].status !== "available" || op.axes[a].coverage < policy.minOperatingCoverage || op.axes[a].n < policy.minRespondents)) return "REPORT_OPERATING_DATA_INSUFFICIENT";
  if (!agg.psychSafety || agg.psychSafety.count < policy.minRespondents) return "REPORT_PULSE_DATA_INSUFFICIENT";
  if (!agg.dimensionAverages || agg.completedCount < policy.minRespondents) return "REPORT_SELF_DATA_INSUFFICIENT";
  if (p.key === "TEAM_SCAN" && !p.observerReady) return "REPORT_OBSERVER_DATA_INSUFFICIENT";
  if (p.key === "FOLLOW_UP" && !p.baseline) return "BASELINE_INVALID";
  return null;
}
export function compareOperating(current: TeamReportAggregates, baseline: TeamReportAggregates) {
  const c = current.teamStyle?.operating, b = baseline.teamStyle?.operating;
  if (!c || !b || c.instrumentVersion !== b.instrumentVersion || c.scoringVersion !== b.scoringVersion) return [];
  const cp = current.program?.policy ?? DEFAULT_PROGRAM_POLICY;
  const bp = baseline.program?.policy ?? DEFAULT_PROGRAM_POLICY;
  return AXES.flatMap(axis => {
    const x = c.axes[axis], y = b.axes[axis];
    return x.status === "available" && y.status === "available" && x.coverage >= cp.minOperatingCoverage && y.coverage >= bp.minOperatingCoverage && x.n >= cp.minRespondents && y.n >= bp.minRespondents && x.mean !== null && y.mean !== null
      ? [{ axis, previous: y.mean, current: x.mean, delta: Math.round((x.mean - y.mean) * 10) / 10 }] : [];
  });
}
export function programComparisonLines(p: ProgramReportEvidence | undefined, hu: boolean): string[] {
  if (!p?.baseline) return [];
  return [
    hu ? `Kiinduló riport: ${p.baseline.publishedAt?.slice(0,10) ?? "–"}. A személyiségréteg ebből a korábbi mérésből származik; nem újramérés.` : `Baseline report: ${p.baseline.publishedAt?.slice(0,10) ?? "–"}. Personality is historical context from this measurement, not a remeasurement.`,
    ...(p.cohortChanged ? [hu ? "A résztvevői kör változott: az eltérés összetételváltozást is tükrözhet." : "The participant cohort changed; differences may also reflect composition changes."] : []),
    ...(p.operatingChanges ?? []).map(d => `${AXIS_LABELS[d.axis as OperatingAxis].name[hu ? "hu" : "en"]}: ${d.previous.toFixed(1)} → ${d.current.toFixed(1)} (${d.delta > 0 ? "+" : ""}${d.delta.toFixed(1)})`),
    ...(p.psychSafetyChange ? [hu ? `Pszichológiai biztonság: ${p.psychSafetyChange.previous.toFixed(1)} → ${p.psychSafetyChange.current.toFixed(1)}` : `Psychological safety: ${p.psychSafetyChange.previous.toFixed(1)} → ${p.psychSafetyChange.current.toFixed(1)}`] : []),
    hu ? "Leíró különbségek; önmagukban nem bizonyítanak fejlődést vagy statisztikai jelentőséget." : "Descriptive differences; they do not by themselves establish improvement or statistical significance.",
  ];
}

export function personalitySourceLabel(p: ProgramReportEvidence | undefined, hu: boolean): string | undefined {
  if (!p?.baseline) return undefined;
  const date = p.baseline.publishedAt?.slice(0, 10) ?? "–";
  return hu ? `Korábbi személyiségmérés · kiinduló riport: ${date}. Történeti háttér, nem a jelen kör újramérése.` : `Previous personality measurement · baseline report: ${date}. Historical context, not remeasured in this round.`;
}

export function programTrustLines(p: ProgramReportEvidence | undefined, hu: boolean): string[] {
  if (!p?.trustNetwork) return [];
  const locale = hu ? "hu" : "en";
  const trust = p.trustNetwork;
  return [tf("programTrust.coverage", locale, { measured: trust.measuredPairCount, possible: trust.possiblePairCount, coverage: trust.coveragePct }),
    t(trust.measuredPairCount ? "programTrust.note" : "programTrust.empty", locale)];
}
