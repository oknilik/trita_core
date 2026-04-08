import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/candidate-credits";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";
import { resolveBillingReturnResolution } from "@/lib/billing/return-resolution";
import { getServerAuth } from "@/lib/auth-server";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return { title: t("billing.returnMetaTitle", locale), robots: { index: false } };
}

type BillingReturnRuntime = {
  stripe: typeof stripe;
  auth: typeof getServerAuth;
  prisma: typeof prisma;
  addCredits: typeof addCredits;
  resolveJourneyFallbackForProfileId: typeof resolveJourneyFallbackForProfileId;
  redirect: typeof redirect;
  getServerLocale: typeof getServerLocale;
};

const defaultBillingReturnRuntime: BillingReturnRuntime = {
  stripe,
  auth: getServerAuth,
  prisma,
  addCredits,
  resolveJourneyFallbackForProfileId,
  redirect,
  getServerLocale,
};

function getBillingReturnRuntime(): BillingReturnRuntime {
  const overrides = (
    globalThis as {
      __TRITA_BILLING_RETURN_RUNTIME__?: Partial<BillingReturnRuntime>;
    }
  ).__TRITA_BILLING_RETURN_RUNTIME__;
  return { ...defaultBillingReturnRuntime, ...(overrides ?? {}) };
}

export default async function ReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; addon?: string; payment_intent?: string; plan?: string }>;
}) {
  const runtime = getBillingReturnRuntime();
  const [locale, params, { userId }] = await Promise.all([
    runtime.getServerLocale(),
    searchParams,
    runtime.auth(),
  ]);

  let handoffDestination = JOURNEY_HOME_HANDOFF_PATH;
  let activeProfileId: string | null = null;

  if (userId) {
    const activeProfile = await runtime.prisma.userProfile.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    if (activeProfile) {
      activeProfileId = activeProfile.id;
      handoffDestination = await runtime.resolveJourneyFallbackForProfileId(activeProfile.id);
    }
  }

  if (!params.session_id && !params.payment_intent) {
    runtime.redirect(handoffDestination);
  }

  let resolution: Awaited<ReturnType<typeof resolveBillingReturnResolution>> | null = null;
  if (params.session_id) {
    resolution = await resolveBillingReturnResolution(
      {
        sessionId: params.session_id,
        addon: params.addon,
        userId,
      },
      {
        findProfileByClerkId: async (clerkId) =>
          runtime.prisma.userProfile.findUnique({
            where: { clerkId },
            select: { id: true },
          }),
        resolveJourneyFallbackForProfileId: runtime.resolveJourneyFallbackForProfileId,
        retrieveSession: async (sessionId) => {
          const session = await runtime.stripe.checkout.sessions.retrieve(sessionId);
          return {
            status: session.status ?? "expired",
            mode: session.mode,
            metadata: session.metadata ?? undefined,
          };
        },
        findCandidateCreditBySession: async (orgId, sessionId) =>
          runtime.prisma.candidateCredit.findFirst({
            where: { orgId, note: { contains: sessionId } },
            select: { id: true },
          }),
        addCredits: async (input) => {
          await runtime.addCredits(input);
        },
      },
    );
  }

  if (resolution?.kind === "redirect") {
    runtime.redirect(resolution.destination);
  }

  // ── Idempotent subscription sync (fallback if webhook hasn't arrived) ──
  if (resolution?.kind === "complete" && params.session_id && !params.addon) {
    try {
      const fullSession = await runtime.stripe.checkout.sessions.retrieve(params.session_id);
      if (
        fullSession.mode === "subscription" &&
        fullSession.status === "complete" &&
        typeof fullSession.subscription === "string" &&
        fullSession.metadata?.orgId
      ) {
        const orgId = fullSession.metadata.orgId;
        const existingSub = await runtime.prisma.subscription.findUnique({
          where: { orgId },
          select: { stripeSubscriptionId: true, status: true },
        });

        // Sync if no subscription or if it's still in a stale state
        const needsSync =
          !existingSub?.stripeSubscriptionId ||
          existingSub.stripeSubscriptionId !== fullSession.subscription;

        if (needsSync) {
          const stripeSub = await runtime.stripe.subscriptions.retrieve(
            fullSession.subscription,
          );
          const customerId =
            typeof fullSession.customer === "string"
              ? fullSession.customer
              : fullSession.customer?.id ?? null;
          const periodStart = stripeSub.items.data[0]?.current_period_start;
          const periodEnd = stripeSub.items.data[0]?.current_period_end;
          const priceId = stripeSub.items.data[0]?.price.id ?? null;

          // Derive plan type and interval from unified metadata (B1 contract)
          const productType = fullSession.metadata?.product_type ?? "";
          const planType = productType.startsWith("org") ? "org" : "team";
          const billingInterval = fullSession.metadata?.billing_interval ?? "monthly";

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
              trialEndsAt: stripeSub.trial_end
                ? new Date(stripeSub.trial_end * 1000)
                : null,
              currentPeriodStart: periodStart
                ? new Date(periodStart * 1000)
                : null,
              currentPeriodEnd: periodEnd
                ? new Date(periodEnd * 1000)
                : null,
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            },
            update: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: stripeSub.id,
              stripePriceId: priceId,
              planType,
              billingInterval,
              status: stripeSub.status,
              trialEndsAt: stripeSub.trial_end
                ? new Date(stripeSub.trial_end * 1000)
                : null,
              currentPeriodStart: periodStart
                ? new Date(periodStart * 1000)
                : null,
              currentPeriodEnd: periodEnd
                ? new Date(periodEnd * 1000)
                : null,
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            },
          });

          // Activate org if pending
          await runtime.prisma.organization.updateMany({
            where: { id: orgId, status: "PENDING_SETUP" },
            data: { status: "ACTIVE" },
          });

          console.log(
            `[Billing/Return] Subscription synced for org ${orgId}: ${stripeSub.status}`,
          );
        }
      }
    } catch (syncErr) {
      // Non-blocking — if sync fails, webhook will handle it eventually
      console.error("[Billing/Return] Subscription sync fallback failed:", syncErr);
    }
  }

  let paymentIntentCompleted = false;
  let paymentIntentCandidateAddonApplied = false;

  // ── PaymentIntent fallback finalization (for webhook delays/outages) ──
  if (params.payment_intent) {
    try {
      const pi = await runtime.stripe.paymentIntents.retrieve(params.payment_intent);

      if (
        params.addon === "candidate" &&
        pi.status === "succeeded" &&
        pi.metadata?.type === "candidate_addon" &&
        pi.metadata?.orgId
      ) {
        const orgId = pi.metadata.orgId;
        const creditCount = parseInt(pi.metadata.creditCount ?? "1", 10);
        const actorId = pi.metadata.actorId ?? activeProfileId ?? "system";
        const creditLabels: Record<number, string> = {
          1: "1× jelölt értékelés",
          5: "5× jelölt értékelés",
          10: "10× jelölt értékelés",
        };

        const alreadyProcessed = await runtime.prisma.candidateCredit.findFirst({
          where: { orgId, note: { contains: params.payment_intent } },
          select: { id: true },
        });

        if (!alreadyProcessed) {
          const label = creditLabels[creditCount] ?? `${creditCount}× jelölt értékelés`;
          await runtime.addCredits({
            orgId,
            amount: creditCount,
            actorId,
            note: `${label} [${params.payment_intent}]`,
          });
        }

        paymentIntentCompleted = true;
        paymentIntentCandidateAddonApplied = true;
      }

      if (
        params.plan &&
        pi.status === "succeeded" &&
        pi.metadata?.orgId &&
        pi.metadata?.type === "subscription_activation"
      ) {
        const orgId = pi.metadata.orgId;
        const planKey = params.plan;
        const priceId = pi.metadata.priceId;
        const planType = planKey.startsWith("org") ? "org" : "team";
        const billingInterval = planKey.includes("annual") ? "annual" : "monthly";

        // Create the actual Stripe subscription (payment already collected)
        if (activeProfileId) {
          const existingSub = await runtime.prisma.subscription.findUnique({
            where: { orgId },
            select: { stripeSubscriptionId: true },
          });

          // Only create if not already activated
          if (!existingSub?.stripeSubscriptionId) {
            const customerId = typeof pi.customer === "string" ? pi.customer : null;
            if (customerId && priceId) {
              const stripeSub = await runtime.stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                default_payment_method: typeof pi.payment_method === "string" ? pi.payment_method : undefined,
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

              console.log(`[Billing/Return] Subscription activated for org ${orgId}: ${stripeSub.id}`);
            }
          }
        }

        paymentIntentCompleted = true;
      }
    } catch (activationErr) {
      console.error("[Billing/Return] Subscription activation failed:", activationErr);
    }
  }

  const completedViaPaymentIntent = paymentIntentCompleted;
  if (resolution?.kind === "complete" || completedViaPaymentIntent) {
    const candidateAddonApplied = resolution?.kind === "complete"
      ? resolution.candidateAddonApplied
      : paymentIntentCandidateAddonApplied;
    const destination = resolution?.kind === "complete"
      ? resolution.handoffDestination
      : handoffDestination;

    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(26,92,58,0.08)]">
            <span className="text-3xl text-sage">✓</span>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-2">
            {"// "}
            {t("billing.returnSuccessEyebrow", locale)}
          </p>
          <h1 className="font-fraunces text-2xl text-ink mb-3">
            {t("billing.returnSuccessTitle", locale)}
          </h1>
          <p className="text-sm text-ink-warm mb-6">
            {candidateAddonApplied
              ? t("billing.returnCandidateBody", locale)
              : t("billing.returnSubBody", locale)}
          </p>
          <Link
            href={destination}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-6 text-sm font-semibold text-white hover:bg-sage-dark transition"
          >
            {t("billing.returnSubCta", locale)}
          </Link>
        </div>
      </div>
    );
  }

  // Expired or unknown state
  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center">
      <div className="max-w-md text-center px-6">
        <h1 className="font-fraunces text-2xl text-ink mb-3">
          {t("billing.returnExpiredTitle", locale)}
        </h1>
        <p className="text-sm text-ink-warm mb-6">
          {t("billing.returnExpiredBody", locale)}
        </p>
        <Link
          href="/billing/checkout"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-6 text-sm font-semibold text-white hover:bg-sage-dark transition"
        >
          {t("billing.returnExpiredCta", locale)}
        </Link>
      </div>
    </div>
  );
}
