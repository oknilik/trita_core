import { prisma } from "@/lib/prisma";
import { safeParseProgram, activityStates, programActivityLink } from "./core";
import { CAMPAIGN_STEP_LABELS, type CampaignStepType } from "@/lib/campaign-steps-core";
export async function loadProgramJourney(profileId: string, orgId: string | null) {
  if (!orgId) return [];
  const participants = await prisma.campaignParticipant.findMany({
    where: { userId: profileId, campaign: { orgId, status: "ACTIVE", programKey: { not: null } } },
    include: { campaign: { include: { observerInvitations: { where: { inviterId: profileId }, select: { status: true, expiresAt: true } }, operatingRound: { select: { responses: { where: { userId: profileId }, select: { submittedAt: true } } } } } } },
    orderBy: { addedAt: "asc" },
  });
  return participants.flatMap(p => {
    const program = safeParseProgram(p.campaign.programSnapshot);
    // Unsupported or malformed programs must not take down the signed-in Journey.
    if (!program) return [];
    const states = activityStates(program, p.stepCompletions, {
      observerSent: p.campaign.observerInvitations.filter(i => i.status === "COMPLETED" || (["PENDING", "AWAITING_APPROVAL"].includes(i.status) && i.expiresAt > new Date())).length,
      observerResponses: p.campaign.observerInvitations.filter(i => i.status === "COMPLETED").length,
      started: p.campaign.operatingRound?.responses.some(r => !r.submittedAt) ? ["TEAM_OPERATING_STYLE"] : [],
    });
    return [{ campaignId: p.campaignId, name: p.campaign.name, programKey: program.key,
      activities: states.map(a => ({ ...a, href: programActivityLink(a.key, p.campaignId), label: a.key === "OBSERVER_360" ? { hu: "Kérj külső visszajelzést", en: "Invite observer feedback" } : CAMPAIGN_STEP_LABELS[a.key as CampaignStepType] })),
    }];
  });
}
