import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { getAllPosts } from "../../../src/lib/blog";
import { blogImageUrl } from "../../../src/lib/newsletter-links";

/**
 * A hírlevél cikkborítójának VALÓDI route-tesztje.
 *
 * MIÉRT KELL (2026-08-21): a borító korábban a blog metadata-image útjára
 * mutatott, amit a Next build-generált utótaggal szolgál ki — az utótag
 * nélküli alak 404. Minden levélben törött kép ült. A unit tesztek ezt NEM
 * fogták meg, mert csak az URL-sztringet nézték, sosem hívták meg a route-ot.
 *
 * Ez a teszt azt az URL-t kéri le, amit a levél-építő (`blogImageUrl`)
 * ténylegesen a levélbe írna — így egy elmozduló route is bukik, nem csak egy
 * elrontott sztring.
 */

function coverPath(slug: string): string {
  return new URL(blogImageUrl("https://trita.io", slug)).pathname;
}

test("a levélbe írt borító-URL valódi képet ad", async ({ request }) => {
  const post = getAllPosts("hu")[0];
  expect(post, "kell legalább egy publikált magyar cikk a teszthez").toBeTruthy();

  const response = await request.get(coverPath(post!.slug));

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  const body = await response.body();
  expect(body.byteLength).toBeGreaterThan(1000);
  const metadata = await sharp(body).metadata();
  expect(metadata.width).toBe(800);
  expect(metadata.height).toBe(600);
});

test("ismeretlen slug a statikus márka-képre irányít, nem renderel újat", async ({ request }) => {
  // A renderelés drága (két fontfájl + 1200×630 raszter), a CDN cache-kulcsa
  // pedig az URL — ezért ismeretlen slugra átirányítás megy, nem rajzolás.
  const response = await request.get(coverPath("nincs-ilyen-cikk-sosem-volt"), {
    maxRedirects: 0,
  });

  expect(response.status()).toBe(302);
  expect(response.headers()["location"]).toContain("/opengraph-image");
  expect(response.headers()["cache-control"]).toContain("s-maxage=");
});

test("a slug nem tud kilépni a blog könyvtárból", async ({ request }) => {
  const post = getAllPosts("hu")[0];
  // Dekódolva `placeholder/../<valódi-slug>` — korábban ez bájtra ugyanazt a
  // képet adta, mint a kanonikus URL, vagyis a path.join kilépett a mappából.
  const traversal = `/api/newsletter/cover/${encodeURIComponent(`placeholder/../${post!.slug}`)}`;

  const response = await request.get(traversal, { maxRedirects: 0 });

  expect(response.status()).toBe(302);
  expect(response.headers()["location"]).toContain("/opengraph-image");
});
