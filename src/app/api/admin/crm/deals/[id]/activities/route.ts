import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { MANUAL_ACTIVITY_KINDS } from "@/lib/crm/constants";
import { logActivity } from "@/lib/crm/service";
import { crmErrorResponse, unauthorized, validationError } from "../../../_lib/respond";

// Admin CRM — naplózás + OPCIONÁLIS következő lépés EGY hívásban (a terv
// kulcs-UX-e): activity-create, lastActivityAt és nextActionAt/-Note egy
// tranzakcióban. SYSTEM-kindet a kliens nem írhat (a zod-enum kizárja).

const postSchema = z.object({
  kind: z.enum(MANUAL_ACTIVITY_KINDS),
  summary: z.string().min(1).max(300),
  body: z.string().max(4000).optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
  nextActionAt: z.string().datetime({ offset: true }).nullable().optional(),
  nextActionNote: z.string().max(1000).optional(),
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

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return validationError();
  const data = parsed.data;

  try {
    const { activity, deal } = await logActivity(
      id,
      {
        kind: data.kind,
        summary: data.summary,
        body: data.body,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
      },
      // nextActionAt jelenléte vezérli: string → kitűzés, null → törlés,
      // hiánya → a deal next actionje érintetlen marad.
      data.nextActionAt !== undefined
        ? {
            at: data.nextActionAt ? new Date(data.nextActionAt) : null,
            note: data.nextActionNote,
          }
        : undefined,
    );
    return NextResponse.json({ activity, deal }, { status: 201 });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
