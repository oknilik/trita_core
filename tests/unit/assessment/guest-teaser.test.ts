import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeGuestTeaserScores,
  type TeaserScoringMetaItem,
} from "@/lib/guest-teaser";

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

  it("holtversenynél a rangsor kód szerint stabil", () => {
    const result = computeGuestTeaserScores(META, { 1: 4, 2: 2, 3: 4, 4: 4 });
    assert.ok(result);
    assert.equal(result.dimensions.TEMP, result.dimensions.OPEN);
    assert.deepEqual(
      result.ranked.map((r) => r.code),
      ["OPEN", "TEMP"],
    );
  });
});
