import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AXES, OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";
import type { TeamReportAggregates } from "@/lib/team-report";

export function compatibleBaseline(aggregates: unknown): boolean {
  const a = aggregates as TeamReportAggregates | null;
  return Boolean(a?.psychSafety && a.dimensionAverages && a.teamStyle?.operating?.instrumentVersion === OPERATING_STYLE_VERSION && a.teamStyle.operating.scoringVersion === "tos-score-1" &&
    AXES.every(axis => a.teamStyle!.operating!.axes[axis].status === "available" && a.teamStyle!.operating!.axes[axis].coverage >= 0.6));
}
export async function loadBaseline(orgId: string, teamId: string, campaignId: string, db: Prisma.TransactionClient = prisma) {
  const report = await db.teamReport.findFirst({
    where: { campaignId, teamId, orgId, status: "PUBLISHED", campaign: { orgId, status: "CLOSED", OR: [{ programKey: "TEAM_SCAN" }, { presetId: "SCAN_STYLE_V1", programKey: null }] } },
    select: { id: true, campaignId: true, teamId: true, revision: true, publishedAt: true, aggregates: true, campaign: { select: { operatingRound: { select: { eligibleUserIds: true } } } } },
  });
  if (!report || !compatibleBaseline(report.aggregates)) return null;
  const { campaign, ...snapshot } = report;
  return { ...snapshot, eligibleUserIds: campaign?.operatingRound?.eligibleUserIds ?? [], publishedAt: report.publishedAt?.toISOString() ?? null };
}
