import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countCampaignStepsDone,
  getCampaignStepLink,
  isCampaignStepDone,
  isSelfResultForCampaign,
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

describe("getCampaignStepLink", () => {
  it("a self-lépés linkjébe beírja a kampánykört", () => {
    assert.equal(
      getCampaignStepLink("OBSERVER_360", "campaign / 2"),
      "/assessment?campaignId=campaign%20%2F%202",
    );
  });

  it("a többi kitöltő kanonikus linkjét nem módosítja", () => {
    assert.equal(
      getCampaignStepLink("PSYCH_SAFETY", "campaign-2"),
      "/assessment/psych-safety",
    );
  });
});

describe("isSelfResultForCampaign", () => {
  const campaign = {
    id: "round-2",
    requireFreshResults: true,
    activatedAt: new Date("2026-08-01T00:00:00Z"),
  };

  it("fresh körben az explicit kör-címke a biztos egyezés", () => {
    assert.equal(
      isSelfResultForCampaign(
        { campaignId: "round-2", createdAt: "2026-07-01T00:00:00Z" },
        campaign,
      ),
      true,
    );
  });

  it("másik kampány címkézett eredményét dátumtól függetlenül kizárja", () => {
    assert.equal(
      isSelfResultForCampaign(
        { campaignId: "another-round", createdAt: "2026-08-02T00:00:00Z" },
        campaign,
      ),
      false,
    );
  });

  it("legacy címke nélküli adatnál megtartja az aktiválási dátum fallbacket", () => {
    assert.equal(
      isSelfResultForCampaign(
        { campaignId: null, createdAt: "2026-08-02T00:00:00Z" },
        campaign,
      ),
      true,
    );
    assert.equal(
      isSelfResultForCampaign(
        { campaignId: null, createdAt: "2026-07-31T23:59:59Z" },
        campaign,
      ),
      false,
    );
  });

  it("nem-fresh kampánynál a korábbi self-eredmény továbbra is elég", () => {
    assert.equal(
      isSelfResultForCampaign(
        { campaignId: null, createdAt: "2020-01-01T00:00:00Z" },
        { ...campaign, requireFreshResults: false },
      ),
      true,
    );
  });
});
