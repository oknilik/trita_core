/**
 * Notification orchestrator — central business decision layer.
 *
 * Domain events → notification intents → repository persistence.
 * Route handlers and services call orchestrator methods, never the repository directly.
 */

import { prisma } from "@/lib/prisma";
import {
  NOTIFICATION_TYPE_META,
  type NotificationIntent,
} from "./types";
import { persistNotification, persistNotificationBatch } from "./repository";
import { resolveOrgRecipients } from "./policy";

// ── Observer events ─────────────────────────────────────────────────────────

export async function handleObserverCompleted(params: {
  inviterId: string;
  observerName: string;
  invitationId: string;
}) {
  const meta = NOTIFICATION_TYPE_META.OBSERVER_COMPLETED;
  await persistNotification({
    userId: params.inviterId,
    type: "OBSERVER_COMPLETED",
    category: meta.category,
    priority: meta.defaultPriority,
    vars: { name: params.observerName },
    link: "/profile/results",
    sourceType: "observer_invitation",
    sourceId: params.invitationId,
    dedupeKey: `OBSERVER_COMPLETED:${params.invitationId}`,
  });
}

// ── Assessment events ───────────────────────────────────────────────────────

export async function handleResultReady(params: {
  userId: string;
  assessmentResultId: string;
}) {
  const meta = NOTIFICATION_TYPE_META.RESULT_READY;
  await persistNotification({
    userId: params.userId,
    type: "RESULT_READY",
    category: meta.category,
    priority: meta.defaultPriority,
    link: "/profile/results",
    sourceType: "assessment_result",
    sourceId: params.assessmentResultId,
    dedupeKey: `RESULT_READY:${params.assessmentResultId}`,
  });
}

// ── Billing events ──────────────────────────────────────────────────────────

export async function handlePurchaseConfirmed(params: {
  userId: string;
  purchaseId?: string;
}) {
  const meta = NOTIFICATION_TYPE_META.PURCHASE_CONFIRMED;
  await persistNotification({
    userId: params.userId,
    type: "PURCHASE_CONFIRMED",
    category: meta.category,
    priority: meta.defaultPriority,
    link: "/profile/results",
    sourceType: "purchase",
    sourceId: params.purchaseId,
    dedupeKey: params.purchaseId ? `PURCHASE_CONFIRMED:${params.purchaseId}` : undefined,
  });
}

export async function handlePaymentFailed(params: {
  orgId: string;
  stripeInvoiceId?: string;
}) {
  const meta = NOTIFICATION_TYPE_META.PAYMENT_FAILED;
  const recipients = await resolveOrgRecipients(params.orgId, "PAYMENT_FAILED");
  await persistNotificationBatch(
    recipients.map((userId) => ({
      userId,
      type: "PAYMENT_FAILED" as const,
      category: meta.category,
      priority: meta.defaultPriority,
      link: `/org/${params.orgId}?tab=billing`,
      sourceType: "stripe_invoice" as const,
      sourceId: params.stripeInvoiceId,
      dedupeKey: params.stripeInvoiceId
        ? `PAYMENT_FAILED:${params.stripeInvoiceId}:${userId}`
        : undefined,
    })),
  );
}

export async function handleSubscriptionFrozen(params: {
  orgId: string;
  stripeSubscriptionId?: string;
}) {
  const meta = NOTIFICATION_TYPE_META.SUBSCRIPTION_FROZEN;
  const recipients = await resolveOrgRecipients(params.orgId, "SUBSCRIPTION_FROZEN");
  await persistNotificationBatch(
    recipients.map((userId) => ({
      userId,
      type: "SUBSCRIPTION_FROZEN" as const,
      category: meta.category,
      priority: meta.defaultPriority,
      link: `/org/${params.orgId}?tab=billing`,
      sourceType: "stripe_subscription" as const,
      sourceId: params.stripeSubscriptionId,
      dedupeKey: `SUBSCRIPTION_FROZEN:${params.orgId}:${userId}`,
    })),
  );
}

// ── Org events ──────────────────────────────────────────────────────────────

export async function handleOrgInviteReceived(params: {
  userId: string;
  orgId: string;
  orgName: string;
  inviteId?: string;
}) {
  const meta = NOTIFICATION_TYPE_META.ORG_INVITE_RECEIVED;
  await persistNotification({
    userId: params.userId,
    type: "ORG_INVITE_RECEIVED",
    category: meta.category,
    priority: meta.defaultPriority,
    vars: { orgName: params.orgName },
    link: `/org/${params.orgId}`,
    sourceType: "org_invite",
    sourceId: params.inviteId,
    dedupeKey: params.inviteId ? `ORG_INVITE_RECEIVED:${params.inviteId}` : undefined,
  });
}

export async function handleOrgInviteAccepted(params: {
  orgId: string;
  memberName: string;
  memberUserId: string;
}) {
  const meta = NOTIFICATION_TYPE_META.ORG_INVITE_ACCEPTED;
  const recipients = await resolveOrgRecipients(params.orgId, "ORG_INVITE_ACCEPTED");
  await persistNotificationBatch(
    recipients
      .filter((uid) => uid !== params.memberUserId) // Don't notify the person who just joined
      .map((userId) => ({
        userId,
        type: "ORG_INVITE_ACCEPTED" as const,
        category: meta.category,
        priority: meta.defaultPriority,
        vars: { name: params.memberName },
        link: `/org/${params.orgId}?tab=members`,
        sourceType: "org_membership" as const,
        sourceId: params.memberUserId,
        actorUserId: params.memberUserId,
        dedupeKey: `ORG_INVITE_ACCEPTED:${params.memberUserId}:${userId}`,
      })),
  );
}

// ── Campaign events ─────────────────────────────────────────────────────────

export async function handleCampaignLaunched(params: {
  orgId: string;
  campaignId: string;
  campaignName: string;
}) {
  const meta = NOTIFICATION_TYPE_META.CAMPAIGN_LAUNCHED;
  const recipients = await resolveOrgRecipients(params.orgId, "CAMPAIGN_LAUNCHED");
  await persistNotificationBatch(
    recipients.map((userId) => ({
      userId,
      type: "CAMPAIGN_LAUNCHED" as const,
      category: meta.category,
      priority: meta.defaultPriority,
      vars: { campaignName: params.campaignName },
      link: `/org/${params.orgId}?tab=campaigns`,
      sourceType: "campaign" as const,
      sourceId: params.campaignId,
      dedupeKey: `CAMPAIGN_LAUNCHED:${params.campaignId}:${userId}`,
    })),
  );
}

export async function handleCampaignClosed(params: {
  orgId: string;
  campaignId: string;
  campaignName: string;
}) {
  const meta = NOTIFICATION_TYPE_META.CAMPAIGN_CLOSED;
  const recipients = await resolveOrgRecipients(params.orgId, "CAMPAIGN_CLOSED");
  await persistNotificationBatch(
    recipients.map((userId) => ({
      userId,
      type: "CAMPAIGN_CLOSED" as const,
      category: meta.category,
      priority: meta.defaultPriority,
      vars: { campaignName: params.campaignName },
      link: `/org/${params.orgId}?tab=campaigns`,
      sourceType: "campaign" as const,
      sourceId: params.campaignId,
      dedupeKey: `CAMPAIGN_CLOSED:${params.campaignId}:${userId}`,
    })),
  );
}

// ── Trial events ────────────────────────────────────────────────────────────

/**
 * Lazy trial check — call on org dashboard load.
 * Creates TRIAL_ENDING_SOON or TRIAL_EXPIRED if not already notified.
 */
export async function checkTrialNotifications(orgId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { orgId },
    select: { status: true, trialEndsAt: true },
  });
  if (!sub?.trialEndsAt) return;

  const now = new Date();
  const daysLeft = Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / 86400000);

  if (sub.status === "trialing" && daysLeft <= 3 && daysLeft > 0) {
    const meta = NOTIFICATION_TYPE_META.TRIAL_ENDING_SOON;
    const recipients = await resolveOrgRecipients(orgId, "TRIAL_ENDING_SOON");
    await persistNotificationBatch(
      recipients.map((userId) => ({
        userId,
        type: "TRIAL_ENDING_SOON" as const,
        category: meta.category,
        priority: meta.defaultPriority,
        vars: { days: daysLeft },
        link: `/org/${orgId}?tab=billing`,
        sourceType: "subscription_trial" as const,
        sourceId: orgId,
        dedupeKey: `TRIAL_ENDING_SOON:${orgId}:${userId}`,
      })),
    );
  }

  if (sub.status === "trialing" && daysLeft <= 0) {
    const meta = NOTIFICATION_TYPE_META.TRIAL_EXPIRED;
    const recipients = await resolveOrgRecipients(orgId, "TRIAL_EXPIRED");
    await persistNotificationBatch(
      recipients.map((userId) => ({
        userId,
        type: "TRIAL_EXPIRED" as const,
        category: meta.category,
        priority: meta.defaultPriority,
        link: `/org/${orgId}?tab=billing`,
        sourceType: "subscription_trial" as const,
        sourceId: orgId,
        dedupeKey: `TRIAL_EXPIRED:${orgId}:${userId}`,
      })),
    );
  }
}
