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
 * Ismeretlen slugra nem 404-ezünk, hanem a cím nélküli márka-vásznat adjuk:
 * egy visszavont cikk régi levelében se legyen törött kép.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const image = await renderBlogCoverImage(slug);

  // A cím ritkán, de változhat (szerkesztés) — ezért nem `immutable`. A CDN
  // egy napig tartja, a kliens egy óráig; a levél-kliensek proxyja ennél
  // amúgy is agresszívebben cache-el.
  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  return new Response(image.body, { status: image.status, headers });
}
