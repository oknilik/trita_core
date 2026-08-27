import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveGlyphPair, DIMENSION_GLYPHS } from "@/lib/type-glyph";
import { rankDimensionScores } from "@/lib/hexaco";

// interp S2: a típus-ÁBRA (resolveGlyphPair) és a típus-CÍMKE
// (resolvePersonalityTypeFromScores) korábban különböző rangsort futtatott —
// az ábra nyers `.sort`-tal, ami holtversenynél a bemenet sorrendjétől függött,
// a címke a determinisztikus rankDimensionScores-szal (HEXACO_ORDER tie-break).
// Így azonos top-2 pontszámnál a rajzolt jel és a felirat ELTÉRHETETT. A fix
// után mindkettő a KÖZÖS rankDimensionScores-t használja → mindig egyeznek.

const dims = (scores: Record<string, number>) =>
  Object.entries(scores).map(([code, score]) => ({ code, score }));

describe("resolveGlyphPair – interp S2: ábra és címke azonos top-2", () => {
  it("holtversenynél a HEXACO_ORDER dönt, nem a bemenet sorrendje", () => {
    // H és O a csúcson holtversenyben; a bemenet O-t adja előbb.
    const scores = dims({ O: 70, H: 70, X: 40, C: 30, A: 20, E: 10 });
    const pair = resolveGlyphPair(scores);
    // HEXACO_ORDER: H előbb, mint O → H a domináns (forma), O a motívum.
    assert.equal(pair?.primaryCode, "H");
    assert.equal(pair?.secondaryCode, "O");
  });

  it("az ábra top-2-je a KÖZÖS rangsor első két eleme (S2 invariáns)", () => {
    // Ez az S2 lényege: az ábra és a címke UGYANAZT a rangsort (rankDimensionScores)
    // futtatja, így a top-2 PÁR mindig egyezik. (A címke SZÖVEGE ettől függetlenül
    // rövidülhet főnév-only-ra, ha a top-pár a mérési hibán belül van — az az
    // interp S3 bizonytalanság-kapu, más tengely; a PÁR akkor is azonos.)
    const scores = dims({ O: 82, X: 66, C: 40, H: 30, A: 20, E: 10 });
    const pair = resolveGlyphPair(scores);
    assert.ok(pair);
    const ranked = rankDimensionScores(scores.filter((d) => DIMENSION_GLYPHS[d.code]));
    assert.equal(pair.primaryCode, ranked[0].code);
    assert.equal(pair.secondaryCode, ranked[1].code);
  });

  it("holtversenyes top-pár: az ábra determinisztikus párt ad (a rangsor első kettője)", () => {
    // Két legerősebb egy SEM-en belül (H 70 = O 70): az ábra a
    // determinisztikus rangsor első kettőjét rajzolja (H forma + O
    // motívum), input-sorrendtől függetlenül. (A címke SZÖVEGE ilyenkor az
    // interp S3 bizonytalanság-kapu miatt főnév-only lehet — az más tengely,
    // a personality-type.ts saját tesztje fedi.)
    const scores = dims({ O: 70, H: 70, X: 40, C: 30, A: 20, E: 10 });
    const ranked = rankDimensionScores(scores.filter((d) => DIMENSION_GLYPHS[d.code]));
    const pair = resolveGlyphPair(scores);
    assert.equal(pair?.primaryCode, ranked[0].code);
    assert.equal(pair?.secondaryCode, ranked[1].code);
  });

  it("input-sorrend független: fordított bemenet is ugyanazt a párt adja", () => {
    const a = resolveGlyphPair(
      dims({ H: 70, O: 70, X: 40, C: 30, A: 20, E: 10 }),
    );
    const b = resolveGlyphPair(
      dims({ O: 70, H: 70, E: 10, A: 20, C: 30, X: 40 }),
    );
    assert.deepEqual(
      [a?.primaryCode, a?.secondaryCode],
      [b?.primaryCode, b?.secondaryCode],
    );
  });

  it("az intersticiális 'I' skála nem lehet forma/motívum (nincs glyph-je)", () => {
    // I magas, de nem rangsorolódik — a top-2 a kanonikus dimenziókból jön.
    const pair = resolveGlyphPair(
      dims({ I: 90, O: 70, X: 60, C: 30, A: 20, E: 10, H: 5 }),
    );
    assert.equal(pair?.primaryCode, "O");
    assert.equal(pair?.secondaryCode, "X");
  });
});
