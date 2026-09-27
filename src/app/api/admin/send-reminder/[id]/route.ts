import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendObserverReminder } from "@/lib/lifecycle/legacy";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let actorId: string;
  try { actorId = (await requireAdmin()).userId; }
  catch { return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }); }
  const limited = await checkRateLimit("contact", actorId);
  if (limited) return limited;
  const { id } = await params;
  const result = await sendObserverReminder(id, actorId);
  return result.ok
    ? NextResponse.json({ ok: true, sentAt: result.sentAt.toISOString() })
    : NextResponse.json({ error: result.reason }, { status: 409 });
}
