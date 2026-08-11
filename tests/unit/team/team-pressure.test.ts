import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeTeamPressure,
  TEAM_PRESSURE_CONTENT,
  TEAM_PRESSURE_POLARIZED_TEXT,
  PRESSURE_MAX_FINDINGS,
} from "@/lib/team-pressure";
import type { HexacoCode } from "@/lib/hexaco";

const DIMS: HexacoCode[] = ["H", "E", "X", "A", "C", "O"];

function member(overrides: Partial<Record<HexacoCode, number>>) {
  const scores = Object.fromEntries(DIMS.map((d) => [d, 50])) as Record<
    HexacoCode,
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
      member({ C: 80 }),
      member({}),
      member({}),
      member({}),
    ]);
    assert.deepEqual(result, []);
  });

  it("≥50% + ≥2 fő azonos póluson → kiemelés a helyes darabszámmal", () => {
    const result = computeTeamPressure([
      member({ C: 80 }),
      member({ C: 70 }),
      member({ C: 40 }),
    ]);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      dim: "C",
      pole: "high",
      count: 2,
      assessedCount: 3,
    });
  });

  it("alacsony pólust is felismer (<35)", () => {
    const result = computeTeamPressure([
      member({ A: 20 }),
      member({ A: 30 }),
      member({ A: 60 }),
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].dim, "A");
    assert.equal(result[0].pole, "low");
  });

  it("legfeljebb 3 találat, a legerősebb arány szerint rendezve", () => {
    const strong = { C: 80, A: 80, X: 20, O: 20 } as const;
    const result = computeTeamPressure([
      member(strong),
      member(strong),
      member(strong),
      member({ C: 70 }),
    ]);
    assert.equal(result.length, PRESSURE_MAX_FINDINGS);
    // C 4/4 = 100% az első; a 3/4-esek (75%) közül kód szerint stabil sorrend
    assert.equal(result[0].dim, "C");
    assert.deepEqual(
      result.slice(1).map((r) => r.dim),
      ["A", "O"],
    );
  });

  it("egyetlen fős 'koncentrációt' (kis csapat, 1 kitöltő) nem emel ki", () => {
    assert.deepEqual(computeTeamPressure([member({ C: 90 })]), []);
    assert.deepEqual(computeTeamPressure([]), []);
  });

  it("kettőspólus: mindkét pólus küszöb felett → EGY polarizált találat", () => {
    const result = computeTeamPressure([
      member({ C: 80 }),
      member({ C: 70 }),
      member({ C: 20 }),
      member({ C: 30 }),
    ]);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      dim: "C",
      pole: "polarized",
      count: 4,
      assessedCount: 4,
    });
  });

  it("kettőspólus csak akkor, ha MINDKÉT pólus önállóan is teljesíti a küszöböt", () => {
    // 1 fő az alacsony póluson (< PRESSURE_MIN_COUNT) → sima high találat marad
    const result = computeTeamPressure([
      member({ C: 80 }),
      member({ C: 70 }),
      member({ C: 20 }),
      member({ C: 50 }),
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
      member({ C: 80 }),
      member({ C: 75 }),
      member({ C: 70 }),
      member({ C: 20 }),
      member({ C: 30 }),
    ]);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      dim: "C",
      pole: "high",
      count: 3,
      assessedCount: 5,
    });
  });

  it("a pontosan küszöbön álló érték (65/35) nem pólus-tag — a profile-engine categorize vágásával azonos", () => {
    // Egyénileg a 65 „medium" (categorize: > 65 a high) — a csapat-nyomás
    // korábban ≥ 65-tel már magas-pólusú koncentráció-tagnak számolta.
    const result = computeTeamPressure([
      member({ C: 65, A: 35 }),
      member({ C: 65, A: 35 }),
      member({}),
    ]);
    assert.deepEqual(result, []);
  });

  it("null scores tagokat kihagyja a nevezőből", () => {
    const result = computeTeamPressure([
      member({ O: 80 }),
      member({ O: 70 }),
      { scores: null },
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].assessedCount, 2);
  });
});
