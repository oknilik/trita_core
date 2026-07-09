/**
 * D1 — Stripe webhook route (dispatch layer)
 *
 * Signature verification → event parsing → handler dispatch.
 * Domain logic lives in src/lib/billing/handlers/*.
 */

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/emails";
import { addCredits } from "@/lib/candidate-credits";
import type { StripeWebhookRuntime } from "@/lib/billing/handlers/shared";
import { handleCheckoutSessionCompleted } from "@/lib/billing/handlers/checkout-completed";
import { handleSubscriptionEvent } from "@/lib/billing/handlers/subscription-sync";
import { handleInvoicePaid } from "@/lib/billing/handlers/invoice-paid";
import { handleInvoicePaymentFailed } from "@/lib/billing/handlers/invoice-failed";
import { handleChargeRefunded } from "@/lib/billing/handlers/refund";
import { handlePaymentIntentSucceeded } from "@/lib/billing/handlers/payment-intent-succeeded";

export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const defaultRuntime: StripeWebhookRuntime = {
  stripe,
  prisma,
  sendOrderConfirmationEmail,
  addCredits,
};

function getRuntime(): StripeWebhookRuntime {
  const overrides = (
    globalThis as {
      __TRITA_STRIPE_WEBHOOK_RUNTIME__?: Partial<StripeWebhookRuntime>;
    }
  ).__TRITA_STRIPE_WEBHOOK_RUNTIME__;
  return { ...defaultRuntime, ...(overrides ?? {}) };
}

export async function POST(req: Request) {
  const runtime = getRuntime();
  const webhookSecret = WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe webhook] STRIPE_WEBHOOK_SECRET is not configured!");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = runtime.stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe webhook] Signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(runtime, event);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(runtime, event);
        break;

      case "invoice.paid":
        await handleInvoicePaid(runtime, event);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(runtime, event);
        break;

      case "charge.refunded":
        await handleChargeRefunded(runtime, event);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(runtime, event);
        break;

      default:
        // Unhandled event types are silently acknowledged
        break;
    }
  } catch (err) {
    console.error("[Stripe webhook] Handler error:", err);
    return new NextResponse("Internal error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
