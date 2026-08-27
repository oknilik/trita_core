import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTeamPattern,
  patternCodeToBinaryKey,
  patternPublicName,
  PATTERN_NAMES,
  type TritanScores,
} from "@/lib/team-pattern";
import { PATTERNS, TEAM_PATTERN_EVIDENCE_STATUS } from "@/lib/pattern-data";

describe("team-pattern evidence contract", () => {
  it("értelmezési nyelvként, nem validált tipológiaként deklarálja a 16 mintát", () => {
    assert.equal(TEAM_PATTERN_EVIDENCE_STATUS.status, "interpretive_language");
    assert.equal(TEAM_PATTERN_EVIDENCE_STATUS.validatedTypology, false);
    assert.equal(TEAM_PATTERN_EVIDENCE_STATUS.calibrationUnit, "team");
    assert.match(TEAM_PATTERN_EVIDENCE_STATUS.framing.hu, /nem validált/);
    assert.match(TEAM_PATTERN_EVIDENCE_STATUS.framing.en, /not a validated/);
  });
});

// Küszöbök a team-pattern.ts-ből: drive(X) 55 · cohesion((A+H)/2) 60 ·
// discipline(C) 62.5 · openness(O) 57.5. A "high"/"low" értékek jó messze
// vannak a küszöbtől és a ±6.25-ös "balanced" (= instabil) sávtól.
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
    X: THRESHOLDS.drive + (axes.drive ? OFFSET : -OFFSET),
    // cohesion = (A + H) / 2 — azonos értékkel a cél pontosan kijön
    A: cohesionValue,
    H: cohesionValue,
    C: THRESHOLDS.discipline + (axes.discipline ? OFFSET : -OFFSET),
    O: THRESHOLDS.openness + (axes.openness ? OFFSET : -OFFSET),
    E: 50,
  };
}

function team(scores: TritanScores, size = 3) {
  return Array.from({ length: size }, (_, i) => ({
    userId: `u${i + 1}`,
    scores,
  }));
}

describe("calculateTeamPattern – mintakód és névfeloldás", () => {
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

  // Név-tábla egységesítés: a riport-név forrása a pattern-data (a /patterns
  // felfedező elsődleges címkéjével azonos név-család) – a két motor nem
  // hordozhat eltérő neveket.
  it("minden mintakód neve a pattern-data kanonikus név-táblájából oldódik fel", () => {
    for (const code of Object.keys(PATTERN_NAMES)) {
      const key = patternCodeToBinaryKey(code);
      assert.ok(key, `nem képezhető bináris kulcs: ${code}`);
      assert.ok(PATTERNS[key!], `nincs pattern-data bejegyzés: ${code} → ${key}`);
      assert.equal(PATTERN_NAMES[code].name, PATTERNS[key!].alias);
      assert.equal(patternPublicName(code), PATTERNS[key!].alias);
    }
  });

  it("patternCodeToBinaryKey: érvényes kódot képez, érvénytelenre null-t ad", () => {
    assert.equal(patternCodeToBinaryKey("ECSX"), "1111");
    assert.equal(patternCodeToBinaryKey("RVFP"), "0000");
    assert.equal(patternCodeToBinaryKey("RCFX"), "0101");
    assert.equal(patternCodeToBinaryKey("XXXX"), null);
    assert.equal(patternCodeToBinaryKey("EC"), null);
    assert.equal(patternCodeToBinaryKey(""), null);
  });
});

describe("calculateTeamPattern – alternatíva és stabilitás", () => {
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
    // openness a küszöb fölé, de a "balanced" (instabil) sávon belülre
    scores.O = THRESHOLDS.openness + 2;
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
    scores.O = THRESHOLDS.openness + 2;
    scores.X = THRESHOLDS.drive - 1;
    const result = calculateTeamPattern(team(scores));
    assert.ok(result);
    assert.equal(result.stability, "instabil");
    assert.equal(result.unstableAxes.length, 2);
    // az alternatíva a legközelebbi tengelyt (drive, distance 1) fordítja
    assert.equal(result.patternCode, "RCSX");
    assert.equal(result.alternativeCode, "ECSX");
  });

  it("a 'balanced' fokozatú tengely instabilnak számít – a fokozat, a betű és a jegyzet egyet mond", () => {
    // A korábbi hibás zóna: distance 5 a BALANCED_BAND-en (6.25) BELÜL, de a
    // régi külön stabilitás-küszöbön (3.75) KÍVÜL volt – a tengely fokozata
    // "balanced" lett, mégis „stabil" minősítés + „minden tengely egyértelműen
    // egy pólus felé hajlik" jegyzet készült hozzá.
    const scores = scoresFor({ drive: true, cohesion: true, discipline: true, openness: true });
    scores.O = THRESHOLDS.openness + 5;
    const result = calculateTeamPattern(team(scores));
    assert.ok(result);
    assert.equal(result.axes.openness.grade, "balanced");
    assert.deepEqual(result.unstableAxes, ["openness"]);
    assert.notEqual(result.stability, "stabil");
    assert.ok(!result.stabilityNote.includes("minden tengely egyértelműen"));
    // A pólus-betű a kódban továbbra is kiosztódik, de az alternatíva jelzi a
    // bizonytalanságot: ugyanaz a kód, az openness-pozíció átfordításával.
    assert.equal(result.patternCode, "ECSX");
    assert.equal(result.alternativeCode, "ECSP");
  });

  it("stabil minősítés CSAK akkor, ha egyik tengely sem 'balanced' fokozatú", () => {
    for (let bits = 0; bits < 16; bits++) {
      const result = calculateTeamPattern(
        team(
          scoresFor({
            drive: Boolean(bits & 8),
            cohesion: Boolean(bits & 4),
            discipline: Boolean(bits & 2),
            openness: Boolean(bits & 1),
          }),
        ),
      );
      assert.ok(result);
      const balancedAxes = Object.entries(result.axes)
        .filter(([, axis]) => axis.grade === "balanced")
        .map(([name]) => name);
      assert.deepEqual(result.unstableAxes, balancedAxes);
      assert.equal(result.stability === "stabil", balancedAxes.length === 0);
    }
  });

  it("homogén, kis csapatnál a confidence-faktorok konzisztensek", () => {
    const result = calculateTeamPattern(
      team(scoresFor({ drive: false, cohesion: false, discipline: false, openness: false })),
    );
    assert.ok(result);
    assert.equal(result.confidenceFactors.sampleSize, "alacsony");
    assert.equal(result.confidenceFactors.thresholdProximity, "magas");
    assert.equal(result.confidenceFactors.patternClarity, "magas");
    // RVFP a csupa-alacsony kód – a javítás előtt egyedül ez oldódott fel
    assert.equal(result.patternCode, "RVFP");
  });
});
