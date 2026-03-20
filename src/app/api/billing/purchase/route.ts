import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe, isOneTimeTier, getOneTimePriceId, TIER_CONFIG } from "@/lib/stripe";

const TEAM_TIERS = ["team_scan", "team_deep_dive"] as const;

const schema = z.object({
  tier: z.string(),
  teamId: z.string().optional(),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const { tier, teamId } = body.data;

  if (!isOneTimeTier(tier)) {
    return NextResponse.json({ error: "INVALID_TIER" }, { status: 400 });
  }

  const priceId = getOneTimePriceId(tier);
  if (!priceId) {
    return NextResponse.json({ error: "PRICE_NOT_CONFIGURED" }, { status: 400 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, locale: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Csapat szintű vásárlásnál: team owner vagy org manager/admin szükséges
  if ((TEAM_TIERS as readonly string[]).includes(tier)) {
    if (!teamId) {
      return NextResponse.json({ error: "TEAM_ID_REQUIRED" }, { status: 400 });
    }
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true, orgId: true },
    });
    if (!team) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const isTeamOwner = team.ownerId === profile.id;
    let isOrgManager = false;

    if (!isTeamOwner && team.orgId) {
      const membership = await prisma.organizationMember.findUnique({
        where: { userId: profile.id },
        select: { role: true, orgId: true },
      });
      isOrgManager =
        membership?.orgId === team.orgId &&
        (membership.role === "ORG_ADMIN" || membership.role === "ORG_MANAGER");
    }

    if (!isTeamOwner && !isOrgManager) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  // Stripe customer keresése/létrehozása
  let customerId: string | null = null;

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: { orgId: true },
  });

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
  }

  const config = TIER_CONFIG[tier];
  const stripeLocale = profile.locale === "hu" ? "hu" : "en";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    locale: stripeLocale,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/billing`,
    metadata: {
      type: "one_time_purchase",
      tier,
      userProfileId: profile.id,
      orgId: membership?.orgId ?? "",
      teamId: teamId ?? "",
    },
  });

  return NextResponse.json({ url: session.url });
}
