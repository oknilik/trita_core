/**
 * Notification recipient policy — determines WHO gets which notification.
 *
 * Centralizes role-based filtering so the orchestrator doesn't
 * scatter recipient logic across event handlers.
 */

import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

// ── Role requirements per type ──────────────────────────────────────────────

type MinRole = "ORG_MEMBER" | "ORG_MANAGER" | "ORG_ADMIN";

const ORG_NOTIFICATION_MIN_ROLE: Partial<Record<NotificationType, MinRole>> = {
  // Admin-only
  PAYMENT_FAILED: "ORG_ADMIN",
  SUBSCRIPTION_FROZEN: "ORG_ADMIN",
  TRIAL_ENDING_SOON: "ORG_ADMIN",
  TRIAL_EXPIRED: "ORG_ADMIN",
  LOW_CANDIDATE_CREDITS: "ORG_ADMIN",
  ORG_INVITE_ACCEPTED: "ORG_ADMIN",

  // Manager+
  MEMBER_COMPLETED_ASSESSMENT: "ORG_MANAGER",
  CAMPAIGN_MILESTONE: "ORG_MANAGER",

  // All members
  CAMPAIGN_LAUNCHED: "ORG_MEMBER",
  MEASUREMENT_STEP_OPENED: "ORG_MEMBER",
  CAMPAIGN_CLOSED: "ORG_MEMBER",
  TEAM_MEMBER_ADDED: "ORG_MEMBER",
};

// ── Resolve recipients for an org notification ──────────────────────────────

function rolesAtOrAbove(minRole: MinRole): string[] {
  // A consultant kampány-operátor: lifecycle és milestone értesítést kap,
  // admin-only számlázási/biztonsági eseményt nem.
  if (minRole === "ORG_ADMIN") return ["ORG_ADMIN"];
  if (minRole === "ORG_MANAGER") return ["ORG_MANAGER", "ORG_CONSULTANT", "ORG_ADMIN"];
  return ["ORG_MEMBER", "ORG_MANAGER", "ORG_CONSULTANT", "ORG_ADMIN"];
}

export async function resolveOrgRecipients(
  orgId: string,
  type: NotificationType,
): Promise<string[]> {
  const minRole = ORG_NOTIFICATION_MIN_ROLE[type] ?? "ORG_MEMBER";
  const roles = rolesAtOrAbove(minRole);

  const members = await prisma.organizationMember.findMany({
    where: { orgId, leftAt: null, role: { in: roles } },
    select: { userId: true },
  });

  return members.map((m) => m.userId);
}

/** Check if a notification type is personal (single recipient) or org-wide. */
export function isPersonalNotificationType(type: NotificationType): boolean {
  return !ORG_NOTIFICATION_MIN_ROLE[type];
}
