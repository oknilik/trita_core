import { describe, it, expect } from "vitest";
import {
  PSYCH_SAFETY_ITEMS,
  PSYCH_SAFETY_ITEM_COUNT,
  PSYCH_SAFETY_MIN_RESPONSES,
  PSYCH_SAFETY_ACTIONS,
  PSYCH_SAFETY_WEAK_THRESHOLD,
  aggregatePsychSafety,
  isCompletePsychSafetyAnswerSet,
  psychSafetyBand,
  weakPsychSafetyItemIds,
  getPsychSafetyItem,
  type PsychSafetyAnswers,
} from "@/lib/psych-safety";

function answersWith(value: number): PsychSafetyAnswers {
  return Object.fromEntries(PSYCH_SAFETY_ITEMS.map((i) => [i.id, value]));
}

describe("psych-safety instrument", () => {
  it("has 8 items with unique ids and both locales", () => {
    expect(PSYCH_SAFETY_ITEM_COUNT).toBe(8);
    const ids = new Set(PSYCH_SAFETY_ITEMS.map((i) => i.id));
    expect(ids.size).toBe(8);
    for (const item of PSYCH_SAFETY_ITEMS) {
      expect(item.text.hu.length).toBeGreaterThan(10);
      expect(item.text.en.length).toBeGreaterThan(10);
    }
  });

  it("contains reversed items", () => {
    expect(PSYCH_SAFETY_ITEMS.some((i) => i.reversed)).toBe(true);
    expect(PSYCH_SAFETY_ITEMS.some((i) => !i.reversed)).toBe(true);
  });
});

describe("isCompletePsychSafetyAnswerSet", () => {
  it("accepts a full 1..5 answer set", () => {
    expect(isCompletePsychSafetyAnswerSet(answersWith(3))).toBe(true);
  });

  it("rejects partial, out-of-range and non-integer sets", () => {
    const partial = answersWith(3);
    delete partial[PSYCH_SAFETY_ITEMS[0].id];
    expect(isCompletePsychSafetyAnswerSet(partial)).toBe(false);
    expect(isCompletePsychSafetyAnswerSet({ ...answersWith(3), [PSYCH_SAFETY_ITEMS[0].id]: 6 })).toBe(false);
    expect(isCompletePsychSafetyAnswerSet({ ...answersWith(3), [PSYCH_SAFETY_ITEMS[0].id]: 2.5 })).toBe(false);
    expect(isCompletePsychSafetyAnswerSet(null)).toBe(false);
    expect(isCompletePsychSafetyAnswerSet([answersWith(3)])).toBe(false);
    // extra kulcs sem megy át
    expect(isCompletePsychSafetyAnswerSet({ ...answersWith(3), EXTRA: 3 })).toBe(false);
  });
});

describe("aggregatePsychSafety — anonimitás-küszöb", () => {
  it("returns null below the minimum response count", () => {
    expect(aggregatePsychSafety([])).toBeNull();
    expect(
      aggregatePsychSafety(Array(PSYCH_SAFETY_MIN_RESPONSES - 1).fill(answersWith(4))),
    ).toBeNull();
  });

  it("ignores invalid responses when counting toward the threshold", () => {
    const responses = [answersWith(4), answersWith(4), { broken: true }];
    expect(aggregatePsychSafety(responses)).toBeNull();
  });
});

describe("aggregatePsychSafety — pontozás", () => {
  it("scores uniform max-safety answers as 100", () => {
    // Minden pozitív itemre 5, minden fordítottra 1 → maximális biztonság
    const best: PsychSafetyAnswers = Object.fromEntries(
      PSYCH_SAFETY_ITEMS.map((i) => [i.id, i.reversed ? 1 : 5]),
    );
    const agg = aggregatePsychSafety([best, best, best]);
    expect(agg).not.toBeNull();
    expect(agg!.index).toBe(100);
    expect(agg!.band).toBe("high");
    expect(agg!.spread).toBe(0);
    for (const item of PSYCH_SAFETY_ITEMS) {
      expect(agg!.itemMeans[item.id]).toBe(5);
    }
  });

  it("scores uniform min-safety answers as 0", () => {
    const worst: PsychSafetyAnswers = Object.fromEntries(
      PSYCH_SAFETY_ITEMS.map((i) => [i.id, i.reversed ? 5 : 1]),
    );
    const agg = aggregatePsychSafety([worst, worst, worst]);
    expect(agg!.index).toBe(0);
    expect(agg!.band).toBe("low");
  });

  it("scores neutral (3) answers as 50 regardless of reversal", () => {
    const agg = aggregatePsychSafety([answersWith(3), answersWith(3), answersWith(3)]);
    expect(agg!.index).toBe(50);
    for (const item of PSYCH_SAFETY_ITEMS) {
      expect(agg!.itemMeans[item.id]).toBe(3);
    }
  });

  it("reports spread between divergent respondents", () => {
    const best: PsychSafetyAnswers = Object.fromEntries(
      PSYCH_SAFETY_ITEMS.map((i) => [i.id, i.reversed ? 1 : 5]),
    );
    const worst: PsychSafetyAnswers = Object.fromEntries(
      PSYCH_SAFETY_ITEMS.map((i) => [i.id, i.reversed ? 5 : 1]),
    );
    const agg = aggregatePsychSafety([best, worst, answersWith(3)]);
    expect(agg!.count).toBe(3);
    expect(agg!.index).toBe(50);
    expect(agg!.spread).toBeGreaterThan(30);
  });
});

describe("riport-réteg: területek és akciók", () => {
  it("every item has an area label and an action suggestion in both locales", () => {
    for (const item of PSYCH_SAFETY_ITEMS) {
      expect(item.area.hu.length).toBeGreaterThan(3);
      expect(item.area.en.length).toBeGreaterThan(3);
      expect(PSYCH_SAFETY_ACTIONS[item.id]?.hu.length).toBeGreaterThan(20);
      expect(PSYCH_SAFETY_ACTIONS[item.id]?.en.length).toBeGreaterThan(20);
    }
  });

  it("weakPsychSafetyItemIds picks below-threshold items, weakest first, capped", () => {
    const means: Record<string, number> = Object.fromEntries(
      PSYCH_SAFETY_ITEMS.map((i) => [i.id, 4.2]),
    );
    means.PS2 = 2.1;
    means.PS5 = 3.0;
    means.PS8 = 3.3;
    means.PS1 = 3.39;
    const weak = weakPsychSafetyItemIds(means);
    expect(weak).toEqual(["PS2", "PS5", "PS8"]); // max 3, növekvő átlag
    expect(weakPsychSafetyItemIds(means, 2)).toEqual(["PS2", "PS5"]);
    // küszöbön lévő (3.4) nem gyenge
    expect(weakPsychSafetyItemIds({ ...means, PS1: PSYCH_SAFETY_WEAK_THRESHOLD })).not.toContain("PS1");
  });

  it("returns empty list when everything is healthy", () => {
    const healthy = Object.fromEntries(PSYCH_SAFETY_ITEMS.map((i) => [i.id, 4.0]));
    expect(weakPsychSafetyItemIds(healthy)).toEqual([]);
  });

  it("getPsychSafetyItem resolves ids", () => {
    expect(getPsychSafetyItem("PS3")?.area.hu).toBe("Segítségkérés");
    expect(getPsychSafetyItem("PS99")).toBeUndefined();
  });
});

describe("campaign-steps-core (több-lépéses kampányok)", () => {
  it("normalizes step lists into canonical order without duplicates", async () => {
    const { normalizeCampaignSteps } = await import("@/lib/campaign-steps-core");
    expect(normalizeCampaignSteps(["PSYCH_SAFETY", "OBSERVER_360"])).toEqual([
      "OBSERVER_360",
      "PSYCH_SAFETY",
    ]);
    expect(normalizeCampaignSteps(["TEAM_ROLE", "TEAM_ROLE", "X"])).toEqual(["TEAM_ROLE"]);
  });

  it("falls back to the legacy type when steps are empty", async () => {
    const { getCampaignSteps, isStepOpenFor } = await import("@/lib/campaign-steps-core");
    expect(getCampaignSteps({ type: "PSYCH_SAFETY", steps: [] })).toEqual(["PSYCH_SAFETY"]);
    expect(
      isStepOpenFor({ type: "PSYCH_SAFETY", steps: [] }, { currentStep: 0 }, "PSYCH_SAFETY"),
    ).toBe(true);
  });

  it("opens steps strictly in order, per participant", async () => {
    const { getCurrentStepType, isStepOpenFor } = await import("@/lib/campaign-steps-core");
    const camp = { type: "OBSERVER_360", steps: ["OBSERVER_360", "TEAM_ROLE", "PSYCH_SAFETY"] };
    expect(getCurrentStepType(camp, { currentStep: 1 })).toBe("TEAM_ROLE");
    expect(isStepOpenFor(camp, { currentStep: 1 }, "PSYCH_SAFETY")).toBe(false);
    expect(getCurrentStepType(camp, { currentStep: 3 })).toBeNull();
  });
});

describe("psychSafetyBand", () => {
  it("maps thresholds", () => {
    expect(psychSafetyBand(80)).toBe("high");
    expect(psychSafetyBand(75)).toBe("high");
    expect(psychSafetyBand(74)).toBe("mid");
    expect(psychSafetyBand(55)).toBe("mid");
    expect(psychSafetyBand(54)).toBe("low");
  });
});
