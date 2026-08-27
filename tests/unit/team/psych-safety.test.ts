import { describe, it } from "node:test";
import assert from "node:assert/strict";
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
  PSYCH_SAFETY_LEADER_TRAPS,
  leaderTrapsForWeakItems,
  type PsychSafetyAnswers,
} from "@/lib/psych-safety";

function answersWith(value: number): PsychSafetyAnswers {
  return Object.fromEntries(PSYCH_SAFETY_ITEMS.map((i) => [i.id, value]));
}

describe("psych-safety instrument", () => {
  it("has 8 items with unique ids and both locales", () => {
    assert.equal(PSYCH_SAFETY_ITEM_COUNT, 8);
    const ids = new Set(PSYCH_SAFETY_ITEMS.map((i) => i.id));
    assert.equal(ids.size, 8);
    for (const item of PSYCH_SAFETY_ITEMS) {
      assert.ok(item.text.hu.length > 10);
      assert.ok(item.text.en.length > 10);
    }
  });

  it("contains reversed items", () => {
    assert.ok(PSYCH_SAFETY_ITEMS.some((i) => i.reversed));
    assert.ok(PSYCH_SAFETY_ITEMS.some((i) => !i.reversed));
  });
});

describe("isCompletePsychSafetyAnswerSet", () => {
  it("accepts a full 1..5 answer set", () => {
    assert.equal(isCompletePsychSafetyAnswerSet(answersWith(3)), true);
  });

  it("rejects partial, out-of-range and non-integer sets", () => {
    const partial = answersWith(3);
    delete partial[PSYCH_SAFETY_ITEMS[0].id];
    assert.equal(isCompletePsychSafetyAnswerSet(partial), false);
    assert.equal(
      isCompletePsychSafetyAnswerSet({ ...answersWith(3), [PSYCH_SAFETY_ITEMS[0].id]: 6 }),
      false,
    );
    assert.equal(
      isCompletePsychSafetyAnswerSet({ ...answersWith(3), [PSYCH_SAFETY_ITEMS[0].id]: 2.5 }),
      false,
    );
    assert.equal(isCompletePsychSafetyAnswerSet(null), false);
    assert.equal(isCompletePsychSafetyAnswerSet([answersWith(3)]), false);
    // extra kulcs sem megy át
    assert.equal(isCompletePsychSafetyAnswerSet({ ...answersWith(3), EXTRA: 3 }), false);
  });
});

describe("aggregatePsychSafety – anonimitás-küszöb", () => {
  it("returns null below the minimum response count", () => {
    assert.equal(aggregatePsychSafety([]), null);
    assert.equal(
      aggregatePsychSafety(Array(PSYCH_SAFETY_MIN_RESPONSES - 1).fill(answersWith(4))),
      null,
    );
  });

  it("ignores invalid responses when counting toward the threshold", () => {
    const responses = [answersWith(4), answersWith(4), { broken: true }];
    assert.equal(aggregatePsychSafety(responses), null);
  });
});

describe("aggregatePsychSafety – pontozás", () => {
  it("scores uniform max-safety answers as 100", () => {
    // Minden pozitív itemre 5, minden fordítottra 1 → maximális biztonság
    const best: PsychSafetyAnswers = Object.fromEntries(
      PSYCH_SAFETY_ITEMS.map((i) => [i.id, i.reversed ? 1 : 5]),
    );
    const agg = aggregatePsychSafety([best, best, best]);
    assert.notEqual(agg, null);
    assert.equal(agg!.index, 100);
    assert.equal(agg!.band, "high");
    assert.equal(agg!.spread, 0);
    for (const item of PSYCH_SAFETY_ITEMS) {
      assert.equal(agg!.itemMeans[item.id], 5);
      assert.equal(agg!.itemSds[item.id], 0);
    }
  });

  it("scores uniform min-safety answers as 0", () => {
    const worst: PsychSafetyAnswers = Object.fromEntries(
      PSYCH_SAFETY_ITEMS.map((i) => [i.id, i.reversed ? 5 : 1]),
    );
    const agg = aggregatePsychSafety([worst, worst, worst]);
    assert.equal(agg!.index, 0);
    assert.equal(agg!.band, "low");
  });

  it("scores neutral (3) answers as 50 regardless of reversal", () => {
    const agg = aggregatePsychSafety([answersWith(3), answersWith(3), answersWith(3)]);
    assert.equal(agg!.index, 50);
    for (const item of PSYCH_SAFETY_ITEMS) {
      assert.equal(agg!.itemMeans[item.id], 3);
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
    assert.equal(agg!.count, 3);
    assert.equal(agg!.index, 50);
    assert.ok(agg!.spread > 30);
    for (const item of PSYCH_SAFETY_ITEMS) {
      assert.equal(agg!.itemSds[item.id], 2);
    }
  });
});

describe("riport-réteg: területek és akciók", () => {
  it("every item has an area label and an action suggestion in both locales", () => {
    for (const item of PSYCH_SAFETY_ITEMS) {
      assert.ok(item.area.hu.length > 3);
      assert.ok(item.area.en.length > 3);
      assert.ok((PSYCH_SAFETY_ACTIONS[item.id]?.hu.length ?? 0) > 20);
      assert.ok((PSYCH_SAFETY_ACTIONS[item.id]?.en.length ?? 0) > 20);
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
    assert.deepEqual(weak, ["PS2", "PS5", "PS8"]); // max 3, növekvő átlag
    assert.deepEqual(weakPsychSafetyItemIds(means, 2), ["PS2", "PS5"]);
    // küszöbön lévő (3.4) nem gyenge
    assert.ok(
      !weakPsychSafetyItemIds({ ...means, PS1: PSYCH_SAFETY_WEAK_THRESHOLD }).includes("PS1"),
    );
  });

  it("returns empty list when everything is healthy", () => {
    const healthy = Object.fromEntries(PSYCH_SAFETY_ITEMS.map((i) => [i.id, 4.0]));
    assert.deepEqual(weakPsychSafetyItemIds(healthy), []);
  });

  it("getPsychSafetyItem resolves ids", () => {
    assert.equal(getPsychSafetyItem("PS3")?.area.hu, "Segítségkérés");
    assert.equal(getPsychSafetyItem("PS99"), undefined);
  });
});

describe("campaign-steps-core (több-lépéses kampányok)", () => {
  it("normalizes step lists into canonical order without duplicates", async () => {
    const { normalizeCampaignSteps } = await import("@/lib/campaign-steps-core");
    assert.deepEqual(normalizeCampaignSteps(["PSYCH_SAFETY", "OBSERVER_360"]), [
      "OBSERVER_360",
      "PSYCH_SAFETY",
    ]);
    assert.deepEqual(normalizeCampaignSteps(["TEAM_ROLE", "TEAM_ROLE", "X"]), ["TEAM_ROLE"]);
  });

  it("falls back to the legacy type when steps are empty", async () => {
    const { getCampaignSteps, isStepOpenFor } = await import("@/lib/campaign-steps-core");
    assert.deepEqual(getCampaignSteps({ type: "PSYCH_SAFETY", steps: [] }), ["PSYCH_SAFETY"]);
    assert.equal(
      isStepOpenFor({ type: "PSYCH_SAFETY", steps: [] }, { currentStep: 0 }, "PSYCH_SAFETY"),
      true,
    );
  });

  it("opens steps strictly in order, per participant", async () => {
    const { getCurrentStepType, isStepOpenFor } = await import("@/lib/campaign-steps-core");
    const camp = { type: "OBSERVER_360", steps: ["OBSERVER_360", "TEAM_ROLE", "PSYCH_SAFETY"] };
    assert.equal(getCurrentStepType(camp, { currentStep: 1 }), "TEAM_ROLE");
    assert.equal(isStepOpenFor(camp, { currentStep: 1 }, "PSYCH_SAFETY"), false);
    assert.equal(getCurrentStepType(camp, { currentStep: 3 }), null);
  });
});

describe("vezetői csapda-kártyák (HBR 4 csapda keret)", () => {
  it("defines 4 traps with both locales and valid item mappings", () => {
    assert.equal(PSYCH_SAFETY_LEADER_TRAPS.length, 4);
    const ids = new Set(PSYCH_SAFETY_LEADER_TRAPS.map((t) => t.id));
    assert.equal(ids.size, 4);
    const validItemIds = new Set(PSYCH_SAFETY_ITEMS.map((i) => i.id));
    for (const trap of PSYCH_SAFETY_LEADER_TRAPS) {
      assert.ok(trap.title.hu.length > 3);
      assert.ok(trap.title.en.length > 3);
      assert.ok(trap.trap.hu.length > 30);
      assert.ok(trap.trap.en.length > 30);
      assert.ok(trap.antidote.hu.length > 30);
      assert.ok(trap.antidote.en.length > 30);
      assert.ok(trap.itemIds.length > 0);
      for (const id of trap.itemIds) assert.ok(validItemIds.has(id));
    }
  });

  it("every pulse area maps to at most a handful of traps, and the report-mapped areas are covered", () => {
    // A napi riport szerinti megfeleltetés: kényes témák + egyet-nem-értés
    // → reaktivitás; aláásás → szó–tett rés.
    const byId = Object.fromEntries(PSYCH_SAFETY_LEADER_TRAPS.map((t) => [t.id, t]));
    assert.ok(byId.REACTIVITY.itemIds.includes("PS1"));
    assert.ok(byId.REACTIVITY.itemIds.includes("PS8"));
    assert.ok(byId.SAY_DO_GAP.itemIds.includes("PS6"));
  });

  it("leaderTrapsForWeakItems returns matching traps, deduped, in canonical order", () => {
    assert.deepEqual(leaderTrapsForWeakItems([]), []);
    const one = leaderTrapsForWeakItems(["PS6"]);
    assert.deepEqual(one.map((t) => t.id), ["SAY_DO_GAP"]);
    // PS2 két csapdához is tartozik — mindkettő jön, de mindegyik egyszer
    const two = leaderTrapsForWeakItems(["PS2"]);
    const idList = two.map((t) => t.id);
    assert.equal(new Set(idList).size, idList.length);
    assert.ok(idList.includes("SAY_DO_GAP"));
    assert.ok(idList.includes("SELF_JUSTIFICATION"));
    // sorrend a definíciós sorrend
    const all = leaderTrapsForWeakItems(["PS1", "PS2", "PS4", "PS6"]);
    assert.deepEqual(
      all.map((t) => t.id),
      PSYCH_SAFETY_LEADER_TRAPS.filter((t) => all.includes(t)).map((t) => t.id),
    );
  });

  it("unknown item ids trigger nothing", () => {
    assert.deepEqual(leaderTrapsForWeakItems(["PS99"]), []);
  });
});

describe("psychSafetyBand", () => {
  it("maps thresholds", () => {
    assert.equal(psychSafetyBand(80), "high");
    assert.equal(psychSafetyBand(75), "high");
    assert.equal(psychSafetyBand(74), "mid");
    assert.equal(psychSafetyBand(55), "mid");
    assert.equal(psychSafetyBand(54), "low");
  });
});
