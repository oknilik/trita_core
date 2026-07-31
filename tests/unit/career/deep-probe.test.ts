import test from "node:test";
import assert from "node:assert/strict";
import {
  CAREER_PROBE_KIND,
  CAREER_PROBE_STEPS,
  CAREER_PROBE_PRICE_HUF,
  CAREER_PROBE_PRICE_VERSION,
  isCareerProbeStep,
} from "@/lib/career/deep-probe";

// Kereslet-mérés (painted door) szerződése.
//
// A mérés akkor ér valamit, ha a három fok stabil és megkülönböztethető: ha
// egy lépés-kulcs elcsúszik, a tölcsér némán rossz arányt mutat — és a
// döntés, hogy megépüljön-e a funkció, hibás számon állna.

test("a tölcsér három foka rögzített és egyedi", () => {
  assert.deepEqual([...CAREER_PROBE_STEPS], ["cta_view", "page_view", "choice"]);
  assert.equal(new Set(CAREER_PROBE_STEPS).size, CAREER_PROBE_STEPS.length);
});

test("a lépés-felismerés csak a katalógusra igaz", () => {
  for (const step of CAREER_PROBE_STEPS) {
    assert.equal(isCareerProbeStep(step), true);
  }
  assert.equal(isCareerProbeStep("purchase"), false);
  assert.equal(isCareerProbeStep(""), false);
});

test("a tárolási kulcs nem ütközik a többi visszajelzés-típussal", () => {
  // A Feedback tábla egyetlen `kind` mezőn osztozik: ha egybeesne, a
  // kereslet-mérés sorai beleszámítanának pl. az elégedettségi átlagba.
  for (const other of ["satisfaction", "dimension", "role_fit", "feature_interest"]) {
    assert.notEqual(CAREER_PROBE_KIND, other);
  }
});

test("az ár és a hozzá tartozó verzió-jelölés együtt mozog", () => {
  // A válaszok mellé mentett verzió teszi elkülöníthetővé a két mintát, ha
  // az ár változik. Ha a szám módosul, ezt a tesztet is át kell írni — ez a
  // szándék: az árváltás tudatos döntés legyen, ne mellékhatás.
  assert.equal(CAREER_PROBE_PRICE_HUF, 9900);
  assert.match(CAREER_PROBE_PRICE_VERSION, /9900/);
});
