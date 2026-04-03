/**
 * F2 — invoice.paid handler
 *
 * Recurring invoice fő számlázási triggere.
 * Subscription state sync + Billingo számla create.
 */

import type Stripe from "stripe";
import { traceBillingEvent } from "@/lib/billing/tracing";
import {
  isEventProcessed,
  markEventProcessing,
  markEventProcessed,
  markEventFailed,
} from "@/lib/billing/idempotency";
import { resolvePartner, resolvePartnerForPurchase } from "@/lib/billing/partner-resolver";
import { resolveVatDecision } from "@/lib/billing/vat-decision";
import { buildSubscriptionInvoiceItem } from "@/lib/billing/invoice-items";
import { normalizeInvoicePayload } from "@/lib/billing/invoice-normalizer";
import { createInvoiceDocument, BillingoApiError } from "@/lib/billing/billingo-client";
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
  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const subscriptionId = extractSubscriptionId(invoiceAny.subscription as string | undefined);
  if (!subscriptionId) return;

  await markEventProcessing(event.id, event.type, invoice.id);

  try {
    const subscription = await runtime.stripe.subscriptions.retrieve(subscriptionId);
    const customerId =
      extractCustomerId(invoice.customer) ?? extractCustomerId(subscription.customer);
    if (!customerId) return;

    const orgId = subscription.metadata?.orgId;
    if (!orgId) return;

    // Check if this is the first paid invoice (trial → active transition)
    const localSubBefore = await runtime.prisma.subscription.findUnique({
      where: { orgId },
      select: { status: true, stripeLatestInvoiceId: true },
    });
    const isFirstPaidInvoice = localSubBefore?.status === "trialing" || !localSubBefore?.stripeLatestInvoiceId;

    // Sync subscription state
    await upsertSubscription(runtime, orgId, subscription, customerId);

    // Update latest invoice ID
    await runtime.prisma.subscription.update({
      where: { orgId },
      data: { stripeLatestInvoiceId: invoice.id },
    });

    // Send order confirmation on first paid invoice (canonical payment trigger)
    if (isFirstPaidInvoice) {
      try {
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
      } catch (emailErr) {
        console.error("[Billing] Order confirmation email failed:", emailErr);
      }
    }

    // ── Billingo recurring invoice creation ─────────────────────────────
    // Check if document already exists for this invoice (idempotent)
    const existingDoc = await runtime.prisma.billingDocumentLink.findFirst({
      where: { stripeInvoiceId: invoice.id },
    });

    if (!existingDoc) {
      try {
        const localSub = await runtime.prisma.subscription.findUnique({
          where: { orgId },
          select: { planType: true, billingInterval: true },
        });
        const planType = localSub?.planType ?? "team";
        const interval = localSub?.billingInterval ?? "monthly";

        const partnerInput = await resolvePartnerForPurchase({
          productType: `${planType}_subscription`,
          userId: "", // org-level, userId not needed
          organizationId: orgId,
        });
        const partner = await resolvePartner(partnerInput);
        const vatDecision = resolveVatDecision({ countryCode: partnerInput.countryCode });
        const item = buildSubscriptionInvoiceItem(planType, interval, 1, vatDecision);
        const payload = normalizeInvoicePayload({
          partnerId: partner.billingoPartnerId,
          vatDecision,
          items: [item],
        });

        const doc = await createInvoiceDocument(payload);

        await runtime.prisma.billingDocumentLink.create({
          data: {
            sourceType: "subscription_invoice",
            sourceId: orgId,
            stripeInvoiceId: invoice.id,
            billingoDocumentId: String(doc.id),
            billingoDocumentNumber: doc.invoiceNumber,
            documentType: "invoice",
            status: "issued",
          },
        });

        await runtime.prisma.subscription.update({
          where: { orgId },
          data: { billingoLastDocumentId: String(doc.id) },
        });

        traceBillingEvent({
          stripeEventId: event.id,
          eventType: event.type,
          sourceEntityId: orgId,
          billingoDocumentId: doc.id,
          resultStatus: "success",
        });
      } catch (billingoErr) {
        // Billingo failure is non-blocking for subscription sync
        // but we log it for retry
        traceBillingEvent({
          stripeEventId: event.id,
          eventType: event.type,
          sourceEntityId: orgId,
          resultStatus: "failed",
          errorCode: billingoErr instanceof BillingoApiError
            ? `billingo_${billingoErr.statusCode}`
            : "billingo_unknown",
        });
        // Don't throw — subscription sync already succeeded
        console.error("[Billing] Billingo invoice creation failed for invoice.paid:", billingoErr);
      }
    } else {
      traceBillingEvent({
        stripeEventId: event.id,
        eventType: event.type,
        sourceEntityId: orgId,
        resultStatus: "skipped",
      });
    }

    await markEventProcessed(event.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markEventFailed(event.id, msg, true);
    throw err;
  }
}
