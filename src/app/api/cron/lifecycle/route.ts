import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runLifecycle } from "@/lib/lifecycle/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const received = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const result = await runLifecycle();
    return NextResponse.json(result, { status: "errors" in result && result.errors?.length ? 500 : 200 });
  } catch {
    return NextResponse.json({ error: "LIFECYCLE_RUN_FAILED" }, { status: 500 });
  }
}
