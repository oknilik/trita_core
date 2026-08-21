import test from "node:test";
import assert from "node:assert/strict";
import {
  blogImageUrl,
  NEWSLETTER_SOURCES,
  confirmUrl,
  normalizeEmail,
  unsubscribeUrl,
  unsubscribePostUrl,
} from "@/lib/newsletter";

// A cím-normalizálás nem kozmetika: a `@unique` EBBEN az alakban áll, tehát
// ha egy írási út kihagyná, ugyanaz a feliratkozó két sorként élne — és két
// levelet kapna minden cikkről.
test("a cim normalizalasa kisbetusit es trimmel", () => {
  assert.equal(normalizeEmail("  Kata@Example.COM "), "kata@example.com");
  assert.equal(normalizeEmail("már@fent.hu"), "már@fent.hu");
});

test("a token URL-kodolva kerul a linkbe", () => {
  // A base64url ábécé nem tartalmaz `+/=` jelet, de a kódolás a védőháló:
  // egy jövőbeni token-formátum nem törheti el némán a leiratkozó linket.
  assert.equal(
    unsubscribeUrl("https://trita.io", "a+b/c="),
    "https://trita.io/newsletter/unsubscribe?token=a%2Bb%2Fc%3D",
  );
  assert.equal(
    unsubscribePostUrl("https://trita.io", "a+b/c="),
    "https://trita.io/api/newsletter/unsubscribe?token=a%2Bb%2Fc%3D",
  );
  assert.equal(
    confirmUrl("https://trita.io", "tok"),
    "https://trita.io/newsletter/confirm?token=tok",
  );
});

test("a bazis-URL zaro perjele nem duplazodik", () => {
  assert.equal(
    confirmUrl("https://trita.io///", "tok"),
    "https://trita.io/newsletter/confirm?token=tok",
  );
  assert.equal(
    blogImageUrl("https://trita.io///", "egy-cikk"),
    "https://trita.io/api/newsletter/cover/egy-cikk",
  );
});

// A forrás-értékkészletnek együtt kell mozognia a kliens-komponens
// `NewsletterFormSource` uniójával: eltérésnél a beküldés 400-zal hal el,
// és a felületen csak annyi látszik, hogy „nem sikerült a feliratkozás".
test("a forras-ertekkeszlet a beillesztesi pontokat fedi", () => {
  assert.deepEqual(
    [...NEWSLETTER_SOURCES].sort(),
    ["account", "blog_index", "blog_post", "footer", "try_complete"],
  );
});

// A levél-borító a saját, STABIL route-járól jön. A blog metadata-image útját
// a Next build-generált utótaggal szolgálja ki (`…/opengraph-image-<hash>`),
// az utótag nélküli alak 404 — abból a levélben törött kép lenne, és a
// postafiókban hónapokig ott marad. Ezt a hibát 2026-08-21-én prod buildon
// mérve találtuk meg; a teszt azért van, hogy ne térhessen vissza.
test("a level-borito a stabil hirlevel-route-rol jon, nem az OG-kepbol", () => {
  const url = new URL(blogImageUrl("https://trita.io", "csapatdinamika-olvasasa"));
  assert.equal(url.pathname, "/api/newsletter/cover/csapatdinamika-olvasasa");
  assert.ok(!url.pathname.includes("opengraph-image"));
});
