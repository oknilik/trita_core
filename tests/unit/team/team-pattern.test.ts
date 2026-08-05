import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTeamPattern,
  PATTERN_NAMES,
  type TritanScores,
} from "@/lib/team-pattern";

// Küszöbök a team-pattern.ts-ből: drive(TEMP) 55 · cohesion((ADAP+INTE)/2) 60 ·
// discipline(THOR) 62.5 · openness(OPEN) 57.5. A "high"/"low" értékek jó messze
// vannak a küszöbtől és a ±3.75-ös instabil sávtól.
const THRESHOLDS = { drive: 55, cohesion: 60, discipline: 62.5, openness: 57.5 };
const OFFSET = 20;

function scoresFor(axes: {
  drive: boolean;
  cohesion: boolean;
  discipline: boolean;
  openness: boolean;
}): TritanScores {
  const cohesionValue = THRESHOLDS.cohesion + (axes.cohesion ? OFFSET : -OFFSET);
  return {
    TEMP: THRESHOLDS.drive + (axes.drive ? OFFSET : -OFFSET),
    // cohesion = (ADAP + INTE) / 2 — azonos értékkel a cél pontosan kijön
    ADAP: cohesionValue,
    INTE: cohesionValue,
    THOR: THRESHOLDS.discipline + (axes.discipline ? OFFSET : -OFFSET),
    OPEN: THRESHOLDS.openness + (axes.openness ? OFFSET : -OFFSET),
    RESO: 50,
  };
}

function team(scores: TritanScores, size = 3) {
  return Array.from({ length: size }, (_, i) => ({
    userId: `u${i + 1}`,
    scores,
  }));
}

describe("calculateTeamPattern — mintakód és névfeloldás", () => {
  it("mind a 16 tengely-kombináció érvényes, PATTERN_NAMES-ben feloldódó kódot ad", () => {
    for (let bits = 0; bits < 16; bits++) {
      const axes = {
        drive: Boolean(bits & 8),
        cohesion: Boolean(bits & 4),
        discipline: Boolean(bits & 2),
        openness: Boolean(bits & 1),
      };
      const expectedCode =
        (axes.drive ? "E" : "R") +
        (axes.cohesion ? "C" : "V") +
        (axes.discipline ? "S" : "F") +
        (axes.openness ? "X" : "P");

      const result = calculateTeamPattern(team(scoresFor(axes)));
      assert.ok(result, `null eredmény a(z) ${expectedCode} kombinációra`);
      assert.equal(result.patternCode, expectedCode);
      assert.ok(
        PATTERN_NAMES[result.patternCode],
        `nincs PATTERN_NAMES bejegyzés: ${result.patternCode}`,
      );
      assert.notEqual(result.patternName, "Ismeretlen minta");
      assert.equal(result.patternName, PATTERN_NAMES[expectedCode].name);
      assert.ok(result.fullLabel.startsWith(result.patternName));
    }
  });

  it("a PATTERN_NAMES pontosan a 16 lehetséges kódot tartalmazza", () => {
    const expected = new Set<string>();
    for (const a of ["E", "R"]) for (const b of ["C", "V"])
      for (const c of ["S", "F"]) for (const d of ["X", "P"])
        expected.add(a + b + c + d);
    const actual = new Set(Object.keys(PATTERN_NAMES));
    assert.deepEqual(actual, expected);
  });
});

describe("calculateTeamPattern — alternatíva és stabilitás", () => {
  it("3 tag alatt null-t ad", () => {
    const scores = scoresFor({ drive: true, cohesion: true, discipline: true, openness: true });
    assert.equal(calculateTeamPattern(team(scores, 2)), null);
    assert.equal(calculateTeamPattern([]), null);
  });

  it("minden tengely egyértelmű → stabil, nincs alternatíva", () => {
    const result = calculateTeamPattern(
      team(scoresFor({ drive: true, cohesion: false, discipline: true, openness: false })),
    );
    assert.ok(result);
    assert.equal(result.stability, "stabil");
    assert.deepEqual(result.unstableAxes, []);
    assert.equal(result.alternativeCode, null);
  });

  it("küszöb-közeli tengely → közepes stabilitás + érvényes, egy pozícióban eltérő alternatíva", () => {
    const scores = scoresFor({ drive: true, cohesion: true, discipline: true, openness: true });
    // openness a küszöb fölé, de az instabil sávon (±3.75) belülre
    scores.OPEN = THRESHOLDS.openness + 2;
    const result = calculateTeamPattern(team(scores));
    assert.ok(result);
    assert.equal(result.stability, "közepes");
    assert.deepEqual(result.unstableAxes, ["openness"]);
    assert.equal(result.patternCode, "ECSX");
    assert.equal(result.alternativeCode, "ECSP");
    assert.ok(PATTERN_NAMES[result.alternativeCode!]);
    assert.equal(result.alternativeName, PATTERN_NAMES.ECSP.name);
  });

  it("két küszöb-közeli tengely → instabil", () => {
    const scores = scoresFor({ drive: true, cohesion: true, discipline: true, openness: true });
    scores.OPEN = THRESHOLDS.openness + 2;
    scores.TEMP = THRESHOLDS.drive - 1;
    const result = calculateTeamPattern(team(scores));
    assert.ok(result);
    assert.equal(result.stability, "instabil");
    assert.equal(result.unstableAxes.length, 2);
    // az alternatíva a legközelebbi tengelyt (drive, distance 1) fordítja
    assert.equal(result.patternCode, "RCSX");
    assert.equal(result.alternativeCode, "ECSX");
  });

  it("homogén, kis csapatnál a confidence-faktorok konzisztensek", () => {
    const result = calculateTeamPattern(
      team(scoresFor({ drive: false, cohesion: false, discipline: false, openness: false })),
    );
    assert.ok(result);
    assert.equal(result.confidenceFactors.sampleSize, "alacsony");
    assert.equal(result.confidenceFactors.thresholdProximity, "magas");
    assert.equal(result.confidenceFactors.patternClarity, "magas");
    // RVFP a csupa-alacsony kód — a javítás előtt egyedül ez oldódott fel
    assert.equal(result.patternCode, "RVFP");
  });
});
