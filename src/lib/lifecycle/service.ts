import { prisma } from "@/lib/prisma";
import { normalizeLocale } from "@/lib/i18n/core";
import { handleLifecycleNudge } from "@/lib/notifications/orchestrator";
import { loadLifecycleContext } from "./context";
import { contextExclusion, contactExclusion, DAY, emailExclusion, isPersonalRule, nextDue, normalizeEmail, selectGoal } from "./rules";
import { lifecycleConfig, sendingEnabled } from "./config";
import { deliver, type DeliveryResult } from "./delivery";
import { prepareFollowupEmail } from "./templates";
import { FOLLOWUP_COPY } from "./copy";

export async function syncOpportunity(profileId: string, now = new Date()) {
  const context = await loadLifecycleContext(profileId);
  if (!context) return null;
  const goal = selectGoal(context);
  const open = await prisma.lifecycleOpportunity.findMany({ where: { profileId, status: "OPEN" } });
  for (const old of open) {
    if (old.rule === goal?.rule && old.goalKey === goal.goalKey) continue;
    const completed = old.rule === "START_SELF" ? Boolean(context.draft || context.result)
      : old.rule === "RESUME_SELF" ? Boolean(context.result) : context.invitationCount > 0;
    await prisma.lifecycleOpportunity.updateMany({ where: { id: old.id, status: "OPEN" }, data: {
      status: completed ? "COMPLETED" : "INELIGIBLE",
      completedAt: completed ? now : null, reason: completed ? "GOAL_REACHED" : contextExclusion(context) ?? "STATE_CHANGED",
    } });
    await prisma.notification.updateMany({ where: { sourceType: "lifecycle", sourceId: old.id }, data: { dismissed: true, dismissedAt: now } });
  }
  if (!goal) return null;
  const opportunity = await prisma.lifecycleOpportunity.upsert({
    where: { profileId_rule_goalKey: { profileId, rule: goal.rule, goalKey: goal.goalKey } },
    create: { profileId, rule: goal.rule, goalKey: goal.goalKey, anchorAt: goal.anchorAt, dueAt: goal.dueAt, expiresAt: goal.expiresAt }, update: {},
  });
  // Saving a draft delays the current episode, without resetting its budget.
  if (goal.rule === "RESUME_SELF" && goal.anchorAt > opportunity.anchorAt && !["COMPLETED", "DISMISSED"].includes(opportunity.status)) {
    await prisma.lifecycleOpportunity.update({ where: { id: opportunity.id }, data: {
      anchorAt: goal.anchorAt, dueAt: goal.dueAt, expiresAt: goal.expiresAt, status: "OPEN", reason: null,
    } });
  }
  await prisma.lifecycleOpportunity.updateMany({ where: { id: opportunity.id, status: "OPEN", expiresAt: { lt: now } }, data: { status: "EXPIRED", reason: "WINDOW_ENDED" } });
  return opportunity.id;
}

export async function inspectOpportunity(id: string, now = new Date()) {
  const stored = await prisma.lifecycleOpportunity.findUnique({ where: { id }, include: {
    profile: { select: { email: true, username: true } },
    deliveries: { orderBy: { claimedAt: "desc" }, select: { id: true, status: true, claimedAt: true, acceptedAt: true, deliveredAt: true, errorCode: true } },
  } });
  if (!stored || !isPersonalRule(stored.rule)) return null;
  const c = await loadLifecycleContext(stored.profileId);
  const goal = c ? selectGoal(c) : null;
  const active = stored.deliveries.filter(d => d.status !== "CANCELED");
  const legacyCount = stored.rule === "RESUME_SELF" ? c?.draft?.reminderCount ?? 0 : 0;
  const count = Math.max(active.length, legacyCount);
  const lastAt = new Date(Math.max(active[0]?.claimedAt.getTime() ?? 0, stored.rule === "RESUME_SELF" ? c?.draft?.lastSentAt?.getTime() ?? 0 : 0));
  const effectiveGoal = goal ? { ...goal, anchorAt: stored.anchorAt } : null;
  const dueAt = effectiveGoal ? nextDue(effectiveGoal, count, lastAt.getTime() ? lastAt : null) : stored.dueAt;
  let reason: string | null = stored.status !== "OPEN" ? stored.status : null;
  if (!reason && (!c || !goal || goal.rule !== stored.rule || goal.goalKey !== stored.goalKey)) reason = "INELIGIBLE";
  if (!reason && stored.expiresAt < now) reason = "EXPIRED";
  if (!reason && count >= 2) reason = "SEQUENCE_LIMIT";
  if (!reason && active.some(d => ["UNKNOWN", "CLAIMED"].includes(d.status))) reason = "DELIVERY_EXISTS";
  if (!reason && stored.snoozedUntil && stored.snoozedUntil > now) reason = "SNOOZED";
  if (!reason && dueAt > now) reason = "NOT_DUE";
  if (!reason && c) reason = emailExclusion(c);
  if (!reason && c?.email) {
    const recipient = normalizeEmail(c.email);
    if (await prisma.emailSuppression.findUnique({ where: { email: recipient } })) reason = "EMAIL_SUPPRESSED";
    if (!reason) {
      const history = await prisma.lifecycleDelivery.findMany({ where: {
        OR: [{ profileId: c.id }, { recipient }], claimedAt: { gte: new Date(now.getTime() - 30 * DAY) },
      }, select: { claimedAt: true, rule: true, status: true } });
      reason = contactExclusion(history, stored.rule, now);
    }
    const { allowlist } = lifecycleConfig();
    if (!reason && allowlist.length && !allowlist.includes(recipient)) reason = "OUTSIDE_ALLOWLIST";
  }
  return { ...stored, rule: stored.rule, dueAt, count, reason: reason ?? "READY", locale: normalizeLocale(c?.locale), context: c };
}

export async function sendOpportunity(id: string, source: "manual" | "automatic", actorId?: string): Promise<DeliveryResult> {
  if (!sendingEnabled(source)) return { ok: false, reason: "MODE_DISABLED" };
  const initial = await prisma.lifecycleOpportunity.findUnique({ where: { id } });
  if (!initial) return { ok: false, reason: "NOT_FOUND" };
  await syncOpportunity(initial.profileId);
  const view = await inspectOpportunity(id);
  if (!view?.context?.email || view.reason !== "READY") return { ok: false, reason: view?.reason ?? "INELIGIBLE" };
  const context = view.context;
  const recipient = context.email!;
  const { cohortFrom } = lifecycleConfig();
  if (source === "automatic" && (!cohortFrom || context.createdAt < cohortFrom)) return { ok: false, reason: "OUTSIDE_COHORT" };
  const validate = async () => {
    if (!sendingEnabled(source)) return "MODE_DISABLED";
    const fresh = await loadLifecycleContext(context.id);
    const goal = fresh ? selectGoal(fresh) : null;
    if (!fresh || !goal || goal.rule !== view.rule || goal.goalKey !== view.goalKey) return "INELIGIBLE";
    if (!fresh.email || normalizeEmail(fresh.email) !== normalizeEmail(recipient)) return "EMAIL_CHANGED";
    const exclusion = emailExclusion(fresh);
    if (exclusion) return exclusion;
    const config = lifecycleConfig();
    if (config.allowlist.length && !config.allowlist.includes(normalizeEmail(recipient))) return "OUTSIDE_ALLOWLIST";
    if (source === "automatic" && (!config.cohortFrom || fresh.createdAt < config.cohortFrom)) return "OUTSIDE_COHORT";
    const current = await prisma.lifecycleOpportunity.findUnique({ where: { id } });
    if (!current || current.status !== "OPEN") return "INELIGIBLE";
    if (current.snoozedUntil && current.snoozedUntil > new Date()) return "SNOOZED";
    if (current.expiresAt < new Date()) return "EXPIRED";
    // A progress write after materialisation must delay the email immediately.
    if (goal.rule === "RESUME_SELF" && nextDue(goal, view.count, null) > new Date()) return "NOT_DUE";
    return null;
  };
  const result = await deliver({
    key: `personal:${id}:${Math.max(view.deliveries.length, view.count) + 1}`, profileId: context.id, opportunityId: id,
    rule: view.rule, recipient, actorId,
    legacyLastSentAt: view.rule === "RESUME_SELF" ? context.draft?.lastSentAt : null,
    prepare: (_deliveryId, unsubscribeToken) => prepareFollowupEmail({ rule: view.rule, locale: view.locale, opportunityId: id, unsubscribeToken }),
    validate,
  });
  if (result.ok) {
    await handleLifecycleNudge(context.id, id, FOLLOWUP_COPY[view.rule]);
    if (view.rule === "RESUME_SELF" && context.draft) {
      // The outbox remains authoritative if updating the compatibility counter fails.
      // Prisma's @updatedAt would otherwise make our email look like user
      // progress. SQL preserves concurrent saves and only updates counters.
      await prisma.$executeRaw`UPDATE "AssessmentDraft"
        SET "draftReminderCount" = GREATEST("draftReminderCount", ${view.count + 1}),
            "lastDraftReminderSentAt" = ${result.sentAt}
        WHERE "id" = ${context.draft.id}`;
    }
  }
  return result;
}

export async function setOpportunityPreference(id: string, profileId: string, action: "snooze" | "dismiss") {
  const now = new Date();
  const current = await prisma.lifecycleOpportunity.findFirst({ where: { id, profileId, status: "OPEN" } });
  if (!current) return false;
  const updated = await prisma.lifecycleOpportunity.updateMany({ where: { id, profileId, status: "OPEN" }, data: action === "dismiss"
    ? { status: "DISMISSED", reason: "USER_DISMISSED" }
    : { snoozedUntil: new Date(now.getTime() + 7 * DAY), dueAt: new Date(now.getTime() + 7 * DAY), expiresAt: new Date(Math.max(current.expiresAt.getTime(), now.getTime() + 9 * DAY)) } });
  if (updated.count) await prisma.notification.updateMany({ where: { sourceType: "lifecycle", sourceId: id, userId: profileId }, data: { dismissed: true, dismissedAt: now } });
  return updated.count > 0;
}

export async function unsubscribeLifecycle(token: string): Promise<boolean> {
  const delivery = await prisma.lifecycleDelivery.findUnique({ where: { unsubscribeToken: token }, select: { profileId: true, recipient: true } });
  if (!delivery) return false;
  // A forwarded old email cannot change preferences for a different address.
  const result = await prisma.userProfile.updateMany({ where: { id: delivery.profileId, email: { equals: delivery.recipient, mode: "insensitive" }, deleted: false }, data: { lifecycleEmailsOptOut: true } });
  return result.count > 0;
}
