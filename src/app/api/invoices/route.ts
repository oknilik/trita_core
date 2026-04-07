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

  // Also include subscription invoices from BillingDocumentLink
  // (these come from invoice.paid webhook, not from purchases)
  const orgMemberships = await prisma.organizationMember.findMany({
    where: { userId: profile.id },
    select: { orgId: true },
  });
  const orgIds = orgMemberships.map((m) => m.orgId);

  if (orgIds.length > 0) {
    const subscriptionDocs = await prisma.billingDocumentLink.findMany({
      where: {
        sourceType: "subscription_invoice",
        sourceId: { in: orgIds },
        status: "issued",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        sourceId: true,
        billingoDocumentId: true,
        billingoDocumentNumber: true,
        stripeInvoiceId: true,
        createdAt: true,
      },
    });

    for (const doc of subscriptionDocs) {
      // Avoid duplicating purchases that already have a doc link
      const alreadyIncluded = invoices.some(
        (inv) => inv.billingoDocumentId === doc.billingoDocumentId,
      );
      if (alreadyIncluded) continue;

      let stripeReceiptUrl: string | null = null;
      if (doc.stripeInvoiceId) {
        try {
          const inv = await stripe.invoices.retrieve(doc.stripeInvoiceId);
          stripeReceiptUrl = inv.hosted_invoice_url ?? null;
        } catch {
          // non-critical
        }
      }

      invoices.push({
        id: doc.id,
        product: "org_subscription",
        amount: 0, // Amount lives in Stripe, not in our doc link
        currency: "eur",
        date: doc.createdAt.toISOString(),
        billingoDocumentId: doc.billingoDocumentId,
        billingoDocumentNumber: doc.billingoDocumentNumber,
        invoiceStatus: "issued",
        stripeReceiptUrl,
        hasBillingoInvoice: true,
      });
    }
  }

  // Sort all invoices by date descending
  invoices.sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({ invoices });
}
