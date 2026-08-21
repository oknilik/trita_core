import test from "node:test";
import assert from "node:assert/strict";
import {
  NEWSLETTER_SOURCES,
  blogImageUrl,
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
    "https://trita.io/blog/egy-cikk/opengraph-image",
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
