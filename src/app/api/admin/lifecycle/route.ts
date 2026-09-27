import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { discoverProfiles } from "@/lib/lifecycle/run";
import { inspectOpportunity, sendOpportunity, setOpportunityPreference, syncOpportunity } from "@/lib/lifecycle/service";
import { prisma } from "@/lib/prisma";
import { lifecycleConfig } from "@/lib/lifecycle/config";
import { FOLLOWUP_COPY } from "@/lib/lifecycle/copy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }); }
  const search = req.nextUrl.searchParams.get("search")?.trim().slice(0, 100);
  const cursor = req.nextUrl.searchParams.get("cursor")?.slice(0, 191);
  const profiles = await discoverProfiles({ cursor, search, limit: 25 });
  const rows = [];
  for (const profile of profiles) {
    const id = await syncOpportunity(profile.id);
    if (!id) continue;
    const view = await inspectOpportunity(id);
    if (!view) continue;
    const safe = { ...view, context: undefined };
    rows.push({ ...safe, copy: FOLLOWUP_COPY[view.rule] });
  }
  const run = await prisma.lifecycleRun.findUnique({ where: { id: "daily" } });
  const recent = await prisma.lifecycleDelivery.findMany({ orderBy: { claimedAt: "desc" }, take: 20,
    select: { id: true, rule: true, recipient: true, status: true, claimedAt: true, deliveredAt: true, errorCode: true } });
  const completed = await prisma.lifecycleOpportunity.findMany({ where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 10,
    select: { id: true, rule: true, completedAt: true, profile: { select: { email: true } } } });
  return NextResponse.json({ mode: lifecycleConfig().mode, rows, recent, completed, run,
    nextCursor: profiles.length === 25 ? profiles[profiles.length - 1].id : null,
  }, { headers: { "Cache-Control": "no-store" } });
}

const actionSchema = z.object({ id: z.string().min(1).max(191), action: z.enum(["send", "snooze", "dismiss"]) });
export async function POST(req: NextRequest) {
  let actorId: string;
  try { actorId = (await requireAdmin()).userId; } catch { return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }); }
  const limited = await checkRateLimit("contact", actorId);
  if (limited) return limited;
  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const { id, action } = parsed.data;
  if (action === "send") {
    const result = await sendOpportunity(id, "manual", actorId);
    return NextResponse.json(result.ok ? { ok: true } : { error: result.reason }, { status: result.ok ? 200 : 409 });
  }
  const opportunity = await prisma.lifecycleOpportunity.findUnique({ where: { id } });
  if (!opportunity) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const ok = await setOpportunityPreference(id, opportunity.profileId, action);
  return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
}
