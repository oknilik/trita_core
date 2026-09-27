import { prisma } from "@/lib/prisma";
import { resolveJourney } from "@/lib/journey/engine";
import { contextExclusion, type LifecycleContext } from "./rules";

export async function loadLifecycleContext(profileId: string): Promise<LifecycleContext | null> {
  const p = await prisma.userProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true, email: true, verifiedEmail: true, locale: true, createdAt: true, onboardedAt: true,
      deleted: true, clerkId: true, lifecycleEmailsOptOut: true, role: true, isConsultant: true, assessmentSkippedAt: true,
      assessmentDrafts: { where: { scope: "self" }, take: 1, select: { id: true, updatedAt: true, draftReminderCount: true, lastDraftReminderSentAt: true } },
      assessmentResults: { where: { isSelfAssessment: true }, orderBy: { createdAt: "desc" }, select: { id: true, createdAt: true, campaignId: true }, take: 1 },
      // An invitation of any status proves that asking others has been tried.
      sentInvitations: { select: { id: true }, take: 1 },
      orgMemberships: { where: { leftAt: null }, select: { id: true }, take: 1 },
      campaignParticipations: { where: { campaign: { status: "ACTIVE" } }, select: { id: true }, take: 1 },
    },
  });
  if (!p) return null;
  const admins = (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(",").map(s => s.trim());
  const draft = p.assessmentDrafts[0];
  const result = p.assessmentResults[0];
  const c: LifecycleContext = {
    ...p,
    excluded: p.isConsultant || p.role !== "INDIVIDUAL" || Boolean(p.email && admins.includes(p.email.toLowerCase())),
    skipped: Boolean(p.assessmentSkippedAt),
    managed: p.orgMemberships.length > 0 || p.campaignParticipations.length > 0,
    draft: draft ? { id: draft.id, updatedAt: draft.updatedAt, reminderCount: draft.draftReminderCount, lastSentAt: draft.lastDraftReminderSentAt } : null,
    result: result && result.campaignId === null ? result : null,
    hasAnySelfResult: Boolean(result),
    invitationCount: p.sentInvitations.length,
    actions: [],
  };
  if (!contextExclusion(c)) {
    const journey = await resolveJourney(p.id);
    c.actions = journey.state.availableNextActions.map(a => a.id);
  }
  return c;
}
