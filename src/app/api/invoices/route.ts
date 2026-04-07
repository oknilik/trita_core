/**
 * GET /api/invoices — list user's invoices and receipts
 *
 * Returns purchases with Billingo document links and Stripe receipt URLs.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Get all completed purchases with their Billingo doc links
  const purchases = await prisma.purchase.findMany({
    where: { userProfileId: profile.id, status: "completed" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tier: true,
      productType: true,
      amount: true,
      currency: true,
      createdAt: true,
      stripePaymentIntentId: true,
      billingoDocumentId: true,
      billingoDocumentNumber: true,
      invoiceStatus: true,
    },
  });

  // Look up Stripe receipt URLs for purchases with payment intents
  const invoices = await Promise.all(
    purchases.map(async (purchase) => {
      let stripeReceiptUrl: string | null = null;

      if (purchase.stripePaymentIntentId) {
        try {
          const pi = await stripe.paymentIntents.retrieve(purchase.stripePaymentIntentId);
          const chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : null;
          if (chargeId) {
            const charge = await stripe.charges.retrieve(chargeId);
            stripeReceiptUrl = charge.receipt_url ?? null;
          }
        } catch {
          // Stripe lookup failed — non-critical
        }
      }

      return {
        id: purchase.id,
        product: purchase.productType ?? purchase.tier,
        amount: purchase.amount,
        currency: purchase.currency,
        date: purchase.createdAt.toISOString(),
        billingoDocumentId: purchase.billingoDocumentId,
        billingoDocumentNumber: purchase.billingoDocumentNumber,
        invoiceStatus: purchase.invoiceStatus,
        stripeReceiptUrl,
        hasBillingoInvoice: purchase.invoiceStatus === "issued" && !!purchase.billingoDocumentId,
      };
    }),
  );

  return NextResponse.json({ invoices });
}
