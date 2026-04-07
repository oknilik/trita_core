/**
 * Server-side notification creation helpers.
 *
 * Notifications store i18n keys + vars in DB — rendering happens client-side
 * via tf(titleKey, locale, vars) so language switching works for all history.
 */

import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

// ── Type → i18n key mapping ─────────────────────────────────────────────────

const TYPE_KEYS: Record<NotificationType, { titleKey: string; bodyKey: string }> = {
  OBSERVER_COMPLETED:          { titleKey: "notifications.observerCompleted.title",          bodyKey: "notifications.observerCompleted.body" },
  RESULT_READY:                { titleKey: "notifications.resultReady.title",                bodyKey: "notifications.resultReady.body" },
  PURCHASE_CONFIRMED:          { titleKey: "notifications.purchaseConfirmed.title",          bodyKey: "notifications.purchaseConfirmed.body" },
  ORG_INVITE_RECEIVED:         { titleKey: "notifications.orgInviteReceived.title",          bodyKey: "notifications.orgInviteReceived.body" },
  CAMPAIGN_LAUNCHED:           { titleKey: "notifications.campaignLaunched.title",           bodyKey: "notifications.campaignLaunched.body" },
  CAMPAIGN_CLOSED:             { titleKey: "notifications.campaignClosed.title",             bodyKey: "notifications.campaignClosed.body" },
  TEAM_MEMBER_ADDED:           { titleKey: "notifications.teamMemberAdded.title",            bodyKey: "notifications.teamMemberAdded.body" },
  ORG_INVITE_ACCEPTED:         { titleKey: "notifications.orgInviteAccepted.title",          bodyKey: "notifications.orgInviteAccepted.body" },
  TRIAL_ENDING_SOON:           { titleKey: "notifications.trialEndingSoon.title",            bodyKey: "notifications.trialEndingSoon.body" },
  TRIAL_EXPIRED:               { titleKey: "notifications.trialExpired.title",               bodyKey: "notifications.trialExpired.body" },
  PAYMENT_FAILED:              { titleKey: "notifications.paymentFailed.title",              bodyKey: "notifications.paymentFailed.body" },
  SUBSCRIPTION_FROZEN:         { titleKey: "notifications.subscriptionFrozen.title",         bodyKey: "notifications.subscriptionFrozen.body" },
  LOW_CANDIDATE_CREDITS:       { titleKey: "notifications.lowCandidateCredits.title",        bodyKey: "notifications.lowCandidateCredits.body" },
  MEMBER_COMPLETED_ASSESSMENT: { titleKey: "notifications.memberCompletedAssessment.title",  bodyKey: "notifications.memberCompletedAssessment.body" },
  CAMPAIGN_MILESTONE:          { titleKey: "notifications.campaignMilestone.title",          bodyKey: "notifications.campaignMilestone.body" },
};

// ── Public API ──────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  vars?: Record<string, string | number>;
  link?: string;
}

/** Create a single notification for one user. */
export async function createNotification(input: CreateNotificationInput) {
  const keys = TYPE_KEYS[input.type];
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      titleKey: keys.titleKey,
      bodyKey: keys.bodyKey,
      vars: input.vars ?? undefined,
      link: input.link ?? null,
    },
  });
}

/** Notify all org members at or above a minimum role. */
export async function createOrgNotification(
  orgId: string,
  type: NotificationType,
  opts: {
    vars?: Record<string, string | number>;
    link?: string;
    minRole?: "ORG_MEMBER" | "ORG_MANAGER" | "ORG_ADMIN";
  } = {},
) {
  const roleFilter = opts.minRole
    ? { role: { in: getRolesAtOrAbove(opts.minRole) } }
    : {};

  const members = await prisma.organizationMember.findMany({
    where: { orgId, leftAt: null, ...roleFilter },
    select: { userId: true },
  });

  if (members.length === 0) return;

  const keys = TYPE_KEYS[type];
  await prisma.notification.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      type,
      titleKey: keys.titleKey,
      bodyKey: keys.bodyKey,
      vars: opts.vars ?? undefined,
      link: opts.link ?? null,
    })),
  });
}

// ── Trial check (lazy — runs on org dashboard load) ─────────────────────────

export async function checkTrialNotifications(orgId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { orgId },
    select: { status: true, trialEndsAt: true },
  });
  if (!sub?.trialEndsAt) return;

  const now = new Date();
  const daysLeft = Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / 86400000);

  if (sub.status === "trialing" && daysLeft <= 3 && daysLeft > 0) {
    // Only create if not already notified (check last 3 days)
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
    const existing = await prisma.notification.findFirst({
      where: {
        type: "TRIAL_ENDING_SOON",
        createdAt: { gte: threeDaysAgo },
        userId: {
          in: (await prisma.organizationMember.findMany({
            where: { orgId, role: "ORG_ADMIN", leftAt: null },
            select: { userId: true },
          })).map((m) => m.userId),
        },
      },
    });
    if (!existing) {
      await createOrgNotification(orgId, "TRIAL_ENDING_SOON", {
        vars: { days: daysLeft },
        link: `/org/${orgId}?tab=billing`,
        minRole: "ORG_ADMIN",
      });
    }
  }

  if (sub.status === "trialing" && daysLeft <= 0) {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const existing = await prisma.notification.findFirst({
      where: {
        type: "TRIAL_EXPIRED",
        createdAt: { gte: sevenDaysAgo },
        userId: {
          in: (await prisma.organizationMember.findMany({
            where: { orgId, role: "ORG_ADMIN", leftAt: null },
            select: { userId: true },
          })).map((m) => m.userId),
        },
      },
    });
    if (!existing) {
      await createOrgNotification(orgId, "TRIAL_EXPIRED", {
        link: `/org/${orgId}?tab=billing`,
        minRole: "ORG_ADMIN",
      });
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getRolesAtOrAbove(minRole: string): string[] {
  const hierarchy = ["ORG_MEMBER", "ORG_MANAGER", "ORG_ADMIN"];
  const idx = hierarchy.indexOf(minRole);
  return idx >= 0 ? hierarchy.slice(idx) : hierarchy;
}
