/**
 * POST /api/billing/upgrade — in-app plan upgrade / switch
 *
 * Changes the Stripe subscription to a new price (plan tier or interval).
 * Handles proration automatically. Requires ORG_ADMIN.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { getServerAuth } from "@/lib/auth-server";

const schema = z.object({
  targetPriceKey: z.enum([
    "team_monthly",
    "team_annual",
    "org_monthly",
    "org_annual",
  ]),
});

export async function POST(req: Request) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const membership = await getActiveOrgMembership(profile.id);
  if (!membership || membership.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const { targetPriceKey } = body.data;
  const targetPriceId = STRIPE_PRICES[targetPriceKey];
  if (!targetPriceId) {
    return NextResponse.json({ error: "PRICE_NOT_CONFIGURED" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { orgId: membership.orgId },
    select: {
      stripeSubscriptionId: true,
      stripePriceId: true,
      planType: true,
      billingInterval: true,
    },
  });

  if (!sub?.stripeSubscriptionId) {
    return NextResponse.json({ error: "NO_SUBSCRIPTION" }, { status: 400 });
  }

  // Check if already on this plan
  if (sub.stripePriceId === targetPriceId) {
    return NextResponse.json({ error: "ALREADY_ON_PLAN" }, { status: 400 });
  }

  try {
    // Retrieve current Stripe subscription to get the subscription item ID
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const mainItem = stripeSub.items.data[0];
    if (!mainItem) {
      return NextResponse.json({ error: "SUBSCRIPTION_ITEM_NOT_FOUND" }, { status: 500 });
    }

    // Update the subscription with the new price
    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      items: [
        {
          id: mainItem.id,
          price: targetPriceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    // Derive plan type and interval from the target key
    const newPlanType = targetPriceKey.startsWith("org") ? "org" : "team";
    const newInterval = targetPriceKey.includes("annual") ? "annual" : "monthly";

    // Update our DB
    await prisma.subscription.update({
      where: { orgId: membership.orgId },
      data: {
        stripePriceId: targetPriceId,
        planType: newPlanType,
        billingInterval: newInterval,
        status: updated.status,
      },
    });

    return NextResponse.json({
      success: true,
      newPlan: newPlanType,
      newInterval,
      effectiveDate: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Billing/Upgrade] Stripe update failed:", err);
    return NextResponse.json({ error: "UPGRADE_FAILED" }, { status: 502 });
  }
}
