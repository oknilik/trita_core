/**
 * G1 — Refund event handler
 *
 * charge.refunded → eredeti számla azonosítás → stornó/helyesbítő create.
 */

import type Stripe from "stripe";
import {
  isEventProcessed,
  markEventProcessing,
  markEventProcessed,
  markEventFailed,
} from "@/lib/billing/idempotency";
import { traceBillingEvent } from "@/lib/billing/tracing";
import { createCorrectionDocument } from "@/lib/billing/billingo-client";
import type { StripeWebhookRuntime } from "./shared";

export async function handleChargeRefunded(
  runtime: StripeWebhookRuntime,
  event: Stripe.Event,
) {
  if (await isEventProcessed(event.id)) {
    console.log(`[Stripe] Skipping already processed refund event ${event.id}`);
    return;
  }

  const charge = event.data.object as Stripe.Charge;
  await markEventProcessing(event.id, event.type, charge.id);

  try {
    // Find the original Billingo document via checkout session or payment intent
    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id ?? null;

    if (!paymentIntentId) {
      await markEventFailed(event.id, "No payment_intent on charge", false);
      return;
    }

    // Look up purchase by payment intent
    const purchase = await runtime.prisma.purchase.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      select: {
        id: true,
        billingoDocumentId: true,
        invoiceStatus: true,
      },
    });

    if (!purchase) {
      // Could be a subscription refund — check BillingDocumentLink
      const docLink = await runtime.prisma.billingDocumentLink.findFirst({
        where: {
          OR: [
            { stripeCheckoutSessionId: charge.metadata?.checkoutSessionId },
            { stripeInvoiceId: (charge as unknown as Record<string, unknown>).invoice ? String((charge as unknown as Record<string, unknown>).invoice) : undefined },
          ],
        },
        select: { id: true, billingoDocumentId: true, status: true },
      });

      if (docLink && docLink.status === "issued") {
        await createCorrectionAndLink(
          runtime,
          docLink.billingoDocumentId,
          "subscription_invoice",
          docLink.id,
          charge,
        );
      } else {
        console.log(`[Stripe] No Billingo document found for refund ${charge.id}`);
      }

      await markEventProcessed(event.id);
      return;
    }

    // Purchase refund path
    if (purchase.billingoDocumentId && purchase.invoiceStatus === "issued") {
      await createCorrectionAndLink(
        runtime,
        purchase.billingoDocumentId,
        "purchase",
        purchase.id,
        charge,
      );

      // Update purchase invoice status
      await runtime.prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          status: charge.amount_refunded === charge.amount ? "refunded" : "completed",
          invoiceStatus: "corrected",
        },
      });
    }

    await markEventProcessed(event.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markEventFailed(event.id, msg, true);
    throw err;
  }
}

async function createCorrectionAndLink(
  runtime: StripeWebhookRuntime,
  billingoDocumentId: string,
  sourceType: string,
  sourceId: string,
  charge: Stripe.Charge,
) {
  try {
    const correctionDoc = await createCorrectionDocument(Number(billingoDocumentId));

    await runtime.prisma.billingDocumentLink.create({
      data: {
        sourceType,
        sourceId,
        stripeInvoiceId: (charge as unknown as Record<string, unknown>).invoice ? String((charge as unknown as Record<string, unknown>).invoice) : null,
        billingoDocumentId: String(correctionDoc.id),
        billingoDocumentNumber: correctionDoc.invoiceNumber,
        documentType: "correction",
        status: "corrected",
      },
    });

    console.log(`[Stripe] Correction document created: ${correctionDoc.invoiceNumber} for ${sourceType} ${sourceId}`);
  } catch (err) {
    console.error(`[Stripe] Failed to create correction document for ${sourceType} ${sourceId}:`, err);
    throw err;
  }
}
