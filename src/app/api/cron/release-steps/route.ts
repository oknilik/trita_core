import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { releaseDueCampaignSteps } from "@/lib/campaign-steps";
import { runNotificationSweep } from "@/lib/notifications/sweep";

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
 * kinyitása + értesítés. Naponta egyszer hívja a Vercel cron (vercel.json,
 * 05:00 UTC) — a Hobby csomag ennél sűrűbb ütemezést nem fogad el, és a
 * tényleges indítás órán belül csúszhat. Emellett a kitöltő-oldalak
 * betöltése user-szinten is elvégzi (`releaseDueCampaignSteps({ userId })`),
 * így a résztvevő saját lépése azonnal megnyílik; a cron csak a proaktív
 * értesítés-küldést fedi, ott max. ~24 óra késés lehet.
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
  // emailNotify: a cron-release a user jelenléte nélkül nyit — itt megy ki a
  // lépés-nyitási email is (in-app értesítés + email-pár).
  const released = await releaseDueCampaignSteps({ emailNotify: true });
  // Napi notification-sweep ugyanebből a cronból (Hobby csomag: 1 cron) —
  // trial-ellenőrzések + reflexiós utókövetés (D1). A sweep hibái a
  // válaszban jelennek meg, a lépés-nyitást nem borítják.
  const sweep = await runNotificationSweep();
  return NextResponse.json({ ok: true, released, sweep });
}
