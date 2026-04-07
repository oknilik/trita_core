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

  // Verify ownership: the document must belong to a purchase by this user
  const purchase = await prisma.purchase.findFirst({
    where: {
      userProfileId: profile.id,
      billingoDocumentId: documentId,
    },
    select: { id: true, billingoDocumentNumber: true },
  });

  if (!purchase) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const pdfBuffer = await downloadDocumentPdf(Number(documentId));
    const filename = purchase.billingoDocumentNumber
      ? `trita-szamla-${purchase.billingoDocumentNumber}.pdf`
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
