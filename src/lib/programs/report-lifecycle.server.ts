import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { buildTeamReportAggregates, validateTeamReportForPublish, serializeTeamReport } from "@/lib/team-report";

export class ProgramReportError extends Error { constructor(public code: string) { super(code); } }
export async function mutateProgramReport(input: {
  reportId: string; teamId: string; actorId: string; action: string; expectedRevision?: number;
  fields: Record<string, unknown>;
}) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "TeamReport" WHERE "id" = ${input.reportId} FOR UPDATE`;
    const r = await tx.teamReport.findUnique({ where: { id: input.reportId }, include: { campaign: true } });
    if (!r || r.teamId !== input.teamId || !r.campaign?.programSnapshot) throw new ProgramReportError("NOT_FOUND");
    if (input.expectedRevision !== r.revision) throw new ProgramReportError("REPORT_REVISION_CONFLICT");
    if (input.action === "unpublish") {
      if (r.status !== "PUBLISHED") throw new ProgramReportError("NOT_PUBLISHED");
      const newer = await tx.teamReport.findFirst({ where: { teamId: r.teamId, id: { not: r.id }, OR: [{ status: "DRAFT" }, { status: "PUBLISHED", publishedAt: { gt: r.publishedAt! } }] }, select: { id: true } });
      if (newer) throw new ProgramReportError("DRAFT_EXISTS");
      const updated = await tx.teamReport.update({ where: { id: r.id }, data: { status: "DRAFT", publishedAt: null, publishedById: null, reviewedRevision: null, reviewedAt: null, reviewedById: null, revision: { increment: 1 } } });
      return serializeTeamReport(updated, { includeInternalNotes: true });
    }
    if (r.status !== "DRAFT") throw new ProgramReportError("ALREADY_PUBLISHED");
    if (r.campaign.status !== "CLOSED") throw new ProgramReportError("REPORT_CAMPAIGN_NOT_CLOSED");
    if (input.action === "publish") {
      if (r.reviewedRevision !== r.revision || !r.reviewedById) throw new ProgramReportError("REPORT_REVIEW_REQUIRED");
      if (Object.keys(input.fields).length) throw new ProgramReportError("REPORT_REVIEW_REQUIRED");
      // Publish exactly the reviewed snapshot. Never rebuild data after approval.
      const updated = await tx.teamReport.update({ where: { id: r.id }, data: { status: "PUBLISHED", publishedAt: new Date(), publishedById: input.actorId } });
      return serializeTeamReport(updated, { includeInternalNotes: true });
    }
    const data: Prisma.TeamReportUpdateInput = {};
    const textFields = ["title", "summary", "strengths", "risks", "recommendations", "interviewFindings", "leadershipGuide", "internalNotes"] as const;
    for (const k of textFields) if (k in input.fields) data[k] = input.fields[k] as string | null;
    if (input.fields.actionItems !== undefined) data.actionItems = input.fields.actionItems === null ? [] : input.fields.actionItems as Prisma.InputJsonValue;
    if (input.fields.translationsEn != null) data.translationsEn = input.fields.translationsEn as Prisma.InputJsonValue;
    if (input.fields.operatingCampaignId && input.fields.operatingCampaignId !== r.campaignId) throw new ProgramReportError("PROGRAM_CONFIGURATION_FIXED");
    const aggregates = await buildTeamReportAggregates(r.teamId, { assessmentCampaignId: r.campaignId! });
    if (!aggregates) throw new ProgramReportError("REPORT_AGGREGATES_REQUIRED");
    if (input.action === "review") {
      const error = validateTeamReportForPublish({ campaignId: r.campaignId, aggregates, title: ("title" in input.fields ? input.fields.title : r.title) as string | null, summary: ("summary" in input.fields ? input.fields.summary : r.summary) as string | null, recommendations: ("recommendations" in input.fields ? input.fields.recommendations : r.recommendations) as string | null, actionItems: "actionItems" in input.fields ? input.fields.actionItems : r.actionItems });
      if (error) throw new ProgramReportError(error);
    }
    const revision = r.revision + 1;
    const updated = await tx.teamReport.update({ where: { id: r.id }, data: { ...data, aggregates: aggregates as unknown as Prisma.InputJsonValue, revision, reviewedRevision: input.action === "review" ? revision : null, reviewedById: input.action === "review" ? input.actorId : null, reviewedAt: input.action === "review" ? new Date() : null } });
    await tx.teamActionEvent.create({ data: { reportId: r.id, actionKey: "report:review", eventType: input.action === "review" ? "REVIEWED" : "DRAFT_UPDATED", actorUserId: input.actorId, payload: { revision } } });
    return serializeTeamReport(updated, { includeInternalNotes: true });
  }, { timeout: 20000 });
}
