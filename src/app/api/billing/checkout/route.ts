import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICES, TRIAL_DAYS, CANDIDATE_PACKAGES, type PriceKey, type CandidatePackageKey } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";

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

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, locale: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rateLimitResponse = await checkRateLimit("billing", profile.id);
  if (rateLimitResponse) return rateLimitResponse;

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: { role: true, orgId: true },
  });
  if (!membership || membership.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const isCandidateAddon = body.data.priceKey.startsWith("candidate_");
  const isCustomAddon = body.data.priceKey === "candidate_custom";
  const priceId = isCandidateAddon ? null : STRIPE_PRICES[body.data.priceKey as PriceKey];

  let sub = await prisma.subscription.findUnique({
    where: { orgId: membership.orgId },
    select: { stripeCustomerId: true, status: true },
  });

  let customerId = sub?.stripeCustomerId ?? null;

  if (!customerId) {
    const org = await prisma.organization.findUnique({
      where: { id: membership.orgId },
      select: { name: true },
    });
    const customer = await stripe.customers.create({
      email: profile.email ?? undefined,
      name: org?.name,
      metadata: { orgId: membership.orgId, profileId: profile.id },
    });
    customerId = customer.id;
    await prisma.subscription.upsert({
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

    const session = await stripe.checkout.sessions.create({
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
      return_url: `${APP_URL}/billing/return?session_id={CHECKOUT_SESSION_ID}&addon=candidate`,
      metadata: {
        orgId: membership.orgId,
        type: "candidate_addon",
        creditCount: String(credits),
        actorId: profile.id,
      },
    });
    return NextResponse.json({ clientSecret: session.client_secret });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    ui_mode: "embedded",
    mode: "subscription",
    locale: stripeLocale,
    payment_method_types: ["card"],
    line_items: [{ price: priceId!, quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { orgId: membership.orgId },
    },
    return_url: `${APP_URL}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
    metadata: { orgId: membership.orgId },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ clientSecret: session.client_secret });
}
