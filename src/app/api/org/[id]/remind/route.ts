import { NextResponse } from "next/server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";

// POST /api/org/[id]/remind — send reminders to members who haven't completed their assessment
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await params;

  const { role } = await requireOrgContext(orgId);
  if (!hasOrgRole(role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // TODO: implement actual reminder sending via Resend
  // For now, stub returns ok
  return NextResponse.json({ ok: true });
}
