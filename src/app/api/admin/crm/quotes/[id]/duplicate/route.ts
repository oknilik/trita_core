import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { duplicateQuote } from "@/lib/crm/service";
import { crmErrorResponse, unauthorized } from "../../../_lib/respond";

// Admin CRM — másolat új DRAFT-ként (lejárt/elutasított/kiment ajánlat
// „módosítása”): az input átemelve, friss rate carddal ÚJRAszámolva.

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  try {
    const quote = await duplicateQuote(id);
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
