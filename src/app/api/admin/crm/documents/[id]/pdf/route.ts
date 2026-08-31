import { renderToBuffer } from "@react-pdf/renderer";
import { requireAdmin } from "@/lib/auth";
import { CommercialDocumentPdf } from "@/components/pdf/CommercialDocumentPdf";
import { getCommercialDocumentSnapshot } from "@/lib/crm/commercial-documents";
import { crmErrorResponse, unauthorized } from "@/app/api/admin/crm/_lib/respond";
import { registerServerPdfFonts } from "@/lib/pdf/register-fonts.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }
  const { id } = await params;

  try {
    const snapshot = await getCommercialDocumentSnapshot(id);
    registerServerPdfFonts();
    const buffer = await renderToBuffer(CommercialDocumentPdf({ snapshot }));
    const filename = `${snapshot.documentNumber}.pdf`;
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
