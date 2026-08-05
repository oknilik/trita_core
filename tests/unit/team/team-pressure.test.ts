import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeTeamPressure,
  TEAM_PRESSURE_CONTENT,
  PRESSURE_MAX_FINDINGS,
} from "@/lib/team-pressure";
import type { TritanDimCode } from "@/lib/tritan";

const DIMS: TritanDimCode[] = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"];

function member(overrides: Partial<Record<TritanDimCode, number>>) {
  const scores = Object.fromEntries(DIMS.map((d) => [d, 50])) as Record<
    TritanDimCode,
    number
  >;
  return { scores: { ...scores, ...overrides } };
}

describe("TEAM_PRESSURE_CONTENT — tartalmi teljesség", () => {
  it("mind a 6 dimenzióra, mindkét pólusra, mindkét nyelven van tartalom", () => {
    for (const dim of DIMS) {
      for (const pole of ["high", "low"] as const) {
        const text = TEAM_PRESSURE_CONTENT[dim][pole];
        assert.ok(text.hu.length > 40, `${dim}/${pole} hu túl rövid`);
        assert.ok(text.en.length > 40, `${dim}/${pole} en túl rövid`);
      }
    }
  });

  it("hipotézis-nyelv: nincs abszolutizáló kijelentés a magyar szövegekben", () => {
    for (const dim of DIMS) {
      for (const pole of ["high", "low"] as const) {
        const hu = TEAM_PRESSURE_CONTENT[dim][pole].hu;
        assert.ok(
          !/\bmindig\b|\bsoha\b|\bgarantáltan\b|\bbiztosan\b/i.test(hu),
          `${dim}/${pole}: abszolutizáló kifejezés a szövegben`,
        );
      }
    }
  });
});

describe("computeTeamPressure — pólus-koncentrációk", () => {
  it("az értékelt tagok felénél kisebb koncentrációt nem emel ki", () => {
    const result = computeTeamPressure([
      member({ THOR: 80 }),
      member({}),
      member({}),
      member({}),
    ]);
    assert.deepEqual(result, []);
  });

  it("≥50% + ≥2 fő azonos póluson → kiemelés a helyes darabszámmal", () => {
    const result = computeTeamPressure([
      member({ THOR: 80 }),
      member({ THOR: 70 }),
      member({ THOR: 40 }),
    ]);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      dim: "THOR",
      pole: "high",
      count: 2,
      assessedCount: 3,
    });
  });

  it("alacsony pólust is felismer (≤35)", () => {
    const result = computeTeamPressure([
      member({ ADAP: 20 }),
      member({ ADAP: 30 }),
      member({ ADAP: 60 }),
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].dim, "ADAP");
    assert.equal(result[0].pole, "low");
  });

  it("legfeljebb 3 találat, a legerősebb arány szerint rendezve", () => {
    const strong = { THOR: 80, ADAP: 80, TEMP: 20, OPEN: 20 } as const;
    const result = computeTeamPressure([
      member(strong),
      member(strong),
      member(strong),
      member({ THOR: 70 }),
    ]);
    assert.equal(result.length, PRESSURE_MAX_FINDINGS);
    // THOR 4/4 = 100% az első; a 3/4-esek (75%) közül kód szerint stabil sorrend
    assert.equal(result[0].dim, "THOR");
    assert.deepEqual(
      result.slice(1).map((r) => r.dim),
      ["ADAP", "OPEN"],
    );
  });

  it("egyetlen fős 'koncentrációt' (kis csapat, 1 kitöltő) nem emel ki", () => {
    assert.deepEqual(computeTeamPressure([member({ THOR: 90 })]), []);
    assert.deepEqual(computeTeamPressure([]), []);
  });

  it("null scores tagokat kihagyja a nevezőből", () => {
    const result = computeTeamPressure([
      member({ OPEN: 80 }),
      member({ OPEN: 70 }),
      { scores: null },
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].assessedCount, 2);
  });
});
