/**
 * Notification domain types — shared across orchestrator, repository, and policy.
 */

import type { NotificationType } from "@prisma/client";

// ── Category & Priority ─────────────────────────────────────────────────────

export type NotificationCategory =
  | "assessment"
  | "observer"
  | "org"
  | "campaign"
  | "billing"
  | "system";

export type NotificationPriority = "low" | "normal" | "high";

// ── Source tracking ─────────────────────────────────────────────────────────

export type NotificationSourceType =
  | "observer_invitation"
  | "assessment_result"
  | "purchase"
  | "org_invite"
  | "org_membership"
  | "campaign"
  | "stripe_invoice"
  | "stripe_subscription"
  | "subscription_trial"
  | "inquiry";

// ── Notification intent (orchestrator output → repository input) ────────────

export interface NotificationIntent {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  vars?: Record<string, string | number>;
  link?: string;
  sourceType?: NotificationSourceType;
  sourceId?: string;
  actorUserId?: string;
  dedupeKey?: string;
}

// ── Type metadata registry ──────────────────────────────────────────────────

export interface NotificationTypeMeta {
  titleKey: string;
  bodyKey: string;
  category: NotificationCategory;
  defaultPriority: NotificationPriority;
}

export const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  OBSERVER_COMPLETED:          { titleKey: "notifications.observerCompleted.title",          bodyKey: "notifications.observerCompleted.body",          category: "observer",    defaultPriority: "normal" },
  OBSERVER_SUBMITTED:          { titleKey: "notifications.observerSubmitted.title",          bodyKey: "notifications.observerSubmitted.body",          category: "observer",    defaultPriority: "low"    },
  RESULT_READY:                { titleKey: "notifications.resultReady.title",                bodyKey: "notifications.resultReady.body",                category: "assessment",  defaultPriority: "normal" },
  PURCHASE_CONFIRMED:          { titleKey: "notifications.purchaseConfirmed.title",          bodyKey: "notifications.purchaseConfirmed.body",          category: "billing",     defaultPriority: "normal" },
  ORG_INVITE_RECEIVED:         { titleKey: "notifications.orgInviteReceived.title",          bodyKey: "notifications.orgInviteReceived.body",          category: "org",         defaultPriority: "normal" },
  CAMPAIGN_LAUNCHED:           { titleKey: "notifications.campaignLaunched.title",           bodyKey: "notifications.campaignLaunched.body",           category: "campaign",    defaultPriority: "normal" },
  CAMPAIGN_CLOSED:             { titleKey: "notifications.campaignClosed.title",             bodyKey: "notifications.campaignClosed.body",             category: "campaign",    defaultPriority: "normal" },
  TEAM_MEMBER_ADDED:           { titleKey: "notifications.teamMemberAdded.title",            bodyKey: "notifications.teamMemberAdded.body",            category: "org",         defaultPriority: "low"    },
  TEAM_REPORT_PUBLISHED:       { titleKey: "notifications.teamReportPublished.title",        bodyKey: "notifications.teamReportPublished.body",        category: "org",         defaultPriority: "high"   },
  ORG_INVITE_ACCEPTED:         { titleKey: "notifications.orgInviteAccepted.title",          bodyKey: "notifications.orgInviteAccepted.body",          category: "org",         defaultPriority: "normal" },
  TRIAL_ENDING_SOON:           { titleKey: "notifications.trialEndingSoon.title",            bodyKey: "notifications.trialEndingSoon.body",            category: "billing",     defaultPriority: "high"   },
  TRIAL_EXPIRED:               { titleKey: "notifications.trialExpired.title",               bodyKey: "notifications.trialExpired.body",               category: "billing",     defaultPriority: "high"   },
  PAYMENT_FAILED:              { titleKey: "notifications.paymentFailed.title",              bodyKey: "notifications.paymentFailed.body",              category: "billing",     defaultPriority: "high"   },
  SUBSCRIPTION_FROZEN:         { titleKey: "notifications.subscriptionFrozen.title",         bodyKey: "notifications.subscriptionFrozen.body",         category: "billing",     defaultPriority: "high"   },
  LOW_CANDIDATE_CREDITS:       { titleKey: "notifications.lowCandidateCredits.title",        bodyKey: "notifications.lowCandidateCredits.body",        category: "billing",     defaultPriority: "normal" },
  MEMBER_COMPLETED_ASSESSMENT: { titleKey: "notifications.memberCompletedAssessment.title",  bodyKey: "notifications.memberCompletedAssessment.body",  category: "assessment",  defaultPriority: "low"    },
  CAMPAIGN_MILESTONE:          { titleKey: "notifications.campaignMilestone.title",          bodyKey: "notifications.campaignMilestone.body",          category: "campaign",    defaultPriority: "normal" },
  MEASUREMENT_STEP_OPENED:     { titleKey: "notifications.stepOpened.title",                  bodyKey: "notifications.stepOpened.body",                 category: "campaign",    defaultPriority: "normal" },
  OBSERVER_COLLEAGUE_INVITED:  { titleKey: "notifications.observerColleagueInvited.title",   bodyKey: "notifications.observerColleagueInvited.body",   category: "observer",    defaultPriority: "normal" },
  OBSERVER_APPROVAL_REQUESTED: { titleKey: "notifications.observerApprovalRequested.title",  bodyKey: "notifications.observerApprovalRequested.body",  category: "observer",    defaultPriority: "normal" },
  OBSERVER_INVITE_APPROVED:    { titleKey: "notifications.observerInviteApproved.title",     bodyKey: "notifications.observerInviteApproved.body",     category: "observer",    defaultPriority: "normal" },
  OBSERVER_INVITE_DECLINED:    { titleKey: "notifications.observerInviteDeclined.title",     bodyKey: "notifications.observerInviteDeclined.body",     category: "observer",    defaultPriority: "normal" },
  INQUIRY_RECEIVED:            { titleKey: "notifications.inquiryReceived.title",            bodyKey: "notifications.inquiryReceived.body",            category: "system",      defaultPriority: "high"   },
};
