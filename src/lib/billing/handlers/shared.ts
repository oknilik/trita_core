/**
 * Shared types and helpers for billing webhook handlers.
 */

import type Stripe from "stripe";
import type { stripe } from "@/lib/stripe";
import type { prisma } from "@/lib/prisma";
import type { sendOrderConfirmationEmail } from "@/lib/emails";
import type { addCredits } from "@/lib/candidate-credits";

export type StripeWebhookRuntime = {
  stripe: typeof stripe;
  prisma: typeof prisma;
  sendOrderConfirmationEmail: typeof sendOrderConfirmationEmail;
  addCredits: typeof addCredits;
};

export function extractCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  return customer.id;
}

export function extractSubscriptionId(
  subscription: string | Stripe.Subscription | null | undefined,
): string | null {
  if (!subscription) return null;
  if (typeof subscription === "string") return subscription;
  return subscription.id;
}

export async function upsertSubscription(
  runtime: StripeWebhookRuntime,
  orgId: string,
  subscription: Stripe.Subscription,
  customerId: string,
) {
  const periodStart = subscription.items.data[0]?.current_period_start;
  const periodEnd = subscription.items.data[0]?.current_period_end;

  await runtime.prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      status: subscription.status,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      currentPeriodStart: periodStart
        ? new Date(periodStart * 1000)
        : null,
      currentPeriodEnd: periodEnd
        ? new Date(periodEnd * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      status: subscription.status,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      currentPeriodStart: periodStart
        ? new Date(periodStart * 1000)
        : null,
      currentPeriodEnd: periodEnd
        ? new Date(periodEnd * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}
