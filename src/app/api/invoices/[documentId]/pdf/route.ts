/**
 * GET /api/invoices/[documentId]/pdf — download Billingo invoice PDF
 *
 * Proxies the PDF from Billingo API. Validates that the document
 * belongs to the requesting user before serving.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { downloadDocumentPdf } from "@/lib/billing/billingo-client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { documentId } = await params;
  if (!documentId) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Verify ownership: document must belong to a purchase by this user
  // or a subscription invoice for an org they're in
  const purchase = await prisma.purchase.findFirst({
    where: {
      userProfileId: profile.id,
      billingoDocumentId: documentId,
    },
    select: { id: true, billingoDocumentNumber: true },
  });

  let docNumber = purchase?.billingoDocumentNumber ?? null;

  if (!purchase) {
    // Check subscription docs via org membership
    const orgMemberships = await prisma.organizationMember.findMany({
      where: { userId: profile.id },
      select: { orgId: true },
    });
    const orgIds = orgMemberships.map((m) => m.orgId);

    const subDoc = orgIds.length > 0
      ? await prisma.billingDocumentLink.findFirst({
          where: {
            billingoDocumentId: documentId,
            sourceType: "subscription_invoice",
            sourceId: { in: orgIds },
          },
          select: { billingoDocumentNumber: true },
        })
      : null;

    if (!subDoc) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    docNumber = subDoc.billingoDocumentNumber;
  }

  try {
    const pdfBuffer = await downloadDocumentPdf(Number(documentId));
    const filename = docNumber
      ? `trita-szamla-${docNumber}.pdf`
      : `trita-szamla-${documentId}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[Invoices] PDF download failed:", err);
    return NextResponse.json({ error: "DOWNLOAD_FAILED" }, { status: 502 });
  }
}
