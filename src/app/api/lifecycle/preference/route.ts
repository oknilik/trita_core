import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { setOpportunityPreference } from "@/lib/lifecycle/service";

const schema = z.object({ id: z.string().min(1).max(191), action: z.enum(["snooze", "dismiss"]) }).strict();
export async function POST(req: NextRequest) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const data = schema.safeParse(await req.json().catch(() => null));
  if (!data.success) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const profile = await prisma.userProfile.findUnique({ where: { clerkId: userId }, select: { id: true, deleted: true } });
  if (!profile || profile.deleted) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const ok = await setOpportunityPreference(data.data.id, profile.id, data.data.action);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
