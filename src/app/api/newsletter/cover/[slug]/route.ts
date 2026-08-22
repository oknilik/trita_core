import { NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/blog";
import { DEFAULT_OG_IMAGE_PATH } from "@/lib/seo";
import { renderBlogCoverImage } from "@/lib/og/blog-cover";

export const runtime = "nodejs";

/**
 * GET /api/newsletter/cover/<slug> — a hírlevél cikk-borítója.
 *
 * MIÉRT NEM A BLOG OG-KÉPE: a Next a metadata-image route-ra build-generált
 * utótagot tesz (`…/opengraph-image-<hash>`), ami oldalkódból nem olvasható
 * ki, az utótag nélküli út pedig 404. A levélnek viszont STABIL URL kell: a
 * levél hónapokig ott ül a postafiókban, és a képet a megnyitáskor tölti be —
 * jóval a küldést (és a következő deployt) követően.
 *
 * ISMERETLEN SLUG → ÁTIRÁNYÍTÁS, NEM RENDERELÉS (2026-08-21, review-találat):
 * a renderelés két fontfájlt olvas és egy 1200×630-as képet rajzol, a CDN
 * cache-kulcsa pedig az URL. Ha minden ismeretlen slugra renderelnénk, végtelen
 * sok különböző slug végtelen sok cache-miss-t és renderelést kényszerítene ki
 * — mérve 40 slug × 8 párhuzamos kérés ≈ 1,3 s renderidő. Ezért az ismeretlen
 * és a visszavont cikk EGYETLEN statikus képre (`/opengraph-image`, prerendelt
 * márka-vászon) megy 302-vel: nincs slugonkénti render, és a régi levélben sem
 * lesz törött kép.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (post?.status !== "published") {
    // A 302 maga is cache-elhető, tehát a szemét-forgalom a CDN-en megáll.
    return NextResponse.redirect(new URL(DEFAULT_OG_IMAGE_PATH, req.url), {
      status: 302,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  }

  const image = await renderBlogCoverImage(post.slug);

  // A cím ritkán, de változhat (szerkesztés) — ezért nem `immutable`. A CDN
  // egy napig tartja, a kliens egy óráig; a levél-kliensek proxyja ennél
  // amúgy is agresszívebben cache-el.
  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  return new Response(image.body, { status: image.status, headers });
}
