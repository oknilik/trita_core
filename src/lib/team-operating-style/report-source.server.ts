import { prisma } from "@/lib/prisma";

/** Persist an explicit source across preview and republication; null returns to the original round. */
export async function resolveOperatingReportSource(teamId: string, orgId: string,
  requested: string | null | undefined, aggregates: unknown): Promise<string | undefined> {
  const previous = (aggregates as { operatingCampaignId?: string } | null)?.operatingCampaignId;
  const sourceId = requested === undefined ? previous : requested ?? undefined;
  if (sourceId) {
    const round = await prisma.teamOperatingRound.findFirst({
      where: { teamId, campaignId: sourceId, campaign: { orgId, status: "CLOSED" } }, select: { id: true },
    });
    if (!round) throw new Error("REPORT_OPERATING_SOURCE_INVALID");
  }
  return sourceId;
}
