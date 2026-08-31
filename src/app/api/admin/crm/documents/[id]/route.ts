import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { markCommercialDocumentStatus } from "@/lib/crm/commercial-documents";
import {
  crmErrorResponse,
  unauthorized,
  validationError,
} from "@/app/api/admin/crm/_lib/respond";

const patchSchema = z.object({
  status: z.enum(["SENT", "SIGNED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return validationError();
  const { id } = await params;

  try {
    const document = await markCommercialDocumentStatus(id, parsed.data.status);
    return NextResponse.json({ document });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
