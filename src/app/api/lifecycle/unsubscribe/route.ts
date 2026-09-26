import { NextRequest, NextResponse } from "next/server";
import { unsubscribeLifecycle } from "@/lib/lifecycle/service";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const url = new URL("/follow-up/unsubscribe", req.url);
  url.searchParams.set("token", req.nextUrl.searchParams.get("token")?.slice(0, 100) ?? "");
  return NextResponse.redirect(url, 303);
}
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!/^[a-f0-9-]{36}$/.test(token)) return NextResponse.json({ ok: false }, { status: 400 });
  const ok = await unsubscribeLifecycle(token);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
}
