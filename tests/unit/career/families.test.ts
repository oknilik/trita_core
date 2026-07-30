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

// A család-réteg épsége. A besorolás OFFLINE készül
// (scripts/career-catalog/step12_families.mjs) és befagyva él a katalógusban —
// ezek a tesztek azt őrzik, hogy a befagyasztott állapot ne csússzon el a
// konfigurációtól. Levezetés: docs/product/career-families.md

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
