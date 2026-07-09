import { prisma } from "./prisma";

// Trial length for manually provisioned orgs (consulting mode — no Stripe)
export const TRIAL_DAYS = 14;

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "none";

export type SubscriptionState = "none" | "active" | "restricted" | "frozen";

const RESTRICTED_TO_FROZEN_DAYS = 30;

export async function getOrgSubscription(orgId: string) {
  return prisma.subscription.findUnique({
    where: { orgId },
    select: {
      status: true,
      planType: true,
      billingInterval: true,
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

type SubscriptionRecord = NonNullable<Awaited<ReturnType<typeof getOrgSubscription>>>;

function toFrozenThreshold(currentPeriodEnd: Date): Date {
  return new Date(
    currentPeriodEnd.getTime() + RESTRICTED_TO_FROZEN_DAYS * 24 * 60 * 60 * 1000,
  );
}

/**
 * 3-szintű előfizetés-állapot a journey/access döntésekhez.
 *
 * ACTIVE:
 * - status: active
 * - status: trialing && trialEndsAt > now
 *
 * RESTRICTED:
 * - status: past_due
 * - status: unpaid
 * - status: canceled és currentPeriodEnd >= now - 30d
 * - minden egyéb nem-active, nem-frozen eset
 *
 * FROZEN:
 * - status: canceled és currentPeriodEnd < now - 30d
 */
export function getSubscriptionState(
  sub: Pick<SubscriptionRecord, "status" | "trialEndsAt" | "currentPeriodEnd"> | null,
  now = new Date(),
): SubscriptionState {
  if (!sub || sub.status === "none") return "none";

  if (sub.status === "active") return "active";
  if (sub.status === "trialing" && sub.trialEndsAt && sub.trialEndsAt > now) return "active";

  if (sub.status === "canceled" && sub.currentPeriodEnd) {
    const frozenThreshold = toFrozenThreshold(sub.currentPeriodEnd);
    if (now >= frozenThreshold) return "frozen";
  }

  return "restricted";
}

export type PlanTier = "team" | "org" | "scale" | "none";

export function getPlanTier(
  sub: { planType?: string | null; stripePriceId?: string | null } | null | undefined
): PlanTier {
  if (!sub) return "none";
  if (sub.planType === "team" || sub.planType === "org" || sub.planType === "scale") {
    return sub.planType;
  }
  // Legacy records created before planType existed carry only a price id
  if (sub.stripePriceId) return "team";
  return "none";
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
  return getSubscriptionState(sub) === "active";
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
