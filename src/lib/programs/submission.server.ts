import { completionMap } from "./core";
import type { Prisma } from "@prisma/client";
import { isStepOpenFor } from "@/lib/campaign-steps-core";
export class ProgramSubmissionError extends Error { constructor(public code: string) { super(code); } }
/** Lock ordering is always Campaign → participant/response, including closure. */
export async function guardProgramSubmission(tx: Prisma.TransactionClient, campaignId: string, userId: string, activity: string) {
  const c = await tx.campaign.findUnique({ where: { id: campaignId }, select: { programKey: true } });
  if (!c?.programKey) return;
  await tx.$queryRaw`SELECT "id" FROM "Campaign" WHERE "id" = ${campaignId} FOR UPDATE`;
  const p = await tx.campaignParticipant.findUnique({ where: { campaignId_userId: { campaignId, userId } }, include: { campaign: true } });
  if (!p || p.campaign.status !== "ACTIVE") throw new ProgramSubmissionError("CAMPAIGN_NOT_ACTIVE");
  const [org, team] = await Promise.all([
    tx.organizationMember.findUnique({ where: { orgId_userId: { orgId: p.campaign.orgId, userId } } }),
    p.campaign.teamId ? tx.teamMember.findUnique({ where: { teamId_userId: { teamId: p.campaign.teamId, userId } } }) : null,
  ]);
  if (!org || org.leftAt || !team) throw new ProgramSubmissionError("FORBIDDEN");
  const done = completionMap(p.stepCompletions);
  if (!done?.[activity] && !isStepOpenFor(p.campaign, p, activity)) throw new ProgramSubmissionError("STEP_LOCKED");
}
