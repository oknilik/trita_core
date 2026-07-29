import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countCampaignStepsDone,
  isCampaignStepDone,
  normalizeCampaignSteps,
} from "@/lib/campaign-steps-core";

// Lépés-teljesítés logika (2026-07-29): a kampány-statok forrása a
// currentStep/stepCompletions — a self-teszt csak a legacy OBSERVER_360
// fallbackban számít, fresh-tudatosan (a hívó szűri).

const STEPS = ["OBSERVER_360", "TEAM_ROLE", "TRUST_360"];

describe("isCampaignStepDone", () => {
  it("currentStep túlhaladás késznek számít", () => {
    const p = { currentStep: 2, stepCompletions: null };
    assert.equal(isCampaignStepDone(STEPS, 0, p, false), true);
    assert.equal(isCampaignStepDone(STEPS, 1, p, false), true);
    assert.equal(isCampaignStepDone(STEPS, 2, p, false), false);
  });

  it("stepCompletions bejegyzés késznek számít currentStep nélkül is", () => {
    const p = { currentStep: 0, stepCompletions: { TEAM_ROLE: "2026-07-29T00:00:00Z" } };
    assert.equal(isCampaignStepDone(STEPS, 1, p, false), true);
    assert.equal(isCampaignStepDone(STEPS, 0, p, false), false);
  });

  it("legacy OBSERVER_360 fallback: self-eredmény csak az observer-lépést zárja", () => {
    const p = { currentStep: 0, stepCompletions: null };
    assert.equal(isCampaignStepDone(STEPS, 0, p, true), true);
    assert.equal(isCampaignStepDone(STEPS, 1, p, true), false);
    assert.equal(isCampaignStepDone(STEPS, 2, p, true), false);
  });

  it("fresh-körben a hívó false-t ad: a régi self-eredmény nem zár lépést", () => {
    const p = { currentStep: 0, stepCompletions: null };
    assert.equal(isCampaignStepDone(STEPS, 0, p, false), false);
  });

  it("index a lépéslistán kívül sosem kész", () => {
    const p = { currentStep: 99, stepCompletions: null };
    assert.equal(isCampaignStepDone(STEPS, 3, p, true), false);
  });
});

describe("countCampaignStepsDone", () => {
  it("vegyes forrásokból összesít", () => {
    const p = { currentStep: 1, stepCompletions: { TRUST_360: "2026-07-29T00:00:00Z" } };
    // OBSERVER_360 currentStep alapján, TRUST_360 completions alapján kész.
    assert.equal(countCampaignStepsDone(STEPS, p, false), 2);
  });

  it("üres résztvevő nulla", () => {
    const p = { currentStep: 0, stepCompletions: null };
    assert.equal(countCampaignStepsDone(STEPS, p, false), 0);
  });

  it("minden lépés kész", () => {
    const p = { currentStep: 3, stepCompletions: null };
    assert.equal(countCampaignStepsDone(STEPS, p, false), 3);
  });
});

describe("normalizeCampaignSteps", () => {
  it("kanonikus sorrendbe rendez és duplikátumot szűr", () => {
    assert.deepEqual(
      normalizeCampaignSteps(["TRUST_360", "OBSERVER_360", "TRUST_360", "nope"]),
      ["OBSERVER_360", "TRUST_360"],
    );
  });
});
