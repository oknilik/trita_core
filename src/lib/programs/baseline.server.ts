import { DEFAULT_PROGRAM_POLICY } from "./core";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AXES, OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";
import type { TeamReportAggregates } from "@/lib/team-report";

export function compatibleBaseline(aggregates: unknown): boolean {
  const a = aggregates as TeamReportAggregates | null;
  const policy = a?.program?.policy ?? DEFAULT_PROGRAM_POLICY;
  return Boolean(a?.psychSafety && a.psychSafety.count >= policy.minRespondents && a.dimensionAverages && a.teamStyle?.operating?.instrumentVersion === OPERATING_STYLE_VERSION && a.teamStyle.operating.scoringVersion === "tos-score-1" &&
    AXES.every(axis => a.teamStyle!.operating!.axes[axis].status === "available" && a.teamStyle!.operating!.axes[axis].coverage >= policy.minOperatingCoverage && a.teamStyle!.operating!.axes[axis].n >= policy.minRespondents));
}
export async function loadBaseline(orgId: string, teamId: string, campaignId: string, db: Prisma.TransactionClient = prisma) {
  const report = await db.teamReport.findFirst({
    where: { campaignId, teamId, orgId, status: "PUBLISHED", campaign: { orgId, status: "CLOSED", OR: [{ programKey: "TEAM_SCAN" }, { presetId: "SCAN_STYLE_V1", programKey: null }] } },
    select: { id: true, campaignId: true, teamId: true, revision: true, publishedAt: true, aggregates: true, campaign: { select: { operatingRound: { select: { eligibleUserIds: true } } } } },
  });
  if (!report || !compatibleBaseline(report.aggregates)) return null;
  const { campaign, ...snapshot } = report;
  return { ...snapshot, aggregates: JSON.parse(JSON.stringify(baselineAggregates(report.aggregates as unknown as TeamReportAggregates))) as Prisma.InputJsonValue, eligibleUserIds: campaign?.operatingRound?.eligibleUserIds ?? [], publishedAt: report.publishedAt?.toISOString() ?? null };
}

/** Only historical personality and the two comparison measures belong in a new campaign. */
export function baselineAggregates(a: TeamReportAggregates) {
  return {
    generatedAt: a.generatedAt, assessmentCampaignId: a.assessmentCampaignId,
    memberCount: a.memberCount, completedCount: a.completedCount, completionPct: a.completionPct,
    dimensionAverages: a.dimensionAverages, dimensionSpread: a.dimensionSpread,
    pattern: a.pattern, psychSafety: a.psychSafety,
    teamStyle: a.teamStyle ? { version: a.teamStyle.version, operating: a.teamStyle.operating, composition: a.teamStyle.composition, sameRespondents: null, comparison: null } : undefined,
    program: a.program ? { key: a.program.key, policy: a.program.policy } : undefined,
  };
}
