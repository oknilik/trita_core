import { prisma } from "@/lib/prisma";
import { prepareObserverInviteEmail } from "@/lib/emails";
import { normalizeLocale } from "@/lib/i18n/core";
import { deliver, type DeliveryResult } from "./delivery";
import { DAY, emailExclusion, normalizeEmail } from "./rules";
import { loadLifecycleContext } from "./context";
import { lifecycleConfig } from "./config";
import { inspectOpportunity, syncOpportunity } from "./service";
import { prepareFollowupEmail } from "./templates";

export async function sendObserverReminder(id: string, actorId?: string): Promise<DeliveryResult> {
  const invite = await prisma.observerInvitation.findUnique({ where: { id }, include: { inviter: true, observer: true } });
  if (!invite?.observerEmail) return { ok: false, reason: "EMAIL_MISSING" };
  const previous = await prisma.lifecycleDelivery.count({ where: { key: { startsWith: `observer:${id}:` }, status: { not: "CANCELED" } } });
  const attempts = await prisma.lifecycleDelivery.count({ where: { key: { startsWith: `observer:${id}:` } } });
  const count = Math.max(previous, invite.reminderCount);
  if (count >= 2) return { ok: false, reason: "SEQUENCE_LIMIT" };
  const recipient = invite.observerEmail;
  const validate = async () => {
    const current = await prisma.observerInvitation.findUnique({ where: { id }, include: { inviter: true, observer: true } });
    const now = new Date();
    if (!current || current.status !== "PENDING") return "INVITATION_NOT_PENDING";
    if (current.inviter.deleted || current.observer?.deleted) return "ACCOUNT_UNAVAILABLE";
    if (current.expiresAt <= now) return "INVITATION_EXPIRED";
    if (!current.observerEmail || normalizeEmail(current.observerEmail) !== normalizeEmail(recipient)) return "EMAIL_CHANGED";
    if (current.reminderCount >= 2) return "SEQUENCE_LIMIT";
    if (current.createdAt.getTime() + 4 * DAY > now.getTime()) return "NOT_DUE";
    if (current.lastReminderSentAt && current.lastReminderSentAt.getTime() + 5 * DAY > now.getTime()) return "CONTACT_COOLDOWN";
    return null;
  };
  const result = await deliver({
    key: `observer:${id}:${Math.max(attempts, count) + 1}`, profileId: invite.inviterId, rule: "OBSERVER_REMINDER", recipient, actorId,
    legacyLastSentAt: invite.lastReminderSentAt,
    prepare: () => prepareObserverInviteEmail({ to: recipient, token: invite.token,
      inviterName: invite.inviter.username ?? "trita", recipientName: invite.observerName ?? undefined,
      locale: normalizeLocale(invite.inviter.locale), isReminder: true }), validate,
  });
  if (result.ok) await prisma.observerInvitation.updateMany({ where: { id }, data: { reminderCount: count + 1, lastReminderSentAt: result.sentAt } });
  return result;
}

export async function sendReflectionFollowup(profileId: string): Promise<DeliveryResult> {
  const profile = await prisma.userProfile.findUnique({ where: { id: profileId } });
  if (!profile?.email) return { ok: false, reason: "EMAIL_MISSING" };
  const recipient = profile.email;
  const validate = async () => {
    const fresh = await loadLifecycleContext(profileId);
    if (!fresh || fresh.excluded || fresh.managed) return "INELIGIBLE";
    const blocked = emailExclusion(fresh);
    if (blocked) return blocked;
    if (normalizeEmail(fresh.email!) !== normalizeEmail(recipient)) return "EMAIL_CHANGED";
    if (!fresh.result) return "INELIGIBLE";
    const age = Date.now() - fresh.result.createdAt.getTime();
    if (age < 7 * DAY || age > 10 * DAY) return "NOT_DUE";
    // Personal next-step reminders take precedence while those features are live.
    if (["manual", "automatic"].includes(lifecycleConfig().mode)) {
      const opportunityId = await syncOpportunity(profileId);
      const opportunity = opportunityId ? await inspectOpportunity(opportunityId) : null;
      if (opportunity?.status === "OPEN" && opportunity.count < 2) return "HIGHER_PRIORITY_GOAL";
    }
    return null;
  };
  return deliver({
    key: `reflection:${profileId}`, profileId, rule: "REFLECTION", recipient,
    prepare: (_id, unsubscribeToken) => prepareFollowupEmail({ rule: "REFLECTION", locale: profile.locale, unsubscribeToken }), validate,
  });
}
