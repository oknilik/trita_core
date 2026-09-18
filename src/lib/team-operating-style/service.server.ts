import { prisma } from "@/lib/prisma";
import { advanceCampaignStepForUser } from "@/lib/campaign-steps";
import { isStepOpenFor } from "@/lib/campaign-steps-core";
import { OperatingSubmissionSchema, OperatingError, sameOperatingAnswers } from "./submission";

/** Campaign lock also serializes activation, closure and participant changes. */
export async function saveOperatingResponse(profileId: string, raw: unknown) {
  const input = OperatingSubmissionSchema.parse(raw);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Campaign" WHERE "id" = ${input.campaignId} FOR UPDATE`;
    const participant = await tx.campaignParticipant.findUnique({
      where: { campaignId_userId: { campaignId: input.campaignId, userId: profileId } },
      include: { campaign: { include: { operatingRound: true } } },
    });
    const round = participant?.campaign.operatingRound;
    if (!participant || !round || !round.eligibleUserIds.includes(profileId)) throw new OperatingError("NOT_FOUND", 404);
    const [membership, orgMember] = await Promise.all([
      tx.teamMember.findUnique({ where: { teamId_userId: { teamId: round.teamId, userId: profileId } } }),
      tx.organizationMember.findUnique({ where: { orgId_userId: { orgId: participant.campaign.orgId, userId: profileId } } }),
    ]);
    if (!membership || !orgMember || orgMember.leftAt) throw new OperatingError("FORBIDDEN", 403);
    if (round.instrumentVersion !== input.instrumentVersion) throw new OperatingError("VERSION_MISMATCH");
    if (participant.campaign.status !== "ACTIVE") throw new OperatingError("CAMPAIGN_NOT_ACTIVE");
    const where = { roundId_userId: { roundId: round.id, userId: profileId } };
    const existing = await tx.teamOperatingResponse.findUnique({ where });
    if (existing?.submittedAt) {
      if (input.intent !== "submit" || !sameOperatingAnswers(existing.answers, input.answers)) throw new OperatingError("ALREADY_SUBMITTED");
      return { replayed: true, openings: [] };
    }
    if (!isStepOpenFor(participant.campaign, participant, "TEAM_OPERATING_STYLE")) throw new OperatingError("STEP_LOCKED");
    const data = { answers: input.answers, submittedAt: input.intent === "submit" ? new Date() : null };
    await tx.teamOperatingResponse.upsert({ where, create: { roundId: round.id, userId: profileId, ...data }, update: data });
    const openings = input.intent === "submit" ? await advanceCampaignStepForUser(profileId, "TEAM_OPERATING_STYLE", {
      campaignId: input.campaignId, db: tx, emitNotifications: false,
    }) : [];
    return { replayed: false, openings };
  });
}
