import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeGuestTeaserScores,
  type TeaserScoringMetaItem,
} from "@/lib/guest-teaser";
import {
  resolvePersonalityTypeFromScores,
  resolvePersonalityTypeLabel,
} from "@/lib/personality-type";
import { rankDimensionScores, TRITAN_ORDER } from "@/lib/tritan";

const META: TeaserScoringMetaItem[] = [
  { id: 1, dimension: "TEMP", reversed: false },
  { id: 2, dimension: "TEMP", reversed: true },
  { id: 3, dimension: "OPEN", reversed: false },
  { id: 4, dimension: "OPEN", reversed: false },
];

describe("computeGuestTeaserScores", () => {
  it("a scoring.ts Likert-formuláját követi (fordított item 6−v, ((átlag−1)/4)×100)", () => {
    // TEMP: item1=5, item2 fordított 2→4 → átlag 4.5 → 87.5 → 88
    // OPEN: 3 és 4 → átlag 3.5 → 62.5 → 63
    const result = computeGuestTeaserScores(META, { 1: 5, 2: 2, 3: 3, 4: 4 });
    assert.ok(result);
    assert.equal(result.dimensions.TEMP, 88);
    assert.equal(result.dimensions.OPEN, 63);
    assert.deepEqual(
      result.ranked.map((r) => r.code),
      ["TEMP", "OPEN"],
    );
  });

  it("hiányzó válasznál null (a záróoldal teaser nélkül renderel)", () => {
    assert.equal(computeGuestTeaserScores(META, { 1: 5, 2: 2, 3: 3 }), null);
    assert.equal(computeGuestTeaserScores(META, null), null);
    assert.equal(computeGuestTeaserScores(META, undefined), null);
  });

  it("érvénytelen (skálán kívüli / nem szám) értéknél null", () => {
    assert.equal(computeGuestTeaserScores(META, { 1: 5, 2: 2, 3: 3, 4: 0 }), null);
    assert.equal(computeGuestTeaserScores(META, { 1: 5, 2: 2, 3: 3, 4: 6 }), null);
    assert.equal(
      computeGuestTeaserScores(META, { 1: 5, 2: 2, 3: 3, 4: Number.NaN }),
      null,
    );
  });

  it("a meta-n kívüli (stale) válaszokat figyelmen kívül hagyja", () => {
    const result = computeGuestTeaserScores(META, { 1: 3, 2: 3, 3: 3, 4: 3, 999: 5 });
    assert.ok(result);
    assert.equal(Object.keys(result.dimensions).length, 2);
    assert.equal(result.dimensions.TEMP, 50);
  });

  it("a kiegészítő Altruizmus (I) skálát a KIMENETBŐL is kizárja", () => {
    // Az `I` (Altruizmus) skála a teljes kérdésbankban szerepel; ha a vendég
    // erősen helyesli, a naiv rangsorban a top-2-be kerülne → a
    // TryCompleteClient primary/secondary-je „I" lenne, üres glyphhel.
    // A rövid forma 2026-08-11 óta nem szolgál ki altruizmus-itemet, de egy
    // RÉGI vendég-draft (localStorage) még hordozhatja őket.
    const metaWithAltruism: TeaserScoringMetaItem[] = [
      { id: 1, dimension: "I", reversed: false },
      { id: 2, dimension: "I", reversed: false },
      { id: 3, dimension: "TEMP", reversed: false },
      { id: 4, dimension: "OPEN", reversed: false },
      { id: 5, dimension: "INTE", reversed: false },
    ];
    // I: 5,5 → 100 (a legmagasabb) · INTE: 4 → 75 · TEMP: 3 → 50 · OPEN: 2 → 25
    const result = computeGuestTeaserScores(metaWithAltruism, {
      1: 5, 2: 5, 3: 3, 4: 2, 5: 4,
    });
    assert.ok(result);
    // Az exportált alak őszinte: az `I` sem a dimensions mapben, sem a
    // rangsorban nem jelenik meg (korábban a dimensions hordozta, és csak a
    // ranked szűrte — egy sehol meg nem jelenített „hetedik dimenzió").
    assert.equal("I" in result.dimensions, false);
    assert.ok(!result.ranked.some((r) => r.code === "I"));
    // Minden ranked kód a hat kanonikus dimenzió egyike → ismert glyph/címke.
    const knownCodes = new Set<string>(TRITAN_ORDER);
    for (const entry of result.ranked) {
      assert.ok(knownCodes.has(entry.code), `ismeretlen ranked kód: ${entry.code}`);
    }
    // A top-2 a valódi dimenziókból jön (I nélkül): INTE(75) > TEMP(50).
    assert.deepEqual(
      result.ranked.slice(0, 2).map((r) => r.code),
      ["INTE", "TEMP"],
    );
  });

  it("holtversenynél a kanonikus sorrend (TRITAN_ORDER) dönt", () => {
    const result = computeGuestTeaserScores(META, { 1: 4, 2: 2, 3: 4, 4: 4 });
    assert.ok(result);
    assert.equal(result.dimensions.TEMP, result.dimensions.OPEN);
    // TEMP a TRITAN_ORDER-ben megelőzi az OPEN-t.
    assert.deepEqual(
      result.ranked.map((r) => r.code),
      ["TEMP", "OPEN"],
    );
  });

  it("azonos pontszámokra a teaser és a personality-type út top-2-je azonos", () => {
    // Mind a hat dimenzió holtversenyben — a claim utáni archetípus nem
    // „nevezhető át" a regisztrációval.
    const fullMeta: TeaserScoringMetaItem[] = [
      { id: 1, dimension: "OPEN", reversed: false },
      { id: 2, dimension: "THOR", reversed: false },
      { id: 3, dimension: "ADAP", reversed: false },
      { id: 4, dimension: "TEMP", reversed: false },
      { id: 5, dimension: "RESO", reversed: false },
      { id: 6, dimension: "INTE", reversed: false },
    ];
    const result = computeGuestTeaserScores(fullMeta, {
      1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3,
    });
    assert.ok(result);
    const teaserTop2 = result.ranked.slice(0, 2).map((r) => r.code);
    assert.deepEqual(teaserTop2, ["INTE", "RESO"]);

    // A belépett út kevert bemeneti sorrendből is ugyanazt a top-2-t adja.
    const shuffled = [
      { code: "OPEN", score: 50 },
      { code: "TEMP", score: 50 },
      { code: "INTE", score: 50 },
      { code: "THOR", score: 50 },
      { code: "RESO", score: 50 },
      { code: "ADAP", score: 50 },
    ];
    assert.deepEqual(
      rankDimensionScores(shuffled).slice(0, 2).map((d) => d.code),
      teaserTop2,
    );
    // Teljes holtversenyben a melléknév bizonytalan (2-3. helyezett a mérési
    // hibán belül) → mindkét út főnév-only címkét ad, és mivel a teaser is a
    // közös resolvert hívja (TryCompleteClient), nem térhetnek el.
    const teaserLabel = resolvePersonalityTypeFromScores(result.ranked, "hu");
    assert.equal(teaserLabel, "Értékőr");
    assert.equal(resolvePersonalityTypeFromScores(shuffled, "hu"), teaserLabel);
    // A teljes (melléknév+főnév) címke ilyenkor NEM megy ki.
    assert.notEqual(
      teaserLabel,
      resolvePersonalityTypeLabel(teaserTop2[0], teaserTop2[1], "hu"),
    );
  });
});
