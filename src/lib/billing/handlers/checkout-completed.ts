/**
 * E1 — checkout.session.completed handler
 *
 * Handles one-time purchases, candidate addon credits, and subscription checkout.
 * Billingo invoice creation for one-time purchases.
 */

import type Stripe from "stripe";
import { TIER_CONFIG } from "@/lib/stripe";
import {
  isEventProcessed,
  markEventProcessing,
  markEventProcessed,
  markEventFailed,
} from "@/lib/billing/idempotency";
import { withBillingTrace } from "@/lib/billing/tracing";
import { resolvePartner, resolvePartnerForPurchase } from "@/lib/billing/partner-resolver";
import { resolveVatDecision } from "@/lib/billing/vat-decision";
import { buildPurchaseInvoiceItem } from "@/lib/billing/invoice-items";
import { normalizeInvoicePayload } from "@/lib/billing/invoice-normalizer";
import { createInvoiceDocument, BillingoApiError } from "@/lib/billing/billingo-client";
import type { StripeWebhookRuntime } from "./shared";
import { extractCustomerId, extractSubscriptionId, upsertSubscription } from "./shared";

export async function handleCheckoutSessionCompleted(
  runtime: StripeWebhookRuntime,
  event: Stripe.Event,
) {
  const session = event.data.object as Stripe.Checkout.Session;
  const orgId = session.metadata?.orgId;
  const productType = session.metadata?.product_type ?? session.metadata?.type ?? "unknown";

  // Idempotency check
  if (await isEventProcessed(event.id)) {
    console.log(`[Stripe] Skipping already processed event ${event.id}`);
    return;
  }
  await markEventProcessing(event.id, event.type, session.id);

  try {
    return withBillingTrace(
      { stripeEventId: event.id, eventType: event.type, productType, sourceEntityId: orgId ?? undefined },
      async () => {
    if (!orgId) {
      await markEventFailed(event.id, "Missing orgId in metadata", false);
      return;
    }

    // ── One-time purchase ──────────────────────────────────────────────
    if (session.mode === "payment" && session.metadata?.type === "one_time_purchase") {
      await handleOneTimePurchase(runtime, session, event.id);
      await markEventProcessed(event.id);
      return;
    }

    // ── Candidate addon ────────────────────────────────────────────────
    if (session.mode === "payment" && session.metadata?.type === "candidate_addon") {
      await handleCandidateAddon(runtime, session, orgId, event.id);
      await markEventProcessed(event.id);
      return;
    }

    // ── Subscription checkout ──────────────────────────────────────────
    if (session.mode === "subscription") {
      await handleSubscriptionCheckout(runtime, session, event.id);
      await markEventProcessed(event.id);
      return;
    }

    await markEventProcessed(event.id);
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markEventFailed(event.id, msg, true);
    throw err;
  }
}

async function handleOneTimePurchase(
  runtime: StripeWebhookRuntime,
  session: Stripe.Checkout.Session,
  _eventId: string,
) {
  const tier = session.metadata?.tier;
  const userProfileId = session.metadata?.userProfileId;
  const orgId = session.metadata?.orgId || null;
  const teamId = session.metadata?.teamId || null;

  if (!tier || !userProfileId) {
    console.error("[Stripe] Missing metadata in one_time_purchase session", session.id);
    return;
  }

  // Duplicate protection
  const existing = await runtime.prisma.purchase.findFirst({
    where: { stripeCheckoutSessionId: session.id },
  });
  if (existing) {
    console.log(`[Stripe] Skipping duplicate purchase for session ${session.id}`);
    return;
  }

  const config = TIER_CONFIG[tier];

  await runtime.prisma.purchase.create({
    data: {
      userProfileId,
      orgId: orgId || null,
      teamId: teamId || null,
      tier,
      productType: tier,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as { id: string } | null)?.id ?? null,
      stripeCheckoutSessionId: session.id,
      amount: session.amount_total ?? 0,
      grossAmount: session.amount_total ?? 0,
      currency: session.currency ?? "eur",
      status: "completed",
      invoiceStatus: "pending",
      includesAdvisory: config?.includesAdvisory ?? false,
      includedCredits: config?.includedCredits ?? 0,
    },
  });

  console.log(`[Stripe] Purchase created: ${tier} for profile ${userProfileId}`);

  // Notify buyer via orchestrator
  const { handlePurchaseConfirmed } = await import("@/lib/notifications");
  handlePurchaseConfirmed({
    userId: userProfileId,
  }).catch((err) => console.error("[Notification] Purchase confirmed error:", err));

  // ── Billingo invoice creation ──────────────────────────────────────────
  const purchase = await runtime.prisma.purchase.findFirst({
    where: { stripeCheckoutSessionId: session.id },
    select: { id: true },
  });

  if (purchase) {
    try {
      const partnerInput = await resolvePartnerForPurchase({
        productType: tier,
        userId: userProfileId,
        organizationId: orgId,
      });
      const partner = await resolvePartner(partnerInput);
      const vatDecision = resolveVatDecision({ countryCode: partnerInput.countryCode });
      const item = buildPurchaseInvoiceItem(tier, 1, vatDecision);
      const payload = normalizeInvoicePayload({
        partnerId: partner.billingoPartnerId,
        vatDecision,
        items: [item],
      });

      const doc = await createInvoiceDocument(payload);

      await runtime.prisma.billingDocumentLink.create({
        data: {
          sourceType: "purchase",
          sourceId: purchase.id,
          stripeCheckoutSessionId: session.id,
          billingoDocumentId: String(doc.id),
          billingoDocumentNumber: doc.invoiceNumber,
          documentType: "invoice",
          status: "issued",
        },
      });

      await runtime.prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          billingoDocumentId: String(doc.id),
          billingoDocumentNumber: doc.invoiceNumber,
          invoiceStatus: "issued",
        },
      });
    } catch (billingoErr) {
      console.error("[Billing] Billingo invoice creation failed for purchase:", billingoErr);
      await runtime.prisma.purchase.update({
        where: { id: purchase.id },
        data: { invoiceStatus: "failed" },
      });
      // Non-blocking: purchase is already created, invoice retry possible
    }
  }
}

async function handleCandidateAddon(
  runtime: StripeWebhookRuntime,
  session: Stripe.Checkout.Session,
  orgId: string,
  _eventId: string,
) {
  const creditCount = parseInt(session.metadata?.creditCount ?? "1", 10);
  const actorId = session.metadata?.actorId ?? "system";
  const creditLabels: Record<number, string> = {
    1: "1× jelölt értékelés",
    5: "5× jelölt értékelés csomag",
    10: "10× jelölt értékelés csomag",
  };
  const label = creditLabels[creditCount] ?? `${creditCount}× jelölt értékelés`;

  // Idempotency: check by session ID in note
  const alreadyProcessed = await runtime.prisma.candidateCredit.findFirst({
    where: { orgId, note: { contains: session.id } },
    select: { id: true },
  });
  if (alreadyProcessed) {
    console.log(`[Stripe] Skipping duplicate credit for session ${session.id}`);
    return;
  }

  await runtime.addCredits({
    orgId,
    amount: creditCount,
    actorId,
    note: `${label} [${session.id}]`,
  });

  console.log(`[Stripe] +${creditCount} candidate credits for org ${orgId}`);

  // ── Billingo invoice for candidate addon ─────────────────────────────
  try {
    const packKey = creditCount >= 10 ? "candidate_pack_10" : creditCount >= 5 ? "candidate_pack_5" : "candidate_pack_1";
    const partnerInput = await resolvePartnerForPurchase({
      productType: "candidate_pack",
      userId: actorId,
      organizationId: orgId,
    });
    const partner = await resolvePartner(partnerInput);
    const vatDecision = resolveVatDecision({ countryCode: partnerInput.countryCode });
    const item = buildPurchaseInvoiceItem(packKey, 1, vatDecision);
    const payload = normalizeInvoicePayload({
      partnerId: partner.billingoPartnerId,
      vatDecision,
      items: [item],
    });

    const doc = await createInvoiceDocument(payload);

    await runtime.prisma.billingDocumentLink.create({
      data: {
        sourceType: "candidate_addon",
        sourceId: orgId,
        stripeCheckoutSessionId: session.id,
        billingoDocumentId: String(doc.id),
        billingoDocumentNumber: doc.invoiceNumber,
        documentType: "invoice",
        status: "issued",
      },
    });
  } catch (billingoErr) {
    console.error("[Billing] Billingo invoice creation failed for candidate addon:", billingoErr);
  }
}

async function handleSubscriptionCheckout(
  runtime: StripeWebhookRuntime,
  session: Stripe.Checkout.Session,
  _eventId: string,
) {
  const subscriptionId = extractSubscriptionId(session.subscription);
  const customerId = extractCustomerId(session.customer);
  if (!subscriptionId || !customerId) return;

  const subscription = await runtime.stripe.subscriptions.retrieve(subscriptionId);
  const orgId = subscription.metadata?.orgId ?? session.metadata?.orgId;
  if (!orgId) return;

  await upsertSubscription(runtime, orgId, subscription, customerId);

  // Activate org if it was in PENDING_SETUP
  await runtime.prisma.organization.updateMany({
    where: { id: orgId, status: "PENDING_SETUP" },
    data: { status: "ACTIVE" },
  });

  console.log(`[Stripe] Checkout complete for org ${orgId}`);
}
