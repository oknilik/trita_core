import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { quoteInputSchema } from "@/lib/quote/rate-card";
import {
  deleteDraftQuote,
  markQuoteAccepted,
  markQuoteDeclined,
  markQuoteSent,
  setQuoteValidUntil,
  updateDraftQuoteInput,
} from "@/lib/crm/service";
import { crmErrorResponse, unauthorized, validationError } from "../../_lib/respond";

// Admin CRM — quote-életciklus: update_input (csak DRAFT), mark_sent (deal
// → QUOTED + SYSTEM-activity), mark_accepted (deal → WON), mark_declined,
// set_valid_until. Az átmeneteket a canTransitionQuote őrzi a service-ben
// (INVALID_TRANSITION); törlés csak DRAFT-on (ONLY_DRAFT_DELETABLE).

const isoDateTime = z.string().datetime({ offset: true });

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update_input"), input: quoteInputSchema }),
  z.object({ action: z.literal("mark_sent"), validUntil: isoDateTime.optional() }),
  z.object({ action: z.literal("mark_accepted") }),
  z.object({ action: z.literal("mark_declined"), reason: z.string().max(1000).optional() }),
  z.object({ action: z.literal("set_valid_until"), validUntil: isoDateTime.nullable() }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return validationError();
  const data = parsed.data;

  try {
    switch (data.action) {
      case "update_input": {
        const quote = await updateDraftQuoteInput(id, data.input);
        return NextResponse.json({ quote });
      }
      case "mark_sent": {
        const quote = await markQuoteSent(
          id,
          data.validUntil ? new Date(data.validUntil) : undefined,
        );
        return NextResponse.json({ quote });
      }
      case "mark_accepted": {
        const quote = await markQuoteAccepted(id);
        return NextResponse.json({ quote });
      }
      case "mark_declined": {
        const quote = await markQuoteDeclined(id, data.reason);
        return NextResponse.json({ quote });
      }
      case "set_valid_until": {
        const quote = await setQuoteValidUntil(
          id,
          data.validUntil ? new Date(data.validUntil) : null,
        );
        return NextResponse.json({ quote });
      }
    }
  } catch (error) {
    return crmErrorResponse(error);
  }
}

export async function DELETE(
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
    await deleteDraftQuote(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
