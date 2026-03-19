import { prisma } from "./prisma";
import { TEAM_PRICE_IDS, ORG_PRICE_IDS } from "./stripe";

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
      candidateCredits: true,
    },
  });
}

export type PlanTier = "team" | "org" | "scale" | "none";

export function getPlanTier(
  sub: Awaited<ReturnType<typeof getOrgSubscription>>
): PlanTier {
  if (!sub || !sub.stripePriceId) return "none";
  if (ORG_PRICE_IDS.includes(sub.stripePriceId)) return "org";
  if (TEAM_PRICE_IDS.includes(sub.stripePriceId)) return "team";
  return "scale";
}

export function hasCandidateAccess(
  sub: Awaited<ReturnType<typeof getOrgSubscription>>
): boolean {
  if (!sub || !hasAccess(sub)) return false;
  const tier = getPlanTier(sub);
  if (tier === "org" || tier === "scale") return true;
  // Team: credit-based access
  return (sub.candidateCredits ?? 0) > 0;
}

export async function getCandidateCredits(orgId: string): Promise<number> {
  const sub = await prisma.subscription.findUnique({
    where: { orgId },
    select: { candidateCredits: true },
  });
  return sub?.candidateCredits ?? 0;
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

// --- Seat billing ---

export const PLAN_SEAT_LIMITS: Record<PlanTier, number> = {
  team: 10,
  org: 40,
  scale: Infinity,
  none: 0,
};

export function getIncludedSeats(
  sub: Awaited<ReturnType<typeof getOrgSubscription>>
): number {
  return PLAN_SEAT_LIMITS[getPlanTier(sub)];
}

export function calculateExtraSeats(
  sub: Awaited<ReturnType<typeof getOrgSubscription>>,
  currentMemberCount: number
): number {
  const included = getIncludedSeats(sub);
  if (included === Infinity) return 0;
  return Math.max(0, currentMemberCount - included);
}

export function canAddMember(
  sub: Awaited<ReturnType<typeof getOrgSubscription>>,
  currentMemberCount: number
): { allowed: boolean; requiresExtraSeat: boolean; extraSeatsAfterAdd: number } {
  if (!sub || !hasAccess(sub)) {
    return { allowed: false, requiresExtraSeat: false, extraSeatsAfterAdd: 0 };
  }

  const tier = getPlanTier(sub);
  if (tier === "scale") {
    return { allowed: true, requiresExtraSeat: false, extraSeatsAfterAdd: 0 };
  }

  const included = PLAN_SEAT_LIMITS[tier];
  const extraAfter = Math.max(0, currentMemberCount + 1 - included);
  const extraBefore = Math.max(0, currentMemberCount - included);

  return {
    allowed: true,
    requiresExtraSeat: extraAfter > extraBefore,
    extraSeatsAfterAdd: extraAfter,
  };
}
