import type { prisma as PrismaClientSingleton } from "@/lib/prisma";
import type { stripe as StripeClient } from "@/lib/stripe";
import { TIER_CONFIG } from "@/lib/stripe";

type PrismaClient = typeof PrismaClientSingleton;
type Stripe = typeof StripeClient;

export interface BillingFinalizationRuntime {
  stripe: Stripe;
  prisma: PrismaClient;
  addCredits: (input: {
    orgId: string;
    amount: number;
    actorId: string;
    note: string;
  }) => Promise<unknown>;
}

export interface FinalizePaymentIntentInput {
  paymentIntentId: string;
  plan?: string;
  addon?: string;
  actorProfileId?: string | null;
}

export interface PaymentIntentFinalizationResult {
  completed: boolean;
  candidateAddonApplied: boolean;
  oneTimePurchaseApplied: boolean;
  subscriptionActivationApplied: boolean;
}

async function finalizePaymentIntentInternal(
  source: "fallback" | "webhook",
  input: FinalizePaymentIntentInput,
  runtime: BillingFinalizationRuntime,
): Promise<PaymentIntentFinalizationResult> {
  const pi = await runtime.stripe.paymentIntents.retrieve(input.paymentIntentId);
  if (pi.status !== "succeeded") {
    return {
      completed: false,
      candidateAddonApplied: false,
      oneTimePurchaseApplied: false,
      subscriptionActivationApplied: false,
    };
  }

  if (pi.metadata?.type === "one_time_purchase") {
    const tier = pi.metadata.tier;
    const userProfileId = pi.metadata.userProfileId ?? input.actorProfileId;
    if (tier && userProfileId) {
      const existing = await runtime.prisma.purchase.findFirst({
        where: { stripePaymentIntentId: input.paymentIntentId },
      });

      if (!existing) {
        const config = TIER_CONFIG[tier];
        await runtime.prisma.purchase.create({
          data: {
            userProfileId,
            orgId: pi.metadata.orgId || null,
            teamId: pi.metadata.teamId || null,
            tier,
            productType: tier,
            stripePaymentIntentId: input.paymentIntentId,
            amount: pi.amount ?? 0,
            grossAmount: pi.amount ?? 0,
            currency: pi.currency ?? "eur",
            status: "completed",
            invoiceStatus: "pending",
            includesAdvisory: config?.includesAdvisory ?? false,
            includedCredits: config?.includedCredits ?? 0,
          },
        });
      }

      console.log(
        `[Billing/Finalization:${source}] One-time purchase finalized for user ${userProfileId} (${tier})`,
      );
      return {
        completed: true,
        candidateAddonApplied: false,
        oneTimePurchaseApplied: true,
        subscriptionActivationApplied: false,
      };
    }

    return {
      completed: false,
      candidateAddonApplied: false,
      oneTimePurchaseApplied: false,
      subscriptionActivationApplied: false,
    };
  }

  if (
    input.addon === "candidate" &&
    pi.metadata?.type === "candidate_addon" &&
    pi.metadata?.orgId
  ) {
    const orgId = pi.metadata.orgId;
    const creditCount = parseInt(pi.metadata.creditCount ?? "1", 10);
    const actorId = pi.metadata.actorId ?? input.actorProfileId ?? "system";
    const creditLabels: Record<number, string> = {
      1: "1× jelölt értékelés",
      5: "5× jelölt értékelés",
      10: "10× jelölt értékelés",
    };

    const alreadyProcessed = await runtime.prisma.candidateCredit.findFirst({
      where: { orgId, note: { contains: input.paymentIntentId } },
      select: { id: true },
    });

    if (!alreadyProcessed) {
      const label = creditLabels[creditCount] ?? `${creditCount}× jelölt értékelés`;
      await runtime.addCredits({
        orgId,
        amount: creditCount,
        actorId,
        note: `${label} [${input.paymentIntentId}]`,
      });
    }

    console.log(`[Billing/Finalization:${source}] Candidate addon finalized for org ${orgId}`);
    return {
      completed: true,
      candidateAddonApplied: true,
      oneTimePurchaseApplied: false,
      subscriptionActivationApplied: false,
    };
  }

  const planKey = input.plan ?? pi.metadata?.plan;
  if (
    planKey &&
    pi.metadata?.type === "subscription_activation" &&
    pi.metadata?.orgId
  ) {
    const orgId = pi.metadata.orgId;
    const priceId = pi.metadata.priceId;
    const planType = planKey.startsWith("org") ? "org" : "team";
    const billingInterval = planKey.includes("annual") ? "annual" : "monthly";

    const existingSub = await runtime.prisma.subscription.findUnique({
      where: { orgId },
      select: { stripeSubscriptionId: true, status: true },
    });

    const existingStatus = (existingSub?.status ?? "").toLowerCase();
    const hasReusableSubscription =
      !!existingSub?.stripeSubscriptionId &&
      (existingStatus === "active" ||
        existingStatus === "trialing" ||
        existingStatus === "past_due" ||
        existingStatus === "unpaid");
    if (hasReusableSubscription) {
      return {
        completed: true,
        candidateAddonApplied: false,
        oneTimePurchaseApplied: false,
        subscriptionActivationApplied: true,
      };
    }

    const customerId = typeof pi.customer === "string" ? pi.customer : null;
    if (!customerId || !priceId) {
      console.warn(
        `[Billing/Finalization:${source}] Missing customer/price for subscription activation`,
        {
          orgId,
          hasCustomer: Boolean(customerId),
          hasPriceId: Boolean(priceId),
          paymentIntentId: input.paymentIntentId,
        },
      );
      return {
        completed: false,
        candidateAddonApplied: false,
        oneTimePurchaseApplied: false,
        subscriptionActivationApplied: false,
      };
    }

    const paymentMethodId =
      typeof pi.payment_method === "string" ? pi.payment_method : null;
    if (paymentMethodId) {
      try {
        await runtime.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });
      } catch (attachError) {
        const message = attachError instanceof Error ? attachError.message : String(attachError);
        // Safe no-op if already attached to the same customer.
        if (!message.toLowerCase().includes("already")) {
          throw attachError;
        }
      }
    }

    const stripeSub = await runtime.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId ?? undefined,
      metadata: { orgId },
    });

    const periodStart = stripeSub.items.data[0]?.current_period_start;
    const periodEnd = stripeSub.items.data[0]?.current_period_end;

    await runtime.prisma.subscription.upsert({
      where: { orgId },
      create: {
        orgId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSub.id,
        stripePriceId: priceId,
        planType,
        billingInterval,
        status: stripeSub.status,
        currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      },
      update: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSub.id,
        stripePriceId: priceId,
        planType,
        billingInterval,
        status: stripeSub.status,
        trialEndsAt: null,
        currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      },
    });

    await runtime.prisma.organization.updateMany({
      where: { id: orgId, status: "PENDING_SETUP" },
      data: { status: "ACTIVE" },
    });

    console.log(
      `[Billing/Finalization:${source}] Subscription activated for org ${orgId}: ${stripeSub.id}`,
    );

    return {
      completed: true,
      candidateAddonApplied: false,
      oneTimePurchaseApplied: false,
      subscriptionActivationApplied: true,
    };
  }

  return {
    completed: false,
    candidateAddonApplied: false,
    oneTimePurchaseApplied: false,
    subscriptionActivationApplied: false,
  };
}

export async function finalizeFromFallback(
  input: FinalizePaymentIntentInput,
  runtime: BillingFinalizationRuntime,
): Promise<PaymentIntentFinalizationResult> {
  return finalizePaymentIntentInternal("fallback", input, runtime);
}

export async function finalizeFromWebhook(
  input: FinalizePaymentIntentInput,
  runtime: BillingFinalizationRuntime,
): Promise<PaymentIntentFinalizationResult> {
  return finalizePaymentIntentInternal("webhook", input, runtime);
}
