import type Stripe from "stripe";
import {
  isEventProcessed,
  markEventFailed,
  markEventProcessed,
  markEventProcessing,
} from "@/lib/billing/idempotency";
import { finalizeFromWebhook } from "@/lib/billing/finalization-service";
import type { StripeWebhookRuntime } from "./shared";

export async function handlePaymentIntentSucceeded(
  runtime: StripeWebhookRuntime,
  event: Stripe.Event,
) {
  if (await isEventProcessed(event.id)) {
    console.log(`[Stripe] Skipping already processed event ${event.id}`);
    return;
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
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

    await markEventProcessed(event.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markEventFailed(event.id, msg, true);
    throw err;
  }
}

