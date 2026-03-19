import { stripe, STRIPE_PRICES, EXTRA_SEAT_PRICES } from "./stripe";
import { prisma } from "./prisma";
import { getPlanTier, PLAN_SEAT_LIMITS } from "./subscription";

/**
 * Syncs the Stripe subscription's extra-seat line item quantity with the
 * actual OrganizationMember count for the given org.
 *
 * - team plan: 10 seats included, €19/seat/mo for extras
 * - org plan:  40 seats included, €19/seat/mo for extras
 * - scale:     unlimited — nothing to sync
 *
 * Idempotent: safe to call multiple times; only writes when quantity changes.
 */
export async function syncSeatBilling(orgId: string): Promise<{
  extraSeats: number;
  updated: boolean;
}> {
  const sub = await prisma.subscription.findUnique({
    where: { orgId },
    select: {
      stripeSubscriptionId: true,
      stripePriceId: true,
      stripeCustomerId: true,
      status: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      candidateCredits: true,
    },
  });

  if (!sub?.stripeSubscriptionId || !sub.stripePriceId) {
    return { extraSeats: 0, updated: false };
  }

  if (sub.status !== "active" && sub.status !== "trialing") {
    return { extraSeats: 0, updated: false };
  }

  const tier = getPlanTier(sub);
  const includedSeats = PLAN_SEAT_LIMITS[tier];

  if (includedSeats === Infinity) {
    return { extraSeats: 0, updated: false };
  }

  const memberCount = await prisma.organizationMember.count({ where: { orgId } });
  const extraSeatsNeeded = Math.max(0, memberCount - includedSeats);

  const isAnnual =
    sub.stripePriceId === STRIPE_PRICES.team_annual ||
    sub.stripePriceId === STRIPE_PRICES.org_annual;

  const extraSeatPriceId = isAnnual
    ? EXTRA_SEAT_PRICES.annual
    : EXTRA_SEAT_PRICES.monthly;

  if (!extraSeatPriceId) {
    console.warn("[SeatBilling] Extra seat price not configured in env");
    return { extraSeats: extraSeatsNeeded, updated: false };
  }

  const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  const existingItem = stripeSub.items.data.find(
    (item) => item.price.id === extraSeatPriceId
  );

  if (extraSeatsNeeded === 0 && !existingItem) {
    return { extraSeats: 0, updated: false };
  }

  if (extraSeatsNeeded === 0 && existingItem) {
    await stripe.subscriptionItems.del(existingItem.id, {
      proration_behavior: "create_prorations",
    });
    console.log(`[SeatBilling] Removed extra seat item for org ${orgId}`);
    return { extraSeats: 0, updated: true };
  }

  if (existingItem) {
    if (existingItem.quantity === extraSeatsNeeded) {
      return { extraSeats: extraSeatsNeeded, updated: false };
    }
    await stripe.subscriptionItems.update(existingItem.id, {
      quantity: extraSeatsNeeded,
      proration_behavior: "create_prorations",
    });
    console.log(
      `[SeatBilling] Updated extra seats for org ${orgId}: ${existingItem.quantity} → ${extraSeatsNeeded}`
    );
    return { extraSeats: extraSeatsNeeded, updated: true };
  }

  await stripe.subscriptionItems.create({
    subscription: sub.stripeSubscriptionId,
    price: extraSeatPriceId,
    quantity: extraSeatsNeeded,
    proration_behavior: "create_prorations",
  });
  console.log(`[SeatBilling] Added ${extraSeatsNeeded} extra seats for org ${orgId}`);
  return { extraSeats: extraSeatsNeeded, updated: true };
}
