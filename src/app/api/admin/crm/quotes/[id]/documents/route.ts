import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  COMMERCIAL_DOCUMENT_KINDS,
  commercialDocumentFormSchema,
} from "@/lib/crm/commercial-document-schema";
import { generateCommercialDocument } from "@/lib/crm/commercial-documents";
import {
  crmErrorResponse,
  unauthorized,
  validationError,
} from "@/app/api/admin/crm/_lib/respond";

const postSchema = z.object({
  kind: z.enum(COMMERCIAL_DOCUMENT_KINDS),
  form: commercialDocumentFormSchema,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return validationError();
  const { id } = await params;

  try {
    const document = await generateCommercialDocument({
      quoteId: id,
      kind: parsed.data.kind,
      form: parsed.data.form,
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
