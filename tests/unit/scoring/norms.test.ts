import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_NORM_TABLE,
  hasNorms,
  normalCdf,
  percentileForScore,
  percentileFromNorm,
} from "@/lib/norms";

describe("norms – normál CDF (ismert értékek)", () => {
  it("Φ(0) = 0.5, Φ(±1) a standard táblázati értékek", () => {
    assert.ok(Math.abs(normalCdf(0) - 0.5) < 1e-6);
    assert.ok(Math.abs(normalCdf(1) - 0.841345) < 1e-4);
    assert.ok(Math.abs(normalCdf(-1) - 0.158655) < 1e-4);
    assert.ok(Math.abs(normalCdf(1.96) - 0.975) < 1e-3);
  });

  it("szimmetria: Φ(z) + Φ(−z) = 1", () => {
    for (const z of [0.3, 0.77, 1.5, 2.4]) {
      assert.ok(Math.abs(normalCdf(z) + normalCdf(-z) - 1) < 1e-6);
    }
  });
});

describe("norms – percentileFromNorm", () => {
  const norm = { mean: 50, sd: 10 };

  it("átlagon 50, ±1 szóráson 84 / 16", () => {
    assert.equal(percentileFromNorm(50, norm), 50);
    assert.equal(percentileFromNorm(60, norm), 84);
    assert.equal(percentileFromNorm(40, norm), 16);
  });

  it("1..99 közé vágva – 0%/100% állítás sosem megy ki", () => {
    assert.equal(percentileFromNorm(100, { mean: 50, sd: 5 }), 99);
    assert.equal(percentileFromNorm(0, { mean: 50, sd: 5 }), 1);
  });

  it("érvénytelen norma (sd <= 0) vagy nem véges pontszám → null", () => {
    assert.equal(percentileFromNorm(50, { mean: 50, sd: 0 }), null);
    assert.equal(percentileFromNorm(50, { mean: 50, sd: -1 }), null);
    assert.equal(percentileFromNorm(Number.NaN, norm), null);
  });
});

describe("norms – aktív tábla nélkül minden néma (null-ág)", () => {
  it("ma nincs aktív norma-tábla", () => {
    assert.equal(ACTIVE_NORM_TABLE, null);
    assert.equal(hasNorms(), false);
  });

  it("percentileForScore null → a felület nem renderel percentilis-sort", () => {
    assert.equal(percentileForScore("O", 72), null);
    assert.equal(percentileForScore("H", 50), null);
    assert.equal(percentileForScore("ismeretlen", 50), null);
  });
});
