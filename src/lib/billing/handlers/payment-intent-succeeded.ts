import type Stripe from "stripe";
import {
  isEventProcessed,
  markEventFailed,
  markEventProcessed,
  markEventProcessing,
} from "@/lib/billing/idempotency";
import { traceBillingEvent } from "@/lib/billing/tracing";
import { finalizeFromWebhook } from "@/lib/billing/finalization-service";
import type { StripeWebhookRuntime } from "./shared";

export async function handlePaymentIntentSucceeded(
  runtime: StripeWebhookRuntime,
  event: Stripe.Event,
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const productType = paymentIntent.metadata?.type ?? paymentIntent.metadata?.plan;
  const traceBase = {
    entryPoint: "webhook.payment_intent_succeeded",
    stripeObjectType: "payment_intent",
    finalizationPath: "webhook" as const,
    idempotencyKey: event.id,
    stripeEventId: event.id,
    eventType: event.type,
    productType,
    sourceEntityId: paymentIntent.metadata?.orgId ?? paymentIntent.id,
  };

  if (await isEventProcessed(event.id)) {
    traceBillingEvent({
      ...traceBase,
      outcome: "skipped",
      resultStatus: "skipped",
      errorCode: "already_processed",
    });
    console.log(`[Stripe] Skipping already processed event ${event.id}`);
    return;
  }

  traceBillingEvent({
    ...traceBase,
    outcome: "processing",
    resultStatus: "processing",
  });
  await markEventProcessing(event.id, event.type, paymentIntent.id);

  try {
    const finalization = await finalizeFromWebhook(
      {
        paymentIntentId: paymentIntent.id,
        plan: paymentIntent.metadata?.plan,
        addon: paymentIntent.metadata?.type === "candidate_addon" ? "candidate" : undefined,
        actorProfileId:
          paymentIntent.metadata?.userProfileId ??
          paymentIntent.metadata?.actorId ??
          null,
      },
      {
        stripe: runtime.stripe,
        prisma: runtime.prisma,
        addCredits: runtime.addCredits,
      },
    );

    if (finalization.completed) {
      console.log(
        `[Stripe] payment_intent.succeeded finalized (${paymentIntent.id})`,
        {
          oneTime: finalization.oneTimePurchaseApplied,
          subscriptionActivation: finalization.subscriptionActivationApplied,
          candidateAddon: finalization.candidateAddonApplied,
        },
      );
    }
    traceBillingEvent({
      ...traceBase,
      outcome: finalization.completed ? "success" : "skipped",
      resultStatus: finalization.completed ? "success" : "skipped",
      finalizationPath: finalization.completed ? "webhook" : "none",
      errorCode: finalization.completed ? undefined : "no_finalization_match",
    });

    await markEventProcessed(event.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    traceBillingEvent({
      ...traceBase,
      outcome: "failed",
      resultStatus: "failed",
      errorCode: msg.slice(0, 100),
    });
    await markEventFailed(event.id, msg, true);
    throw err;
  }
}
