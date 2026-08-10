import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeTeamPressure,
  TEAM_PRESSURE_CONTENT,
  TEAM_PRESSURE_POLARIZED_TEXT,
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

  it("polarizált szöveg: mindkét nyelven él, hipotézis-nyelven", () => {
    assert.ok(TEAM_PRESSURE_POLARIZED_TEXT.hu.length > 40);
    assert.ok(TEAM_PRESSURE_POLARIZED_TEXT.en.length > 40);
    assert.ok(
      !/\bmindig\b|\bsoha\b|\bgarantáltan\b|\bbiztosan\b/i.test(
        TEAM_PRESSURE_POLARIZED_TEXT.hu,
      ),
    );
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

  it("kettőspólus: mindkét pólus küszöb felett → EGY polarizált találat", () => {
    const result = computeTeamPressure([
      member({ THOR: 80 }),
      member({ THOR: 70 }),
      member({ THOR: 20 }),
      member({ THOR: 30 }),
    ]);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      dim: "THOR",
      pole: "polarized",
      count: 4,
      assessedCount: 4,
    });
  });

  it("kettőspólus csak akkor, ha MINDKÉT pólus önállóan is teljesíti a küszöböt", () => {
    // 1 fő az alacsony póluson (< PRESSURE_MIN_COUNT) → sima high találat marad
    const result = computeTeamPressure([
      member({ THOR: 80 }),
      member({ THOR: 70 }),
      member({ THOR: 20 }),
      member({ THOR: 50 }),
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].pole, "high");
    assert.equal(result[0].count, 2);
  });

  it("páratlan létszámú kétpólusú csapat: a kisebbik pólus a share-küszöb alatt marad → egyoldalú találat (szándékos szűk definíció)", () => {
    // 5 főből 3 magas + 2 alacsony: a low pólus eléri a MIN_COUNT-ot, de a
    // 2/5 arány a küszöb alatt van — a polarizált címke csak akkor jár, ha
    // MINDKÉT pólus önállóan koncentráció (gyakorlatban páros, 50–50-es
    // megoszlás, üres középsávval).
    const result = computeTeamPressure([
      member({ THOR: 80 }),
      member({ THOR: 75 }),
      member({ THOR: 70 }),
      member({ THOR: 20 }),
      member({ THOR: 30 }),
    ]);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      dim: "THOR",
      pole: "high",
      count: 3,
      assessedCount: 5,
    });
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
