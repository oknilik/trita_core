import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getRequestLogger } from "@/lib/logger.server";
import { runBlogDigest } from "@/lib/newsletter-digest";

// Konstans-idejű string-összevetés (timing-oldalcsatorna ellen).
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/blog-digest — új blogbejegyzés-értesítő kiküldése.
 *
 * Naponta egyszer hívja a Vercel cron (vercel.json, 06:00 UTC — a
 * release-steps után egy órával, hogy a két futás ne essen egybe). A tényleges
 * indítás órán belül csúszhat; ez itt nem baj, mert a küldés nem időkritikus,
 * és a napló (`NewsletterDelivery`) miatt a késés sem okoz kettős küldést.
 *
 * Guard: a `CRON_SECRET` prodban KÖTELEZŐ — enélkül a végpont fail-closed
 * (401), mert bárki kiválthatná vele a tömeges levélküldést.
 */
export async function GET(req: NextRequest) {
  const log = await getRequestLogger("newsletter-digest");
  const secret = process.env.CRON_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (secret) {
    const header = req.headers.get("authorization") ?? "";
    if (!safeEqual(header, `Bearer ${secret}`)) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
  }

  try {
    const result = await runBlogDigest();
    log.info(
      {
        event: "newsletter.digest_run",
        candidates: result.candidates,
        posts: result.sent.length,
        failed: result.failed,
      },
      "Blog digest run finished",
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error({ event: "newsletter.digest_run_failed", err: error }, "Blog digest run failed");
    return NextResponse.json({ error: "DIGEST_FAILED" }, { status: 500 });
  }
}
