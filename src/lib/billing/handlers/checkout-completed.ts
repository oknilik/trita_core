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
import type { StripeWebhookRuntime } from "./shared";
import { extractCustomerId, extractSubscriptionId, upsertSubscription } from "./shared";

export async function handleCheckoutSessionCompleted(
  runtime: StripeWebhookRuntime,
  event: Stripe.Event,
) {
  const session = event.data.object as Stripe.Checkout.Session;
  const orgId = session.metadata?.orgId;

  // Idempotency check
  if (await isEventProcessed(event.id)) {
    console.log(`[Stripe] Skipping already processed event ${event.id}`);
    return;
  }
  await markEventProcessing(event.id, event.type, session.id);

  try {
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

  // TODO: Billingo invoice creation (E1 step 4-7)
  // 1. resolvePartnerForPurchase()
  // 2. resolveVatDecision()
  // 3. buildPurchaseInvoiceItem()
  // 4. createInvoiceDocument()
  // 5. Save BillingDocumentLink
  // 6. Update purchase.invoiceStatus = "issued"
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

  // TODO: Billingo invoice for candidate addon
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
