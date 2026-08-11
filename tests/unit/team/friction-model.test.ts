import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALIGNED_HUB_MIN_DEGREE,
  calculatePairFriction,
  computeAlignedHubIds,
  frictionToEdgeType,
  isMeasuredDynamicsSource,
  trustToDynamicsEdge,
} from "@/lib/friction-model";

const DIMS = ["H", "E", "X", "A", "C", "O"] as const;

function profile(overrides: Partial<Record<(typeof DIMS)[number], number>> = {}) {
  const base = Object.fromEntries(DIMS.map((d) => [d, 50])) as Record<string, number>;
  return { ...base, ...overrides };
}

describe("frictionToEdgeType — sávhatárok", () => {
  it("12 alatt aligned, 12-től complementary, 22-től friction", () => {
    assert.equal(frictionToEdgeType(0), "aligned");
    assert.equal(frictionToEdgeType(11), "aligned");
    assert.equal(frictionToEdgeType(12), "complementary");
    assert.equal(frictionToEdgeType(21), "complementary");
    assert.equal(frictionToEdgeType(22), "friction");
    assert.equal(frictionToEdgeType(100), "friction");
  });
});

describe("calculatePairFriction — súlyozott eltérés", () => {
  it("azonos teljes profil → 0", () => {
    assert.equal(calculatePairFriction(profile(), profile()), 0);
  });

  it("teljes profilnál a súlyösszeg 1 — az eredmény a súlyozott átlag", () => {
    // Csak C tér el 30 ponttal: 0.30 × 30 = 9
    assert.equal(
      calculatePairFriction(profile({ C: 80 }), profile()),
      9,
    );
  });

  it("hiányzó dimenziónál a jelen lévő súlyokkal renormalizál", () => {
    // Csak C közös, 20 pontos eltérés — a renormalizált érték maga a 20
    // (a régi, nem normalizált számítás 0.3 × 20 = 6-ot, hamis "aligned"-et adna).
    assert.equal(
      calculatePairFriction({ C: 70 }, { C: 50 }),
      20,
    );
  });

  it("két közös dimenzió: a jelen lévő súlyok arányában átlagol", () => {
    // C (0.30) 20 pont + A (0.25) 20 pont → (6 + 5) / 0.55 = 20
    assert.equal(
      calculatePairFriction({ C: 70, A: 30 }, { C: 50, A: 50 }),
      20,
    );
  });

  it("szimmetrikus: a-b és b-a azonos pontszámot ad", () => {
    const a = profile({ C: 82, A: 31, E: 64 });
    const b = profile({ C: 45, O: 90 });
    assert.equal(calculatePairFriction(a, b), calculatePairFriction(b, a));
  });

  it("közös dimenzió nélkül null", () => {
    assert.equal(calculatePairFriction({ C: 70 }, { O: 40 }), null);
    assert.equal(calculatePairFriction({}, {}), null);
  });
});

describe("computeAlignedHubIds — közös hub-definíció", () => {
  const aligned = (from: string, to: string) => ({ from, to, type: "aligned" });

  it("mindkét él-végpont számít a fokszámba", () => {
    // "a" mindig from-oldalon áll — a régi (csak "to"-t számoló) definíció
    // szerint sosem lehetett hub.
    const edges = [aligned("a", "b"), aligned("a", "c"), aligned("a", "d")];
    assert.deepEqual(computeAlignedHubIds(edges), ["a"]);
  });

  it("csak az aligned élek számítanak, a küszöb alatti tag nem hub", () => {
    const edges = [
      aligned("a", "b"),
      aligned("a", "c"),
      { from: "a", to: "d", type: "friction" },
      { from: "a", to: "e", type: "complementary" },
    ];
    assert.deepEqual(computeAlignedHubIds(edges), []);
  });

  it("több tag is lehet hub egyszerre", () => {
    const edges = [
      aligned("a", "b"),
      aligned("a", "c"),
      aligned("b", "a"),
      aligned("b", "c"),
      aligned("c", "d"),
    ];
    // a: 3, b: 3, c: 3, d: 1
    assert.deepEqual(computeAlignedHubIds(edges).sort(), ["a", "b", "c"]);
  });

  it("a küszöb konstansként exportált (≥3)", () => {
    assert.equal(ALIGNED_HUB_MIN_DEGREE, 3);
  });
});

describe("trustToDynamicsEdge — mért trust-él → dinamika-él", () => {
  it("strong→aligned, moderate→complementary, weak→friction", () => {
    assert.equal(trustToDynamicsEdge("strong_trust"), "aligned");
    assert.equal(trustToDynamicsEdge("moderate"), "complementary");
    assert.equal(trustToDynamicsEdge("weak_trust"), "friction");
  });

  it("disconnected → null: a kapcsolat HIÁNYA nem súrlódás (nem rajzol élt)", () => {
    assert.equal(trustToDynamicsEdge("disconnected"), null);
  });
});

describe("isMeasuredDynamicsSource — közös mért-forrás definíció", () => {
  it("trust_round és observer MÉRT; minden más becslés", () => {
    assert.equal(isMeasuredDynamicsSource("trust_round"), true);
    assert.equal(isMeasuredDynamicsSource("observer"), true);
    assert.equal(isMeasuredDynamicsSource("profile_estimate"), false);
    assert.equal(isMeasuredDynamicsSource(null), false);
    assert.equal(isMeasuredDynamicsSource(undefined), false);
  });
});
