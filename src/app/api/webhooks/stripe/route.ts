import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/emails";
import { addCredits } from "@/lib/candidate-credits";
import { TIER_CONFIG } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

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
  if (!WEBHOOK_SECRET) {
    console.error("[Stripe webhook] STRIPE_WEBHOOK_SECRET is not configured!");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

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
        const orgId = session.metadata?.orgId;
        if (!orgId) break;

        // ── One-time purchase ──────────────────────────────────
        if (session.mode === "payment" && session.metadata?.type === "one_time_purchase") {
          const tier = session.metadata.tier;
          const userProfileId = session.metadata.userProfileId;
          const orgId = session.metadata.orgId || null;
          const teamId = session.metadata.teamId || null;

          if (!tier || !userProfileId) {
            console.error("[Stripe] Missing metadata in one_time_purchase session", session.id);
            break;
          }

          // Duplikáció védelem
          const existing = await prisma.purchase.findFirst({
            where: { stripeCheckoutSessionId: session.id },
          });
          if (existing) {
            console.log(`[Stripe] Skipping duplicate purchase for session ${session.id}`);
            break;
          }

          const config = TIER_CONFIG[tier];

          await prisma.purchase.create({
            data: {
              userProfileId,
              orgId: orgId || null,
              teamId: teamId || null,
              tier,
              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : (session.payment_intent as { id: string } | null)?.id ?? null,
              stripeCheckoutSessionId: session.id,
              amount: session.amount_total ?? 0,
              currency: session.currency ?? "eur",
              status: "completed",
              includesAdvisory: config?.includesAdvisory ?? false,
              includedCredits: config?.includedCredits ?? 0,
            },
          });

          console.log(`[Stripe] Purchase created: ${tier} for profile ${userProfileId}`);
          break;
        }

        // ── Candidate addon one-time payment ─────────────────
        if (session.mode === "payment" && session.metadata?.type === "candidate_addon") {
          const creditCount = parseInt(session.metadata.creditCount ?? "1", 10);
          const actorId = session.metadata.actorId ?? "system";
          const creditLabels: Record<number, string> = {
            1: "1× jelölt értékelés",
            5: "5× jelölt értékelés csomag",
            10: "10× jelölt értékelés csomag",
          };
          const label = creditLabels[creditCount] ?? `${creditCount}× jelölt értékelés`;
          // Idempotency: return page may have already processed this session
          const alreadyProcessed = await prisma.candidateCredit.findFirst({
            where: { orgId, note: { contains: session.id } },
            select: { id: true },
          });
          if (!alreadyProcessed) {
            await addCredits({
              orgId,
              amount: creditCount,
              actorId,
              note: `${label} [${session.id}]`,
            });
            console.log(`[Stripe] +${creditCount} candidate credits for org ${orgId}`);
          } else {
            console.log(`[Stripe] Skipping duplicate credit for session ${session.id}`);
          }
          break;
        }

        if (session.mode !== "subscription") break;

        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await upsertSubscription(orgId, subscription, customerId);

        // Activate org if it was in PENDING_SETUP
        await prisma.organization.updateMany({
          where: { id: orgId, status: "PENDING_SETUP" },
          data: { status: "ACTIVE" },
        });

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
