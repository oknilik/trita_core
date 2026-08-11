import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mean, sampleStdDev } from "@/lib/stats/dimension-stats";

describe("mean", () => {
  it("üres tömbre 0", () => {
    assert.equal(mean([]), 0);
  });

  it("átlagot ad", () => {
    assert.equal(mean([2, 4, 6]), 4);
    assert.equal(mean([10]), 10);
  });
});

describe("sampleStdDev — Bessel-korrekció (÷(n−1))", () => {
  it("n < 2 → 0", () => {
    assert.equal(sampleStdDev([]), 0);
    assert.equal(sampleStdDev([42]), 0);
  });

  it("azonos értékeknél 0 (nincs szóródás)", () => {
    assert.equal(sampleStdDev([10, 10, 10, 10]), 0);
  });

  it("÷(n−1)-gyel számol, nem ÷n-nel", () => {
    // [2,4,6]: átlag 4, eltérésnégyzet-összeg 8. Minta: 8/(3−1)=4 → 2.
    // Populációs (÷n) 8/3 ≈ 2.67 → 1.63 lenne — a torzított becslő.
    assert.equal(sampleStdDev([2, 4, 6]), 2);
  });

  it("a minta-becslő nagyobb, mint a populációs (lefelé torzított) becslő", () => {
    const values = [40, 55, 60, 75, 20];
    const n = values.length;
    const avg = values.reduce((a, b) => a + b, 0) / n;
    const ss = values.reduce((a, v) => a + (v - avg) ** 2, 0);
    const population = Math.sqrt(ss / n);
    const sample = Math.sqrt(ss / (n - 1));
    assert.ok(Math.abs(sampleStdDev(values) - sample) < 1e-9);
    assert.ok(sample > population);
  });
});
