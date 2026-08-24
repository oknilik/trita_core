import test from "node:test";
import assert from "node:assert/strict";
import { isBlogCoverImage } from "@/lib/blog";
import { sniffCoverExtension } from "@/lib/blog-cover-format";

// A borító-út frontmatterből jön (admin-mentés, .mdx-feltöltés), és
// `<img src>`-ként ÉS fájlútként is landol. Ezért nem elég, hogy „string" —
// a prefix és a fájlnév alakja is kötött, különben a szerkesztő felületén át
// külső URL vagy könyvtárból kilépő út kerülhetne a publikus oldalra.

test("az ervenyes borito-ut atmegy", () => {
  assert.equal(isBlogCoverImage("/blog-covers/csapatdinamika-olvasasa.jpg"), true);
  assert.equal(isBlogCoverImage("/blog-covers/abc.png"), true);
  assert.equal(isBlogCoverImage("/blog-covers/a-b-c.webp"), true);
});

test("kulso URL, konyvtar-kilepes es rossz formatum elbukik", () => {
  assert.equal(isBlogCoverImage("https://evil.example/kep.jpg"), false);
  assert.equal(isBlogCoverImage("//evil.example/kep.jpg"), false);
  assert.equal(isBlogCoverImage("/blog-covers/../../etc/passwd"), false);
  assert.equal(isBlogCoverImage("/blog-covers/kep.svg"), false);
  assert.equal(isBlogCoverImage("/public/blog-covers/kep.jpg"), false);
  assert.equal(isBlogCoverImage("javascript:alert(1)"), false);
  assert.equal(isBlogCoverImage("/blog-covers/Kep.JPG"), false);
  assert.equal(isBlogCoverImage(undefined), false);
  assert.equal(isBlogCoverImage(42), false);
});

// ── Formátum-felismerés ───────────────────────────────────────────────
//
// A kiterjesztés a feltöltő állítása, a bájtok a bizonyíték: egy .jpg-re
// átnevezett SVG a saját domainünkről kiszolgált, tetszőleges tartalom lenne.

test("a valodi kepformatumokat a bajtokbol ismerjuk fel", () => {
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(16),
  ]);
  const webp = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0, 0, 0, 0]),
    Buffer.from("WEBP", "ascii"),
    Buffer.alloc(16),
  ]);

  assert.equal(sniffCoverExtension(jpg), "jpg");
  assert.equal(sniffCoverExtension(png), "png");
  assert.equal(sniffCoverExtension(webp), "webp");
});

test("az atnevezett SVG es a szemet nem megy at", () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>', "utf-8");
  assert.equal(sniffCoverExtension(svg), null);
  assert.equal(sniffCoverExtension(Buffer.from("nem kep, csak szoveg", "utf-8")), null);
  assert.equal(sniffCoverExtension(Buffer.alloc(4)), null);
  // RIFF-konténer, de nem WebP (pl. WAV) — a második jelzést is nézzük.
  assert.equal(
    sniffCoverExtension(
      Buffer.concat([Buffer.from("RIFF", "ascii"), Buffer.alloc(4), Buffer.from("WAVE", "ascii")]),
    ),
    null,
  );
});
