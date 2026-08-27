import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeTeamFeedbackCulture,
  TEAM_OBSERVER_MIN_COVERED,
  type TeamObserverMemberInput,
} from "@/lib/team-observer";
import { DOSSIER_GAP_MIN_DELTA, DOSSIER_OBSERVER_MIN } from "@/lib/member-dossier";
import { HEXACO_ORDER } from "@/lib/hexaco";

// Csapat-szintű visszajelzési kultúra (2026-08-11).
//
// A modul SZÁNDÉKOSAN nem csapat-observer-átlagot számol (összemérhetetlen
// értékelői körök, önszelektált minta, differencia-támadás — indoklás a
// team-observer.ts fejkommentjében), hanem személyen belüli besorolást
// aggregál darabszámmá. A tesztek ezt a szerződést rögzítik.

const flat = (value: number): Record<string, number> =>
  Object.fromEntries(HEXACO_ORDER.map((code) => [code, value]));

/** n értékelő, mind ugyanazt a szintet adja. */
const raters = (n: number, value: number): Record<string, number>[] =>
  Array.from({ length: n }, () => flat(value));

/** Lefedett, egybevágó tag (a külső kép a self-fel azonos). */
const alignedMember = (): TeamObserverMemberInput => ({
  selfDims: flat(50),
  observerDimSets: raters(DOSSIER_OBSERVER_MIN, 50),
});

/** Lefedett tag, a küszöböt biztosan meghaladó eltéréssel. */
const gapMember = (): TeamObserverMemberInput => ({
  selfDims: flat(50),
  observerDimSets: raters(DOSSIER_OBSERVER_MIN, 50 + DOSSIER_GAP_MIN_DELTA + 5),
});

describe("computeTeamFeedbackCulture – anonimitás-padló", () => {
  it("a padló alatt NEM ad vissza semmit (nem 0-t)", () => {
    const members = Array.from({ length: TEAM_OBSERVER_MIN_COVERED - 1 }, alignedMember);
    assert.equal(computeTeamFeedbackCulture(members), null);
  });

  it("pontosan a padlón megjelenik", () => {
    const members = Array.from({ length: TEAM_OBSERVER_MIN_COVERED }, alignedMember);
    const result = computeTeamFeedbackCulture(members);
    assert.ok(result);
    assert.equal(result.coveredCount, TEAM_OBSERVER_MIN_COVERED);
  });

  it("a padló szigorúbb a per-fős rater-küszöbnél", () => {
    // Ha a csapat-padló ≤ a rater-padló lenne, egyetlen lefedett tag is
    // megjeleníthetne kimenetet — 1-az-1-hez azonosítás.
    assert.ok(
      TEAM_OBSERVER_MIN_COVERED > 1,
      "a csapat-padló nem véd az egyetlen lefedett tag esetén",
    );
  });

  it("a lefedetlen tagok nem tolják át a padlót", () => {
    // 3 lefedett + 5 lefedetlen: a csapat nagy, de a mért kép nem elég.
    const members = [
      ...Array.from({ length: 3 }, alignedMember),
      ...Array.from({ length: 5 }, () => ({
        selfDims: flat(50),
        observerDimSets: [],
      })),
    ];
    assert.equal(computeTeamFeedbackCulture(members), null);
  });
});

describe("computeTeamFeedbackCulture – besorolás", () => {
  it("a per-fős rater-padló alatti tag nem számít lefedettnek", () => {
    const members = [
      ...Array.from({ length: TEAM_OBSERVER_MIN_COVERED }, alignedMember),
      {
        selfDims: flat(50),
        // Eggyel kevesebb értékelő, mint az anonimitás-padló.
        observerDimSets: raters(DOSSIER_OBSERVER_MIN - 1, 90),
      },
    ];
    const result = computeTeamFeedbackCulture(members);
    assert.ok(result);
    assert.equal(result.coveredCount, TEAM_OBSERVER_MIN_COVERED);
    assert.equal(result.gapCount, 0, "küszöb alatti értékelés eltérésként jelent meg");
  });

  it("self-eredmény nélküli tag nem számít lefedettnek", () => {
    const members = [
      ...Array.from({ length: TEAM_OBSERVER_MIN_COVERED }, alignedMember),
      { selfDims: null, observerDimSets: raters(5, 80) },
    ];
    const result = computeTeamFeedbackCulture(members);
    assert.ok(result);
    assert.equal(result.coveredCount, TEAM_OBSERVER_MIN_COVERED);
  });

  it("a mérési hibán BELÜLI eltérés egyezésnek számít", () => {
    const withinError: TeamObserverMemberInput = {
      selfDims: flat(50),
      // Egy ponttal a küszöb alatt — ez zaj, nem jel.
      observerDimSets: raters(DOSSIER_OBSERVER_MIN, 50 + DOSSIER_GAP_MIN_DELTA - 1),
    };
    const members = [
      ...Array.from({ length: TEAM_OBSERVER_MIN_COVERED - 1 }, alignedMember),
      withinError,
    ];
    const result = computeTeamFeedbackCulture(members);
    assert.ok(result);
    assert.equal(result.alignedCount, TEAM_OBSERVER_MIN_COVERED);
    assert.equal(result.gapCount, 0);
  });

  it("a küszöböt elérő eltérés eltérésnek számít", () => {
    const members = [
      ...Array.from({ length: TEAM_OBSERVER_MIN_COVERED - 1 }, alignedMember),
      gapMember(),
    ];
    const result = computeTeamFeedbackCulture(members);
    assert.ok(result);
    assert.equal(result.gapCount, 1);
    assert.equal(result.alignedCount, TEAM_OBSERVER_MIN_COVERED - 1);
  });

  it("EGYETLEN dimenzió eltérése is eltérésnek számít", () => {
    const oneDimOff: TeamObserverMemberInput = {
      selfDims: flat(50),
      observerDimSets: raters(DOSSIER_OBSERVER_MIN, 50).map((set) => ({
        ...set,
        X: 50 + DOSSIER_GAP_MIN_DELTA + 2,
      })),
    };
    const members = [
      ...Array.from({ length: TEAM_OBSERVER_MIN_COVERED - 1 }, alignedMember),
      oneDimOff,
    ];
    const result = computeTeamFeedbackCulture(members);
    assert.ok(result);
    assert.equal(result.gapCount, 1);
  });

  it("összevethető dimenzió nélkül a tag nem lefedett", () => {
    // Van 3 értékelő, de más dimenziókról — nincs mit összevetni, és az
    // adathiány NEM könyvelhető „egyezésként".
    const disjoint: TeamObserverMemberInput = {
      selfDims: { H: 50 },
      observerDimSets: Array.from({ length: DOSSIER_OBSERVER_MIN }, () => ({ O: 70 })),
    };
    const members = [
      ...Array.from({ length: TEAM_OBSERVER_MIN_COVERED }, alignedMember),
      disjoint,
    ];
    const result = computeTeamFeedbackCulture(members);
    assert.ok(result);
    assert.equal(result.coveredCount, TEAM_OBSERVER_MIN_COVERED);
  });

  it("a bontás összege mindig a lefedettség", () => {
    const members = [
      ...Array.from({ length: 3 }, alignedMember),
      ...Array.from({ length: 2 }, gapMember),
      { selfDims: flat(50), observerDimSets: [] },
    ];
    const result = computeTeamFeedbackCulture(members);
    assert.ok(result);
    assert.equal(result.alignedCount + result.gapCount, result.coveredCount);
    assert.equal(result.coveredCount, 5);
    assert.equal(result.memberCount, 6, "a csapatlétszám a teljes lista");
  });
});

describe("kimenet-szerződés – mit NEM ad vissza", () => {
  it("nincs dimenzió-bontás, nincs tag-szintű érték, nincs nagyságrend", () => {
    const members = Array.from({ length: TEAM_OBSERVER_MIN_COVERED }, gapMember);
    const result = computeTeamFeedbackCulture(members);
    assert.ok(result);
    // A kulcskészlet ZÁRT: bármely bővítés (pl. observerAvg vagy perMember)
    // újranyitná a differencia-támadás felületét, ezért itt bukjon el.
    assert.deepEqual(
      Object.keys(result).sort(),
      ["alignedCount", "coveredCount", "gapCount", "memberCount"],
    );
    for (const value of Object.values(result)) {
      assert.equal(typeof value, "number");
    }
  });
});
