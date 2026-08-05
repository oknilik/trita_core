import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { quoteInputSchema } from "@/lib/quote/rate-card";
import { createQuote } from "@/lib/crm/service";
import { crmErrorResponse, unauthorized, validationError } from "../_lib/respond";

// Admin CRM — új ajánlat (DRAFT) a kalkulátor-inputból. Az összegeket a
// szerver számolja (calculateQuote + friss rate card) és pillanatképként
// menti — a kliens sosem küld árat, csak bemenetet.

const postSchema = z.object({
  dealId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  validUntil: z.string().datetime({ offset: true }).optional(),
  input: quoteInputSchema,
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return validationError();

  try {
    const quote = await createQuote({
      dealId: parsed.data.dealId,
      input: parsed.data.input,
      title: parsed.data.title,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
    });
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
