/**
 * Notification orchestrator — central business decision layer.
 *
 * Domain events → notification intents → repository persistence.
 * Route handlers and services call orchestrator methods, never the repository directly.
 */

import { prisma } from "@/lib/prisma";
import { CAMPAIGN_STEP_LINKS } from "@/lib/campaign-steps-core";
import { NOTIFICATION_TYPE_META } from "./types";
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

/** Notify the observer that their submission was received (if they're a registered user). */
export async function handleObserverSubmitted(params: {
  observerUserId: string;
  inviterName: string;
  invitationId: string;
}) {
  const meta = NOTIFICATION_TYPE_META.OBSERVER_SUBMITTED;
  await persistNotification({
    userId: params.observerUserId,
    type: "OBSERVER_SUBMITTED",
    category: meta.category,
    priority: meta.defaultPriority,
    vars: { inviterName: params.inviterName },
    link: "/profile/results",
    sourceType: "observer_invitation",
    sourceId: params.invitationId,
    dedupeKey: `OBSERVER_SUBMITTED:${params.invitationId}`,
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
      link: `/org/${params.orgId}/settings`,
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
      link: `/org/${params.orgId}/settings`,
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

// Több-lépéses kampány: a user számára megnyílt a következő mérés-lépés.
export async function handleMeasurementStepOpened(params: {
  userId: string;
  campaignId: string;
  campaignName: string;
  stepType: string;
}) {
  const meta = NOTIFICATION_TYPE_META.MEASUREMENT_STEP_OPENED;
  // A kanonikus lépés→link térkép (campaign-steps-core) — így az új
  // lépés-típusok (TEAM_ROLE_360, TRUST_360) linkje sem marad le.
  const STEP_LINKS: Record<string, string> = CAMPAIGN_STEP_LINKS;
  await persistNotificationBatch([
    {
      userId: params.userId,
      type: "MEASUREMENT_STEP_OPENED" as const,
      category: meta.category,
      priority: meta.defaultPriority,
      vars: { campaignName: params.campaignName },
      link: STEP_LINKS[params.stepType] ?? "/dashboard",
      sourceType: "campaign" as const,
      sourceId: params.campaignId,
      dedupeKey: `MEASUREMENT_STEP_OPENED:${params.campaignId}:${params.stepType}:${params.userId}`,
    },
  ]);
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

export async function handleTeamReportPublished(params: {
  teamId: string;
  teamName: string;
  reportId: string;
  orgId?: string | null;
}) {
  const meta = NOTIFICATION_TYPE_META.TEAM_REPORT_PUBLISHED;
  const members = await prisma.teamMember.findMany({
    where: { teamId: params.teamId },
    select: { userId: true },
  });
  // Az org vezetői (manager/admin) akkor is kapjanak értesítést, ha nem
  // tagjai a csapatnak — a riport nekik (is) készül. Tanácsadó nem címzett.
  const orgLeads = params.orgId
    ? await prisma.organizationMember.findMany({
        where: {
          orgId: params.orgId,
          leftAt: null,
          role: { in: ["ORG_MANAGER", "ORG_ADMIN"] },
        },
        select: { userId: true },
      })
    : [];
  const recipientIds = [
    ...new Set([...members, ...orgLeads].map(({ userId }) => userId)),
  ];
  await persistNotificationBatch(
    recipientIds.map((userId) => ({
      userId,
      type: "TEAM_REPORT_PUBLISHED" as const,
      category: meta.category,
      priority: meta.defaultPriority,
      vars: { teamName: params.teamName },
      link: `/team/${params.teamId}?tab=report`,
      sourceType: "campaign" as const,
      sourceId: params.reportId,
      dedupeKey: `TEAM_REPORT_PUBLISHED:${params.reportId}:${userId}`,
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
        link: `/org/${orgId}/settings`,
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
        link: `/org/${orgId}/settings`,
        sourceType: "subscription_trial" as const,
        sourceId: orgId,
        dedupeKey: `TRIAL_EXPIRED:${orgId}:${userId}`,
      })),
    );
  }
}

// ── Observer kollégalista + jóváhagyási workflow (2026-07-21) ───────────────

/** Belső (csapat/szervezeti) kolléga értesítése, hogy visszajelzést kérnek tőle. */
export async function handleObserverColleagueInvited(params: {
  observerUserId: string;
  inviterName: string;
  invitationId: string;
  token: string;
}) {
  const meta = NOTIFICATION_TYPE_META.OBSERVER_COLLEAGUE_INVITED;
  await persistNotification({
    userId: params.observerUserId,
    type: "OBSERVER_COLLEAGUE_INVITED",
    category: meta.category,
    priority: meta.defaultPriority,
    vars: { inviterName: params.inviterName },
    link: `/observe/${params.token}`,
    sourceType: "observer_invitation",
    sourceId: params.invitationId,
    dedupeKey: `OBSERVER_COLLEAGUE_INVITED:${params.invitationId}`,
  });
}

/**
 * Külső meghívó jóváhagyás-kérése: a szervezet menedzserei, adminjai és
 * tanácsadói kapják (a jóváhagyó felület a cél-csapat oldalán él).
 */
export async function handleObserverApprovalRequested(params: {
  orgId: string;
  teamId: string | null;
  invitationId: string;
  inviterName: string;
  targetLabel: string;
}) {
  const meta = NOTIFICATION_TYPE_META.OBSERVER_APPROVAL_REQUESTED;
  const approvers = await prisma.organizationMember.findMany({
    where: {
      orgId: params.orgId,
      leftAt: null,
      role: { in: ["ORG_MANAGER", "ORG_ADMIN", "ORG_CONSULTANT"] },
    },
    select: { userId: true },
  });
  const link = params.teamId ? `/team/${params.teamId}?tab=members` : `/org/${params.orgId}`;
  await persistNotificationBatch(
    approvers.map((m) => ({
      userId: m.userId,
      type: "OBSERVER_APPROVAL_REQUESTED" as const,
      category: meta.category,
      priority: meta.defaultPriority,
      vars: { inviterName: params.inviterName, targetLabel: params.targetLabel },
      link,
      sourceType: "observer_invitation" as const,
      sourceId: params.invitationId,
      dedupeKey: `OBSERVER_APPROVAL_REQUESTED:${params.invitationId}:${m.userId}`,
    })),
  );
}

/** A meghívó tag értesítése a döntésről (jóváhagyva / elutasítva). */
export async function handleObserverInviteDecision(params: {
  inviterUserId: string;
  invitationId: string;
  approved: boolean;
  targetLabel: string;
}) {
  const type = params.approved ? "OBSERVER_INVITE_APPROVED" : "OBSERVER_INVITE_DECLINED";
  const meta = NOTIFICATION_TYPE_META[type];
  await persistNotification({
    userId: params.inviterUserId,
    type,
    category: meta.category,
    priority: meta.defaultPriority,
    vars: { targetLabel: params.targetLabel },
    link: "/profile/results?tab=invites",
    sourceType: "observer_invitation",
    sourceId: params.invitationId,
    dedupeKey: `${type}:${params.invitationId}`,
  });
}

// ── Inquiry events ──────────────────────────────────────────────────────────

/**
 * Új kérdés/érdeklődés érkezett (contact form). Címzettek: a platform-adminok,
 * és — ha a kérdés szervezethez kötött — az org tanácsadói (ORG_CONSULTANT).
 */
export async function handleInquiryReceived(params: {
  inquiryId: string;
  senderName: string;
  topicLabel: string;
  organizationId?: string | null;
  adminUserIds: string[];
}) {
  const meta = NOTIFICATION_TYPE_META.INQUIRY_RECEIVED;

  const consultantIds = params.organizationId
    ? (
        await prisma.organizationMember.findMany({
          where: { orgId: params.organizationId, role: "ORG_CONSULTANT" },
          select: { userId: true },
        })
      ).map((m) => m.userId)
    : [];

  // Szerep-szerinti link: admin az admin-felületre, tanácsadó a saját
  // org-cockpitjának Kérdések fülére (az /admin-t nem éri el).
  const adminIdSet = new Set(params.adminUserIds);
  const recipientIds = [...new Set([...params.adminUserIds, ...consultantIds])];
  await persistNotificationBatch(
    recipientIds.map((userId) => ({
      userId,
      type: "INQUIRY_RECEIVED" as const,
      category: meta.category,
      priority: meta.defaultPriority,
      vars: { name: params.senderName, topic: params.topicLabel },
      link: adminIdSet.has(userId)
        ? "/admin?tab=inquiries"
        : `/org/${params.organizationId}?tab=inquiries`,
      sourceType: "inquiry" as const,
      sourceId: params.inquiryId,
      dedupeKey: `INQUIRY_RECEIVED:${params.inquiryId}:${userId}`,
    })),
  );
}

// ── Candidate events ────────────────────────────────────────────────────────

/**
 * Jelölt kitöltötte a felmérést — értesítés az org tanácsadóinak
 * (ORG_CONSULTANT) és adminjainak (ORG_ADMIN). A link a jelölt-részletezőre
 * mutat (kitöltés után az eredmény már él).
 */
export async function handleCandidateCompleted(params: {
  inviteId: string;
  candidateName: string;
  position?: string | null;
  orgId: string;
}) {
  const meta = NOTIFICATION_TYPE_META.CANDIDATE_COMPLETED;

  const recipients = await prisma.organizationMember.findMany({
    where: {
      orgId: params.orgId,
      leftAt: null,
      role: { in: ["ORG_CONSULTANT", "ORG_ADMIN"] },
    },
    select: { userId: true },
  });

  await persistNotificationBatch(
    recipients.map((m) => ({
      userId: m.userId,
      type: "CANDIDATE_COMPLETED" as const,
      category: meta.category,
      priority: meta.defaultPriority,
      vars: {
        name: params.candidateName,
        position: params.position ? ` (${params.position})` : "",
      },
      link: `/hiring/${params.orgId}/candidates/${params.inviteId}`,
      sourceType: "candidate_invite" as const,
      sourceId: params.inviteId,
      dedupeKey: `CANDIDATE_COMPLETED:${params.inviteId}:${m.userId}`,
    })),
  );
}
