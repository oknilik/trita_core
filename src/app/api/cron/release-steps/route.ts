import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { releaseDueCampaignSteps } from "@/lib/campaign-steps";

// Konstans-idejű string-összevetés (timing-oldalcsatorna ellen).
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/release-steps — esedékes ütemezett kampánylépések
 * kinyitása + értesítés. Óránként hívja a Vercel cron (vercel.json);
 * emellett a kitöltő-oldalak betöltése user-szinten is elvégzi, így a
 * cron csak a proaktív értesítés-küldést fedi.
 *
 * Guard: ha CRON_SECRET be van állítva, Bearer tokenként kötelező
 * (a Vercel cron automatikusan így hívja).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Prodban a secret kötelező — beállítatlan secret mellett az endpoint
  // nem hívható (fail closed), dev-ben marad a nyitott viselkedés.
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (secret) {
    const header = req.headers.get("authorization") ?? "";
    if (!safeEqual(header, `Bearer ${secret}`)) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
  }
  const released = await releaseDueCampaignSteps();
  return NextResponse.json({ ok: true, released });
}
