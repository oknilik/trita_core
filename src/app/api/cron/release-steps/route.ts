import { NextRequest, NextResponse } from "next/server";
import { releaseDueCampaignSteps } from "@/lib/campaign-steps";

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
  if (secret) {
    const header = req.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
  }
  const released = await releaseDueCampaignSteps();
  return NextResponse.json({ ok: true, released });
}
