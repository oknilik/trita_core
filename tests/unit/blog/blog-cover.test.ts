import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { blogCoverFocalPoint, isBlogCoverImage, isOwnedBlogCover } from "@/lib/blog";
import { optimizeBlogCover, sniffCoverExtension } from "@/lib/blog-cover-format";

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

test("a fokuszpont csak a 0-100 tartomanyban ervenyes", () => {
  assert.equal(blogCoverFocalPoint(0), 0);
  assert.equal(blogCoverFocalPoint(46), 46);
  assert.equal(blogCoverFocalPoint(100), 100);
  assert.equal(blogCoverFocalPoint(-1), undefined);
  assert.equal(blogCoverFocalPoint(101), undefined);
  assert.equal(blogCoverFocalPoint("50"), undefined);
  // Kézzel írt frontmatter törtszáma: a mentő séma egészet vár, ezért kerekítünk.
  assert.equal(blogCoverFocalPoint(46.4), 46);
  assert.equal(blogCoverFocalPoint(99.7), 100);
});

// ── Takarítás: melyik fájl tartozik a cikkhez ─────────────────────────
//
// A cikk törlése/borítócseréje csak a hozzá GENERÁLT fájlt viheti el. Puszta
// prefix-egyezés kevés: a slugok között van prefix-viszony, a HU–EN párok
// pedig kézzel felvett, közös illusztráción osztozhatnak.

test("csak a slughoz generalt boritot ismerjuk sajatnak", () => {
  assert.equal(isOwnedBlogCover("/blog-covers/hexaco-vs-mbti-0123456789.webp", "hexaco-vs-mbti"), true);
  // Másik cikk generált borítója, aminek a slugja prefixként tartalmazza az enyémet.
  assert.equal(
    isOwnedBlogCover("/blog-covers/hexaco-vs-mbti-why-it-matters-0123456789.webp", "hexaco-vs-mbti"),
    false,
  );
  // Kézzel felvett, HU–EN páron megosztott illusztráció.
  assert.equal(isOwnedBlogCover("/blog-covers/hexaco-vs-mbti-illustrated.webp", "hexaco-vs-mbti"), false);
  assert.equal(isOwnedBlogCover("/blog-covers/hexaco-vs-mbti-0123456789.png", "hexaco-vs-mbti"), false);
  assert.equal(isOwnedBlogCover(undefined, "hexaco-vs-mbti"), false);
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

test("a feltoltott borito normalizalt, meretezett WebP lesz", async () => {
  const source = await sharp({
    create: { width: 1800, height: 1000, channels: 3, background: "#e8dec9" },
  }).png().toBuffer();

  const result = await optimizeBlogCover(source);

  assert.equal(result.width, 1600);
  assert.equal(result.height, 889);
  assert.equal(sniffCoverExtension(result.bytes), "webp");
});

test("a tul kicsi es rossz aranyu kep elbukik", async () => {
  const small = await sharp({
    create: { width: 800, height: 500, channels: 3, background: "#e8dec9" },
  }).png().toBuffer();
  const portrait = await sharp({
    create: { width: 1200, height: 1200, channels: 3, background: "#e8dec9" },
  }).png().toBuffer();

  await assert.rejects(() => optimizeBlogCover(small), /IMAGE_TOO_SMALL/);
  await assert.rejects(() => optimizeBlogCover(portrait), /INVALID_ASPECT_RATIO/);
});
