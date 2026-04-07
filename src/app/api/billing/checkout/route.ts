import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import { stripe, STRIPE_PRICES, TRIAL_DAYS, CANDIDATE_PACKAGES, type PriceKey, type CandidatePackageKey } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { getServerAuth } from "@/lib/auth-server";
import { buildCheckoutMetadata } from "@/lib/billing/stripe-metadata";

const schema = z.object({
  priceKey: z.enum([
    "team_monthly", "team_annual",
    "org_monthly", "org_annual",
    "candidate_1", "candidate_5", "candidate_10",
    "candidate_custom",
  ]),
  quantity: z.number().int().min(1).max(500).optional(),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

type CheckoutRuntime = {
  auth: typeof getServerAuth;
  prisma: typeof prisma;
  getActiveOrgMembership: typeof getActiveOrgMembership;
  stripe: typeof stripe;
  checkRateLimit: typeof checkRateLimit;
  appUrl: string;
};

const defaultCheckoutRuntime: CheckoutRuntime = {
  auth: getServerAuth,
  prisma,
  getActiveOrgMembership,
  stripe,
  checkRateLimit,
  appUrl: APP_URL,
};

function getCheckoutRuntime(): CheckoutRuntime {
  const overrides = (
    globalThis as {
      __TRITA_BILLING_CHECKOUT_RUNTIME__?: Partial<CheckoutRuntime>;
    }
  ).__TRITA_BILLING_CHECKOUT_RUNTIME__;
  return { ...defaultCheckoutRuntime, ...(overrides ?? {}) };
}

export async function POST(req: Request) {
  const runtime = getCheckoutRuntime();

  const { userId } = await runtime.auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await runtime.prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, locale: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rateLimitResponse = await runtime.checkRateLimit("billing", profile.id);
  if (rateLimitResponse) return rateLimitResponse;

  const membership = await runtime.getActiveOrgMembership(profile.id);
  if (!membership || membership.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const isCandidateAddon = body.data.priceKey.startsWith("candidate_");
  const isCustomAddon = body.data.priceKey === "candidate_custom";
  const priceId = isCandidateAddon ? null : STRIPE_PRICES[body.data.priceKey as PriceKey];

  const sub = await runtime.prisma.subscription.findUnique({
    where: { orgId: membership.orgId },
    select: { stripeCustomerId: true, status: true },
  });

  let customerId = sub?.stripeCustomerId ?? null;

  if (!customerId) {
    const org = await runtime.prisma.organization.findUnique({
      where: { id: membership.orgId },
      select: { name: true },
    });
    const customer = await runtime.stripe.customers.create({
      email: profile.email ?? undefined,
      name: org?.name,
      metadata: { orgId: membership.orgId, profileId: profile.id },
    });
    customerId = customer.id;
    await runtime.prisma.subscription.upsert({
      where: { orgId: membership.orgId },
      create: { orgId: membership.orgId, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });
  }

  const stripeLocale = profile.locale === "hu" ? "hu" : "en";

  if (isCandidateAddon) {
    let unitAmount: number;
    let credits: number;
    let label: string;

    if (isCustomAddon) {
      const qty = body.data.quantity ?? 1;
      const discountFactor = qty >= 10 ? 0.80 : qty >= 5 ? 0.85 : 1.0;
      unitAmount = Math.round(3900 * discountFactor) * qty;
      credits = qty;
      label = `${qty} × Jelölt kredit`;
    } else {
      const pkg = CANDIDATE_PACKAGES[body.data.priceKey as CandidatePackageKey];
      unitAmount = pkg.unitAmount;
      credits = pkg.credits;
      label = pkg.label;
    }

    const session = await runtime.stripe.checkout.sessions.create({
      customer: customerId,
      ui_mode: "embedded",
      mode: "payment",
      locale: stripeLocale,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: unitAmount,
            product_data: { name: label },
          },
          quantity: 1,
        },
      ],
      return_url: `${runtime.appUrl}/billing/return?session_id={CHECKOUT_SESSION_ID}&addon=candidate`,
      metadata: {
        // Legacy keys (backward compat with existing handler)
        orgId: membership.orgId,
        type: "candidate_addon",
        creditCount: String(credits),
        actorId: profile.id,
        // Unified metadata contract (B1)
        ...buildCheckoutMetadata({
          tritaUserId: profile.id,
          organizationId: membership.orgId,
          productType: "candidate_pack",
          candidatePackSize: String(credits),
          locale: stripeLocale,
          currency: "eur",
        }),
      },
    });
    return NextResponse.json({ clientSecret: session.client_secret });
  }

  // Only offer trial if org never had one before
  const existingSub = await runtime.prisma.subscription.findUnique({
    where: { orgId: membership.orgId },
    select: { trialEndsAt: true, stripeSubscriptionId: true },
  });
  const hadTrialBefore = !!existingSub?.trialEndsAt || !!existingSub?.stripeSubscriptionId;

  const session = await runtime.stripe.checkout.sessions.create({
    customer: customerId,
    ui_mode: "embedded",
    mode: "subscription",
    locale: stripeLocale,
    payment_method_types: ["card"],
    line_items: [{ price: priceId!, quantity: 1 }],
    subscription_data: {
      ...(hadTrialBefore ? {} : { trial_period_days: TRIAL_DAYS }),
      metadata: { orgId: membership.orgId },
    },
    return_url: `${runtime.appUrl}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      orgId: membership.orgId,
      ...buildCheckoutMetadata({
        tritaUserId: profile.id,
        organizationId: membership.orgId,
        productType: body.data.priceKey.startsWith("org") ? "org_subscription" : "team_subscription",
        billingInterval: body.data.priceKey.includes("annual") ? "annual" : "monthly",
        locale: stripeLocale,
        currency: "eur",
      }),
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ clientSecret: session.client_secret });
}
