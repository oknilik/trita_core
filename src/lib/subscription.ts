import { prisma } from "./prisma";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "none";

const PAST_DUE_GRACE_DAYS = 5;

export async function getOrgSubscription(orgId: string) {
  return prisma.subscription.findUnique({
    where: { orgId },
    select: {
      status: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
    },
  });
}

export function hasAccess(sub: Awaited<ReturnType<typeof getOrgSubscription>>): boolean {
  if (!sub) return false;
  if (sub.status === "active") return true;
  if (sub.status === "trialing" && sub.trialEndsAt && sub.trialEndsAt > new Date()) return true;
  if (sub.status === "past_due" && sub.currentPeriodEnd) {
    const graceCutoff = new Date(
      sub.currentPeriodEnd.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000
    );
    if (graceCutoff > new Date()) return true;
  }
  return false;
}

export function isPastDue(sub: Awaited<ReturnType<typeof getOrgSubscription>>): boolean {
  return !!sub && sub.status === "past_due";
}

export function trialDaysLeft(sub: Awaited<ReturnType<typeof getOrgSubscription>>): number | null {
  if (!sub || sub.status !== "trialing" || !sub.trialEndsAt) return null;
  const msLeft = sub.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}
