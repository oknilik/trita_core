/**
 * Notification module — public API.
 *
 * Route handlers and services import from here, never from repository or policy directly.
 */

export {
  handleObserverCompleted,
  handleObserverSubmitted,
  handleResultReady,
  handlePurchaseConfirmed,
  handlePaymentFailed,
  handleSubscriptionFrozen,
  handleOrgInviteReceived,
  handleOrgInviteAccepted,
  handleCampaignLaunched,
  handleMeasurementStepOpened,
  handleCampaignClosed,
  handleTeamReportPublished,
  checkTrialNotifications,
} from "./orchestrator";

export type {
  NotificationCategory,
  NotificationPriority,
  NotificationSourceType,
  NotificationIntent,
} from "./types";
