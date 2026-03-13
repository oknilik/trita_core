import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICES, TRIAL_DAYS, type PriceKey } from "@/lib/stripe";

const schema = z.object({
  priceKey: z.enum(["team_monthly", "team_annual", "org_monthly", "org_annual"]),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: { role: true, orgId: true },
  });
  if (!membership || membership.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const priceId = STRIPE_PRICES[body.data.priceKey as PriceKey];

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
    // Persist customerId immediately so the Portal works even if webhook is delayed
    await prisma.subscription.upsert({
      where: { orgId: membership.orgId },
      create: { orgId: membership.orgId, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { orgId: membership.orgId },
    },
    success_url: `${APP_URL}/dashboard?checkout=success`,
    cancel_url: `${APP_URL}/pricing?checkout=canceled`,
    metadata: { orgId: membership.orgId },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
