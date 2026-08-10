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
import { aggregateFamilyFits, familiesAreDistinguishable } from "@/lib/career/family-fit";
import { computeCareerFit } from "@/lib/career/engine";
import type { OccupationFit } from "@/lib/career/types";

const balancedDims = { INTE: 55, RESO: 50, TEMP: 55, ADAP: 55, THOR: 60, OPEN: 60 };

/** Minimális OccupationFit az aggregálás izolált teszteléséhez. */
function makeFit(id: string, family: string, rank: number, rankSe = 4): OccupationFit {
  return {
    id,
    hu: id,
    feor: null,
    isco: "7212",
    tier: 1,
    entry: "vocational",
    family,
    demandFit: rank,
    se: rankSe,
    band: { low: rank - rankSe, high: rank + rankSe },
    rankSe,
    components: [],
    absoluteFit: rank,
    interest: null,
    preference: null,
    feasibility: { gap: "ready", ready: true, fieldMatch: null, state: "level-only", licence: false },
    rank,
    orderedBy: "composite",
    choiceScore: null,
    flags: [],
  };
}

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

// ── családszintű illeszkedés (a tényleges számítás) ─────────────────────────

test("a motor családszintű illeszkedést is ad, rendezve", () => {
  const result = computeCareerFit({
    dims: { INTE: 70, RESO: 40, TEMP: 60, ADAP: 55, THOR: 75, OPEN: 65 },
    form: "short",
  });
  assert.ok(result.families.length > 5, `túl kevés család: ${result.families.length}`);
  for (let i = 1; i < result.families.length; i += 1) {
    assert.ok(
      result.families[i - 1].fit >= result.families[i].fit,
      "a családok nincsenek csökkenő sorrendben",
    );
  }
  for (const family of result.families) {
    assert.ok(getCareerFamily(family.key), `ismeretlen család: ${family.key}`);
    assert.ok(family.fit >= 0 && family.fit <= 100, `${family.key}: sávon kívüli fit`);
    assert.ok(family.top.length > 0, `${family.key}: nincs top-tag`);
    assert.ok(family.band.low <= family.fit && family.fit <= family.band.high);
    // A top-tagok mind ehhez a családhoz tartoznak
    for (const member of family.top) assert.equal(member.family, family.key);
  }
});

test("a család pontszáma a legjobb tagjaiból számol, nem az összesből", () => {
  // Szintetikus halmaz, hogy a két átlag TÉNYLEGESEN eltérjen: 9 tag,
  // az elsők jók, a többi gyenge. Top-K = ceil(9/3) = 3 → a fit a 90/80/70
  // átlaga (80), az ÖSSZES tag átlaga viszont 44.
  const ranks = [90, 80, 70, 40, 40, 30, 20, 20, 10];
  const fits = ranks.map((rank, i) => makeFit(`o${i}`, "gyartas", rank));
  const [family] = aggregateFamilyFits(fits);

  assert.equal(family.key, "gyartas");
  assert.equal(family.scored, 9);
  assert.equal(family.top.length, 3, "top-K = ceil(n/3)");
  assert.equal(family.fit, 80, "a fit a legjobb 3 átlaga");

  const allMean = Math.round(ranks.reduce((s, r) => s + r, 0) / ranks.length);
  assert.ok(family.fit > allMean, `a fit (${family.fit}) nem tér el az összátlagtól (${allMean})`);
});

test("a top-halmaz felső korlátja 8, nagy családnál is", () => {
  const fits = Array.from({ length: 60 }, (_, i) => makeFit(`o${i}`, "gyartas", 100 - i));
  const [family] = aggregateFamilyFits(fits);
  assert.equal(family.top.length, 8, "ceil(60/3) = 20 lenne, de a korlát 8");
});

test("az erősen korrelált tagok miatt a hibasáv NEM szűkül a tagszámmal", () => {
  // Ha gyök(k)-val osztanánk (független minták feltevése), 4 tagnál a
  // hibasáv feleződne. Konzervatívan a tagok hibájának átlagát vesszük.
  const fits = [10, 9, 8, 7].map((n, i) => makeFit(`o${i}`, "gyartas", 80 + n, 6));
  const [family] = aggregateFamilyFits(fits);
  assert.equal(family.se, 6, "a családszintű SE a tagok SE-jének átlaga");
});

test("a kis családok jelölve vannak, a nagyok nem", () => {
  const result = computeCareerFit({ dims: balancedDims, form: "short" });
  for (const family of result.families) {
    assert.equal(
      family.small,
      family.size < SMALL_FAMILY_THRESHOLD,
      `${family.key}: rossz kis-család jelölés (size=${family.size})`,
    );
  }
});

test("a megkülönböztethetőség a mérési hibához méri a különbséget", () => {
  const a = { fit: 70, se: 4 } as ReturnType<typeof aggregateFamilyFits>[number];
  const b = { fit: 62, se: 4 } as ReturnType<typeof aggregateFamilyFits>[number];
  const c = { fit: 68, se: 4 } as ReturnType<typeof aggregateFamilyFits>[number];
  assert.equal(familiesAreDistinguishable(a, b), true);
  assert.equal(familiesAreDistinguishable(a, c), false);
});
