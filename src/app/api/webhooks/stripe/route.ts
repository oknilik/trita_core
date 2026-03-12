import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/emails";

export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

async function upsertSubscription(
  orgId: string,
  subscription: Stripe.Subscription,
  customerId: string,
) {
  await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      status: subscription.status,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      currentPeriodEnd: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      status: subscription.status,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      currentPeriodEnd: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Stripe webhook] Signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const orgId = session.metadata?.orgId;
        if (!orgId) break;

        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await upsertSubscription(orgId, subscription, customerId);
        console.log(`[Stripe] Checkout complete for org ${orgId}`);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = subscription.metadata?.orgId;
        if (!orgId) break;

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await upsertSubscription(orgId, subscription, customerId);

        if (
          event.type === "customer.subscription.updated" &&
          event.data.previous_attributes &&
          "status" in event.data.previous_attributes &&
          event.data.previous_attributes.status === "trialing" &&
          subscription.status === "active"
        ) {
          const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { name: true, owner: { select: { email: true } } },
          });
          if (org?.owner?.email) {
            await sendOrderConfirmationEmail({
              to: org.owner.email,
              name: org.name,
            });
          }
        }

        console.log(`[Stripe] Subscription ${subscription.status} for org ${orgId}`);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[Stripe webhook] Handler error:", err);
    return new NextResponse("Internal error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
