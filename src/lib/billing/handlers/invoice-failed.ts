/**
 * F4 — invoice.payment_failed handler
 *
 * Payment failure state sync. Nem készül Billingo számla.
 */

import type Stripe from "stripe";
import {
  isEventProcessed,
  markEventProcessing,
  markEventProcessed,
  markEventFailed,
} from "@/lib/billing/idempotency";
import type { StripeWebhookRuntime } from "./shared";
import { extractCustomerId, extractSubscriptionId, upsertSubscription } from "./shared";

export async function handleInvoicePaymentFailed(
  runtime: StripeWebhookRuntime,
  event: Stripe.Event,
) {
  if (await isEventProcessed(event.id)) {
    console.log(`[Stripe] Skipping already processed event ${event.id}`);
    return;
  }

  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = extractSubscriptionId(invoice.subscription);
  if (!subscriptionId) return;

  await markEventProcessing(event.id, event.type, invoice.id);

  try {
    const subscription = await runtime.stripe.subscriptions.retrieve(subscriptionId);
    const customerId =
      extractCustomerId(invoice.customer) ?? extractCustomerId(subscription.customer);
    if (!customerId) return;

    const orgId = subscription.metadata?.orgId;
    if (!orgId) return;

    // Sync subscription state (likely → past_due)
    await upsertSubscription(runtime, orgId, subscription, customerId);

    console.log(`[Stripe] Invoice payment failed for org ${orgId}: ${invoice.id}`);

    // TODO: dunning/reminder hook — értesítés az org admin-nak

    await markEventProcessed(event.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markEventFailed(event.id, msg, true);
    throw err;
  }
}
