/**
 * POST /api/billing/create-payment
 *
 * Unified payment intent creation for Trita's custom checkout form.
 *
 * Modes:
 *   - One-time purchase (self_plus, team_snapshot, team_deep_dive)
 *     → Creates a PaymentIntent, returns clientSecret
 *   - Subscription (team_monthly, team_annual, org_monthly, org_annual)
 *     → Creates a Stripe Subscription with payment_behavior: "default_incomplete",
 *       returns clientSecret from the latest invoice's payment_intent
 *   - Candidate addon (candidate_1, candidate_5, candidate_10)
 *     or custom quantity
 *     → Creates a PaymentIntent with inline amount
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import {
  stripe,
  STRIPE_PRICES,
  TIER_CONFIG,
  CANDIDATE_PACKAGES,
  TRIAL_DAYS,
  type PriceKey,
} from "@/lib/stripe";
import { getServerAuth } from "@/lib/auth-server";
import { buildCheckoutMetadata } from "@/lib/billing/stripe-metadata";

const schema = z.object({
  // One-time purchase
  tier: z.enum(["self_plus", "team_snapshot", "team_deep_dive"]).optional(),
  teamId: z.string().optional(),
  // Subscription
  plan: z.enum(["team_monthly", "team_annual", "org_monthly", "org_annual"]).optional(),
  // Candidate addon
  candidatePack: z.enum(["candidate_1", "candidate_5", "candidate_10"]).optional(),
  candidateQuantity: z.number().int().min(1).max(50).optional(),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

export async function POST(req: Request) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, locale: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const { tier, teamId, plan, candidatePack, candidateQuantity } = body.data;
  const stripeLocale = profile.locale === "hu" ? "hu" : "en";

  // ── Resolve or create Stripe customer ──────────────────────────────────
  let customerId: string | null = null;
  const membership = await getActiveOrgMembership(profile.id);

  if (membership?.orgId) {
    const sub = await prisma.subscription.findUnique({
      where: { orgId: membership.orgId },
      select: { stripeCustomerId: true },
    });
    customerId = sub?.stripeCustomerId ?? null;
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email ?? undefined,
      metadata: { profileId: profile.id, orgId: membership?.orgId ?? "" },
    });
    customerId = customer.id;

    // Persist customer ID if org exists
    if (membership?.orgId) {
      await prisma.subscription.upsert({
        where: { orgId: membership.orgId },
        create: { orgId: membership.orgId, stripeCustomerId: customerId },
        update: { stripeCustomerId: customerId },
      });
    }
  }

  // ═══ 1. ONE-TIME PURCHASE ═══
  if (tier) {
    const config = TIER_CONFIG[tier];
    if (!config) return NextResponse.json({ error: "INVALID_TIER" }, { status: 400 });

    const amount = config.price * 100; // EUR cents

    // Team tier auth check
    if (tier !== "self_plus") {
      if (!teamId) return NextResponse.json({ error: "TEAM_ID_REQUIRED" }, { status: 400 });
      if (!membership || (membership.role !== "ORG_ADMIN" && membership.role !== "ORG_MANAGER")) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "one_time_purchase",
        tier,
        userProfileId: profile.id,
        orgId: membership?.orgId ?? "",
        teamId: teamId ?? "",
        ...buildCheckoutMetadata({
          tritaUserId: profile.id,
          organizationId: membership?.orgId,
          teamId: teamId ?? undefined,
          productType: tier,
          locale: stripeLocale,
          currency: "eur",
        }),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      mode: "payment",
      amount,
      currency: "eur",
      productName: config.name,
      returnUrl: `${APP_URL}/billing/success?payment_intent=${paymentIntent.id}`,
    });
  }

  // ═══ 2. SUBSCRIPTION ═══
  if (plan) {
    if (!membership || membership.role !== "ORG_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const priceId = STRIPE_PRICES[plan as PriceKey];
    if (!priceId) return NextResponse.json({ error: "PRICE_NOT_CONFIGURED" }, { status: 400 });

    try {
      // Only offer trial if org never had one before
      const existingSub = await prisma.subscription.findUnique({
        where: { orgId: membership.orgId },
        select: { trialEndsAt: true, stripeSubscriptionId: true },
      });
      const hadTrialBefore = !!existingSub?.trialEndsAt || !!existingSub?.stripeSubscriptionId;

      if (!hadTrialBefore) {
        // First time — create subscription with trial (no payment now)
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          trial_period_days: TRIAL_DAYS,
          metadata: { orgId: membership.orgId },
        });

        const planType = plan.startsWith("org") ? "org" : "team";
        const billingInterval = plan.includes("annual") ? "annual" : "monthly";

        await prisma.subscription.upsert({
          where: { orgId: membership.orgId },
          create: {
            orgId: membership.orgId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            planType,
            billingInterval,
            status: "trialing",
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
          },
          update: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            planType,
            billingInterval,
            status: "trialing",
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
          },
        });

        await prisma.organization.updateMany({
          where: { id: membership.orgId, status: "PENDING_SETUP" },
          data: { status: "ACTIVE" },
        });

        return NextResponse.json({
          clientSecret: null,
          mode: "trial",
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          returnUrl: `${APP_URL}/org/${membership.orgId}?tab=billing`,
        });
      }

      // Trial already used — collect payment via PaymentIntent
      // The subscription will be created after successful payment
      const stripePrice = await stripe.prices.retrieve(priceId);
      const amount = stripePrice.unit_amount ?? 0;

      const planType = plan.startsWith("org") ? "org" : "team";
      const billingInterval = plan.includes("annual") ? "annual" : "monthly";
      const planLabel = `${planType === "org" ? "Org" : "Team"} ${billingInterval === "annual" ? "(éves)" : "(havi)"}`;

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: (stripePrice.currency as string) ?? "eur",
        customer: customerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
          type: "subscription_activation",
          plan,
          priceId,
          orgId: membership.orgId,
          ...buildCheckoutMetadata({
            tritaUserId: profile.id,
            organizationId: membership.orgId,
            productType: plan.startsWith("org") ? "org_subscription" : "team_subscription",
            billingInterval,
            locale: stripeLocale,
            currency: "eur",
          }),
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        mode: "payment",
        amount,
        currency: "eur",
        productName: planLabel,
        returnUrl: `${APP_URL}/billing/return?payment_intent=${paymentIntent.id}&plan=${plan}`,
      });
    } catch (err) {
      console.error("[Billing/CreatePayment] Subscription creation failed:", err);
      return NextResponse.json({ error: "SUBSCRIPTION_FAILED" }, { status: 502 });
    }
  }

  // ═══ 3. CANDIDATE ADDON ═══
  if (candidatePack || candidateQuantity) {
    if (!membership || membership.role !== "ORG_ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const quantity = candidateQuantity ?? CANDIDATE_PACKAGES[candidatePack!].credits;
    const isPresetPack = !!candidatePack && !candidateQuantity;
    const amount = isPresetPack
      ? CANDIDATE_PACKAGES[candidatePack!].unitAmount
      : Math.round(3900 * (quantity >= 10 ? 0.8 : quantity >= 5 ? 0.85 : 1)) * quantity;
    const label = isPresetPack
      ? CANDIDATE_PACKAGES[candidatePack!].label
      : `${quantity}× jelölt értékelés`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "candidate_addon",
        orgId: membership.orgId,
        creditCount: String(quantity),
        actorId: profile.id,
        ...buildCheckoutMetadata({
          tritaUserId: profile.id,
          organizationId: membership.orgId,
          productType: "candidate_pack",
          candidatePackSize: String(quantity),
          locale: stripeLocale,
          currency: "eur",
        }),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      mode: "payment",
      amount,
      currency: "eur",
      productName: label,
      returnUrl: `${APP_URL}/billing/return?payment_intent=${paymentIntent.id}&addon=candidate`,
    });
  }

  return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
}
