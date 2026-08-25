import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getPostBySlug, isBlogCoverImage } from "@/lib/blog";
import { DEFAULT_OG_IMAGE_PATH } from "@/lib/seo";
import { renderBlogCoverImage } from "@/lib/og/blog-cover";

export const runtime = "nodejs";

/**
 * GET /api/newsletter/cover/<slug> — a hírlevél cikk-borítója, 4:3 kivágásban.
 *
 * MIÉRT NEM A BLOG OG-KÉPE: a Next a metadata-image route-ra build-generált
 * utótagot tesz (`…/opengraph-image-<hash>`), ami oldalkódból nem olvasható
 * ki, az utótag nélküli út pedig 404. A levélnek viszont STABIL URL kell: a
 * levél hónapokig ott ül a postafiókban, és a képet a megnyitáskor tölti be —
 * jóval a küldést (és a következő deployt) követően. A stabil route mögött a
 * cikk VALÓDI borítóképét adjuk vissza; az OG-vászon (cím + kis kép) csak a
 * borító nélküli régi cikkek tartaléka.
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

  if (post.coverImage && isBlogCoverImage(post.coverImage)) {
    try {
      const fileName = post.coverImage.slice("/blog-covers/".length);
      const bytes = await readFile(path.join(process.cwd(), "public", "blog-covers", fileName));
      const metadata = await sharp(bytes).metadata();
      const width = metadata.width;
      const height = metadata.height;
      const targetRatio = 4 / 3;
      const focalX = Math.min(100, Math.max(0, post.coverFocalX ?? 50)) / 100;
      const focalY = Math.min(100, Math.max(0, post.coverFocalY ?? 50)) / 100;

      let pipeline = sharp(bytes);
      if (width && height) {
        if (width / height > targetRatio) {
          const cropWidth = Math.min(width, Math.round(height * targetRatio));
          const maxLeft = width - cropWidth;
          pipeline = pipeline.extract({
            left: Math.round(maxLeft * focalX),
            top: 0,
            width: cropWidth,
            height,
          });
        } else {
          const cropHeight = Math.min(height, Math.round(width / targetRatio));
          const maxTop = height - cropHeight;
          pipeline = pipeline.extract({
            left: 0,
            top: Math.round(maxTop * focalY),
            width,
            height: cropHeight,
          });
        }
      }

      const png = await pipeline.resize(800, 600, { fit: "fill" }).png().toBuffer();
      return new Response(new Uint8Array(png), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      });
    } catch {
      // Hiányzó/sérült borító ne törje el a régi levelet: az OG-vászon a
      // tartalék, ugyanazon a stabil URL-en.
    }
  }

  const image = await renderBlogCoverImage(post.slug);

  // A cím ritkán, de változhat (szerkesztés) — ezért nem `immutable`. A CDN
  // egy napig tartja, a kliens egy óráig; a levél-kliensek proxyja ennél
  // amúgy is agresszívebben cache-el.
  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  return new Response(image.body, { status: image.status, headers });
}
