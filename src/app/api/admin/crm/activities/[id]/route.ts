import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { deleteActivity, updateActivity } from "@/lib/crm/service";
import { crmErrorResponse, unauthorized, validationError } from "../../_lib/respond";

// Admin CRM — kézi idővonal-bejegyzés szerkesztése/törlése. SYSTEM-esemény
// nem írható át és nem törölhető (NOT_EDITABLE) — a rendszer-történet
// hiteles marad.

const patchSchema = z.object({
  summary: z.string().min(1).max(300).optional(),
  body: z.string().max(4000).nullable().optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
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

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return validationError();

  try {
    const activity = await updateActivity(id, {
      summary: parsed.data.summary,
      body: parsed.data.body,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
    });
    return NextResponse.json({ activity });
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
    await deleteActivity(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
