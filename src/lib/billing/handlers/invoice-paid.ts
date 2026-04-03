/**
 * F2 — invoice.paid handler
 *
 * Recurring invoice fő számlázási triggere.
 * Subscription state sync + Billingo számla create.
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

export async function handleInvoicePaid(
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

    // Sync subscription state
    await upsertSubscription(runtime, orgId, subscription, customerId);

    // Update latest invoice ID
    await runtime.prisma.subscription.update({
      where: { orgId },
      data: { stripeLatestInvoiceId: invoice.id },
    });

    console.log(`[Stripe] Invoice paid synced for org ${orgId}: ${invoice.id}`);

    // TODO: Billingo recurring invoice creation (F2 step 3-5)
    // 1. resolvePartnerForSubscription()
    // 2. resolveVatDecision()
    // 3. buildSubscriptionInvoiceItem()
    // 4. createInvoiceDocument()
    // 5. Save BillingDocumentLink
    // 6. Update subscription.billingoLastDocumentId

    await markEventProcessed(event.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markEventFailed(event.id, msg, true);
    throw err;
  }
}
