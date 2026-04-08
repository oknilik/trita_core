import type { prisma as PrismaClientSingleton } from "@/lib/prisma";
import type { stripe as StripeClient } from "@/lib/stripe";

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
}

async function finalizePaymentIntentInternal(
  source: "fallback" | "webhook",
  input: FinalizePaymentIntentInput,
  runtime: BillingFinalizationRuntime,
): Promise<PaymentIntentFinalizationResult> {
  const pi = await runtime.stripe.paymentIntents.retrieve(input.paymentIntentId);
  if (pi.status !== "succeeded") {
    return { completed: false, candidateAddonApplied: false };
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
    return { completed: true, candidateAddonApplied: true };
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
      select: { stripeSubscriptionId: true },
    });

    if (!existingSub?.stripeSubscriptionId) {
      const customerId = typeof pi.customer === "string" ? pi.customer : null;
      if (customerId && priceId) {
        const stripeSub = await runtime.stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          default_payment_method:
            typeof pi.payment_method === "string" ? pi.payment_method : undefined,
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
      }
    }

    return { completed: true, candidateAddonApplied: false };
  }

  return { completed: false, candidateAddonApplied: false };
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

