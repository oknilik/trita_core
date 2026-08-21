import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/blog";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";
import { registerClick } from "@/lib/newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/newsletter/click?d=<deliveryId>&to=<slug>
 *
 * A levélbeli cikk-linkek ezen mennek át: rögzítjük az ELSŐ kattintást, majd
 * továbbdobunk a cikkre.
 *
 * MIÉRT KATTINTÁS, ÉS NEM NYITÁS: a nyitás-mérés követő pixellel megy, ami
 * süti-jellegű nyomkövetés, ráadásul az Apple Mail Privacy Protection
 * előre letölti a képeket — a szám tehát egyszerre tolakodó és hamis. A
 * kattintás önkéntes cselekvés, és a levélben amúgy is van link.
 *
 * NYÍLT ÁTIRÁNYÍTÁS ELLEN: a `to` paraméter egy SLUG, nem URL, és csak akkor
 * fogadjuk el, ha tartozik hozzá publikált cikk. A cél-URL-t mi építjük.
 * Ismeretlen slug esetén a bloglistára megyünk — a kattintás akkor sem vész el.
 */
export async function GET(req: NextRequest) {
  const log = await getRequestLogger("newsletter");

  const deliveryId = req.nextUrl.searchParams.get("d") ?? "";
  const slug = req.nextUrl.searchParams.get("to") ?? "";

  const post = slug ? getPostBySlug(slug) : null;
  const target = new URL(
    post && post.status === "published" ? `/blog/${post.slug}` : "/blog",
    req.nextUrl.origin,
  );

  // A mérés SOHA nem törheti el az átirányítást: hibára is elmegyünk a cikkre.
  try {
    if (deliveryId) {
      const known = await registerClick(deliveryId);
      if (known) trackServerEvent("newsletter.click", { slug: post?.slug ?? "unknown" });
    }
  } catch (error) {
    log.error({ event: "newsletter.click_failed", err: error }, "Newsletter click tracking failed");
  }

  return NextResponse.redirect(target, { status: 302 });
}
