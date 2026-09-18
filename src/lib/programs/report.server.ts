import { prisma } from "@/lib/prisma";
import type { TeamReportAggregates } from "@/lib/team-report";
import { parseProgram, completionMap } from "./core";
import { compareOperating } from "./report";
export async function attachProgramEvidence(teamId: string, campaignId: string | undefined, current: TeamReportAggregates): Promise<TeamReportAggregates> {
  if (!campaignId) return current;
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, include: { participants: { select: { userId: true, stepCompletions: true } }, operatingRound: { select: { eligibleUserIds: true } } } });
  const p = parseProgram(campaign?.programSnapshot);
  if (!p || !campaign) return current;
  if (campaign.teamId !== teamId) throw new Error("REPORT_CAMPAIGN_TEAM_MISMATCH");
  current.program = { key: p.key, policy: p.policy, participantCount: campaign.participants.length, observerReady: campaign.participants.length >= p.policy.minRespondents && campaign.participants.every(x => Boolean(completionMap(x.stepCompletions).OBSERVER_360)) };
  if (p.key === "FOLLOW_UP") {
    const baseline = campaign.baselineReportSnapshot as unknown as { id: string; campaignId: string; revision: number; publishedAt: string | null; eligibleUserIds: string[]; aggregates: TeamReportAggregates } | null;
    if (!baseline?.aggregates || baseline.campaignId !== campaign.baselineCampaignId) throw new Error("BASELINE_INVALID");
    const b = baseline.aggregates;
    current.program.baseline = { campaignId: baseline.campaignId, reportId: baseline.id, revision: baseline.revision, publishedAt: baseline.publishedAt };
    current.program.operatingChanges = compareOperating(current, b);
    if (current.psychSafety && b.psychSafety) current.program.psychSafetyChange = { previous: b.psychSafety.index, current: current.psychSafety.index, delta: current.psychSafety.index - b.psychSafety.index };
    current.program.cohortChanged = JSON.stringify([...(baseline.eligibleUserIds ?? [])].sort()) !== JSON.stringify([...(campaign.operatingRound?.eligibleUserIds ?? [])].sort());
    // Only the frozen personality background is carried forward. Never relabel old trust/observer data as new.
    current.dimensionAverages = b.dimensionAverages; current.dimensionSpread = b.dimensionSpread;
    current.completedCount = b.completedCount; current.pattern = b.pattern;
    current.memberCount = campaign.operatingRound?.eligibleUserIds.length ?? campaign.participants.length;
    current.completionPct = current.memberCount ? Math.round(100 * (current.teamStyle?.operating?.responseCount ?? 0) / current.memberCount) : 0;
    current.roleDistribution = null; current.roleGaps = null; current.dynamics = null; current.trustHighlights = null; current.pressure = null;
    delete current.comparisonBasis;
    if (current.teamStyle) { current.teamStyle.composition = b.teamStyle?.composition ?? null; current.teamStyle.sameRespondents = null; current.teamStyle.comparison = null; }
  }
  return current;
}
