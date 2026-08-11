import test from "node:test";
import assert from "node:assert/strict";
import { getOccupations } from "@/lib/career/catalog";
import {
  CAREER_FAMILIES,
  SMALL_FAMILY_THRESHOLD,
  familyDefinition,
  familyLabel,
  getCareerFamily,
} from "@/lib/career/families";
import { computeCareerFit } from "@/lib/career/engine";

const balancedDims = { INTE: 55, RESO: 50, TEMP: 55, ADAP: 55, THOR: 60, OPEN: 60 };

// A család-réteg épsége. A besorolás OFFLINE készül
// (scripts/career-catalog/step12_families.mjs) és befagyva él a katalógusban —
// ezek a tesztek azt őrzik, hogy a befagyasztott állapot ne csússzon el a
// konfigurációtól. A `family` mező ÉL: a diversify() családonkénti sapkája
// használja. Levezetés: docs/product/career-families.md
//
// A CSALÁDSZINTŰ AGGREGÁTUM (aggregateFamilyFits / CareerFitResult.families)
// 2026-08-11-én kikerült: minden futáson kiszámolt, de egyetlen felület sem
// olvasta (holt ág) — a hozzá tartozó tesztek is vele mentek. Visszaállítás:
// git history, family-fit.ts.

test("minden aktív foglalkozásnak van családja, és az létező kulcs", () => {
  const keys = new Set(CAREER_FAMILIES.map((family) => family.key));
  for (const occupation of getOccupations()) {
    assert.ok(occupation.family, `${occupation.hu}: nincs család`);
    assert.ok(
      keys.has(occupation.family as string),
      `${occupation.hu}: ismeretlen család (${occupation.family})`,
    );
  }
});

test("minden definiált család kapott legalább egy foglalkozást", () => {
  const used = new Set(getOccupations().map((occupation) => occupation.family));
  for (const family of CAREER_FAMILIES) {
    assert.ok(used.has(family.key), `${family.key}: üres család`);
  }
});

test("a horgony-foglalkozások léteznek, és a saját családjukba kerültek", () => {
  const byName = new Map(getOccupations().map((occupation) => [occupation.hu, occupation]));
  for (const family of CAREER_FAMILIES) {
    for (const anchor of family.anchors) {
      const occupation = byName.get(anchor);
      assert.ok(occupation, `${family.key}: ismeretlen horgony "${anchor}"`);
      assert.equal(
        occupation.family,
        family.key,
        `${anchor}: horgony, mégis a(z) ${occupation.family} családba került`,
      );
    }
  }
});

test("a tételesen besorolt (pinned) nevek oda kerültek, ahová kell", () => {
  const byName = new Map(getOccupations().map((occupation) => [occupation.hu, occupation]));
  for (const family of CAREER_FAMILIES) {
    for (const name of family.pinned) {
      const occupation = byName.get(name);
      assert.ok(occupation, `${family.key}: ismeretlen pinned név "${name}"`);
      assert.equal(occupation.family, family.key, `${name}: nem a(z) ${family.key} családban`);
    }
  }
});

test("a család-kulcsok egyediek, és minden mező ki van töltve", () => {
  const seen = new Set<string>();
  for (const family of CAREER_FAMILIES) {
    assert.ok(!seen.has(family.key), `${family.key}: duplikált kulcs`);
    seen.add(family.key);
    for (const field of ["hu", "en", "defHu", "defEn"] as const) {
      assert.ok(family[field]?.trim(), `${family.key}: üres ${field}`);
    }
    assert.ok(family.anchors.length >= 2, `${family.key}: legalább 2 horgony kell`);
    assert.ok(family.iscoPrefix.length >= 1, `${family.key}: nincs ISCO-prefix`);
  }
});

test("a címke- és definíció-feloldás mindkét nyelven működik", () => {
  const first = CAREER_FAMILIES[0];
  assert.equal(familyLabel(first.key, "hu"), first.hu);
  assert.equal(familyLabel(first.key, "en"), first.en);
  assert.equal(familyDefinition(first.key, "hu"), first.defHu);
  assert.equal(familyLabel("nincs-ilyen", "hu"), null);
  assert.equal(familyLabel(null, "hu"), null);
  assert.equal(getCareerFamily(undefined), undefined);
});

test("a kis családok küszöbe alatti családok azonosíthatók", () => {
  const counts = new Map<string, number>();
  for (const occupation of getOccupations()) {
    counts.set(occupation.family as string, (counts.get(occupation.family as string) ?? 0) + 1);
  }
  // Nem hibát jelez: a kis családok LÉTEZHETNEK, csak halkabban kell mutatni
  // őket. A teszt azt őrzi, hogy a küszöb értelmes maradjon — ha egyszer
  // MINDEN család kicsi lenne, a családosításnak nincs értelme.
  const small = [...counts.values()].filter((n) => n < SMALL_FAMILY_THRESHOLD).length;
  assert.ok(
    small < counts.size / 2,
    `a családok több mint fele kicsi (${small}/${counts.size}) — a bontás túl finom`,
  );
});

// ── holt ág eltávolítva: a motor nem számol családszintű aggregátumot ───────

test("a motor eredménye nem hordoz családszintű aggregátumot, a rangsor ép", () => {
  const result = computeCareerFit({ dims: balancedDims, form: "short" }, { limit: 10 });
  // A `families` kulcs a holt ággal együtt tűnt el — ha visszakerül, annak
  // tudatos (felület által olvasott) döntésnek kell lennie, nem maradványnak.
  assert.equal("families" in result, false, "a families holt ág visszakerült az eredménybe");
  // A per-tétel family mező viszont él (diversify-sapka) — nem tűnhet el.
  assert.ok(result.ranked.length > 0);
  assert.ok(
    result.ranked.some((fit) => typeof fit.family === "string" && fit.family.length > 0),
    "a per-tétel family mező eltűnt — a diversify() családonkénti sapkája erre épül",
  );
});
