/**
 * GET /api/org/[id]/invoices — org-level invoices and receipts
 *
 * Returns all purchases made for/within the org, plus subscription invoices
 * from BillingDocumentLink. Requires ORG_MANAGER or higher.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership || !hasOrgRole(membership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // 1. Purchases made for this org (one-time team products, candidate packs)
  const purchases = await prisma.purchase.findMany({
    where: { orgId, status: "completed" },
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

  // 2. Subscription invoices from BillingDocumentLink
  const subscriptionDocs = await prisma.billingDocumentLink.findMany({
    where: {
      sourceId: orgId,
      sourceType: { in: ["subscription_invoice", "candidate_addon"] },
      status: "issued",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sourceType: true,
      billingoDocumentId: true,
      billingoDocumentNumber: true,
      stripeInvoiceId: true,
      createdAt: true,
    },
  });

  for (const doc of subscriptionDocs) {
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

    const product = doc.sourceType === "candidate_addon"
      ? "candidate_pack"
      : "org_subscription";

    invoices.push({
      id: doc.id,
      product,
      amount: 0,
      currency: "eur",
      date: doc.createdAt.toISOString(),
      billingoDocumentId: doc.billingoDocumentId,
      billingoDocumentNumber: doc.billingoDocumentNumber,
      invoiceStatus: "issued",
      stripeReceiptUrl,
      hasBillingoInvoice: true,
    });
  }

  // Sort all by date descending
  invoices.sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({ invoices });
}
