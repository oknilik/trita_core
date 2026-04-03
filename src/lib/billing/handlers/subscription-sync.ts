/**
 * F1 + F5 + F6 — Subscription lifecycle handlers
 *
 * customer.subscription.created / updated / deleted
 */

import type Stripe from "stripe";
import { traceBillingEvent } from "@/lib/billing/tracing";
import {
  isEventProcessed,
  markEventProcessing,
  markEventProcessed,
  markEventFailed,
} from "@/lib/billing/idempotency";
import type { StripeWebhookRuntime } from "./shared";
import { extractCustomerId, upsertSubscription } from "./shared";

export async function handleSubscriptionEvent(
  runtime: StripeWebhookRuntime,
  event: Stripe.Event,
) {
  if (await isEventProcessed(event.id)) {
    console.log(`[Stripe] Skipping already processed event ${event.id}`);
    return;
  }

  const subscription = event.data.object as Stripe.Subscription;
  const customerId = extractCustomerId(subscription.customer);
  if (!customerId) return;

  const orgId = subscription.metadata?.orgId;
  if (!orgId) return;

  await markEventProcessing(event.id, event.type, subscription.id);

  try {
    await upsertSubscription(runtime, orgId, subscription, customerId);

    // F5: Note — order confirmation email moved to invoice.paid handler
    //     (canonical payment trigger, not state transition)

    // F5: Log plan/quantity/cancel changes
    if (event.type === "customer.subscription.updated") {
      const prev = event.data.previous_attributes as Record<string, unknown> | undefined;
      if (prev) {
        if ("items" in prev) {
          console.log(`[Stripe] Plan/quantity changed for org ${orgId}`);
        }
        if ("cancel_at_period_end" in prev) {
          console.log(`[Stripe] Cancel flag changed for org ${orgId}: cancelAtPeriodEnd=${subscription.cancel_at_period_end}`);
        }
      }
    }

    // F6: subscription deleted → ensure local state is canceled
    if (event.type === "customer.subscription.deleted") {
      await runtime.prisma.subscription.update({
        where: { orgId },
        data: { status: "canceled" },
      });
      traceBillingEvent({
        stripeEventId: event.id,
        eventType: event.type,
        sourceEntityId: orgId,
        resultStatus: "success",
      });
    }

    await markEventProcessed(event.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markEventFailed(event.id, msg, true);
    throw err;
  }
}
