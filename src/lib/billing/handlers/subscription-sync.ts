/**
 * F1 + F5 + F6 — Subscription lifecycle handlers
 *
 * customer.subscription.created / updated / deleted
 */

import type Stripe from "stripe";
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

    // F5: Handle trialing → active transition (send order confirmation)
    if (event.type === "customer.subscription.updated") {
      const previousStatus =
        event.data.previous_attributes &&
        "status" in event.data.previous_attributes
          ? String(event.data.previous_attributes.status)
          : null;

      if (previousStatus === "trialing" && subscription.status === "active") {
        // Guard: only send once (check local status wasn't already active)
        const localSub = await runtime.prisma.subscription.findUnique({
          where: { orgId },
          select: { status: true },
        });

        if (localSub?.status !== "active") {
          const org = await runtime.prisma.organization.findUnique({
            where: { id: orgId },
            select: { name: true, owner: { select: { email: true } } },
          });
          if (org?.owner?.email) {
            await runtime.sendOrderConfirmationEmail({
              to: org.owner.email,
              name: org.name,
            });
          }
        }
      }
    }

    // F6: subscription deleted
    if (event.type === "customer.subscription.deleted") {
      console.log(`[Stripe] Subscription canceled for org ${orgId}`);
    }

    await markEventProcessed(event.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markEventFailed(event.id, msg, true);
    throw err;
  }
}
