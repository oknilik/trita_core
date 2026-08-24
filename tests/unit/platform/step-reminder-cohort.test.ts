import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  selectStepReminderCohort,
  STEP_REMINDER_COOLDOWN_MS,
} from "@/lib/campaign-steps-core";

// P1-OPS-02: az emlékeztető az AKTUÁLIS befejezetlen lépést célozza,
// idempotens időablakkal. A route és egy jövőbeli cron ugyanazt a tiszta
// függvényt használja — a célzási hibák itt buknak, nem élesben.

const SCAN_V1 = { type: "SELF_ASSESSMENT", steps: ["SELF_ASSESSMENT", "TRUST_360", "PSYCH_SAFETY"] };
const NOW = new Date("2026-08-24T12:00:00Z");

describe("selectStepReminderCohort", () => {
  it("minden befejezetlen résztvevő a saját nyitott lépéséhez kerül a kohorszba", () => {
    const cohort = selectStepReminderCohort(
      SCAN_V1,
      [
        { userId: "u-self", currentStep: 0 },
        { userId: "u-trust", currentStep: 1 },
        { userId: "u-pulse", currentStep: 2 },
        { userId: "u-done", currentStep: 3 },
      ],
      NOW,
    );
    assert.deepEqual(cohort.pending, [
      { userId: "u-self", stepIndex: 0, stepType: "SELF_ASSESSMENT" },
      { userId: "u-trust", stepIndex: 1, stepType: "TRUST_360" },
      { userId: "u-pulse", stepIndex: 2, stepType: "PSYCH_SAFETY" },
    ]);
    assert.equal(cohort.done, 1);
    assert.equal(cohort.skippedRecent, 0);
    assert.equal(cohort.gated, 0);
  });

  it("az ütemezetten még zárt lépés nem kap emlékeztetőt", () => {
    const cohort = selectStepReminderCohort(
      SCAN_V1,
      [{ userId: "u1", currentStep: 1, nextStepOpensAt: new Date(NOW.getTime() + 60_000) }],
      NOW,
    );
    assert.equal(cohort.pending.length, 0);
    assert.equal(cohort.gated, 1);
  });

  it("cooldown-on belüli ismétlés idempotens: ugyanarra a lépésre nem megy újra", () => {
    const recentlyReminded = {
      userId: "u1",
      currentStep: 1,
      lastRemindedStep: 1,
      lastRemindedAt: new Date(NOW.getTime() - 1000),
    };
    const first = selectStepReminderCohort(SCAN_V1, [recentlyReminded], NOW);
    assert.equal(first.pending.length, 0);
    assert.equal(first.skippedRecent, 1);

    const afterCooldown = selectStepReminderCohort(
      SCAN_V1,
      [recentlyReminded],
      new Date(NOW.getTime() + STEP_REMINDER_COOLDOWN_MS),
    );
    assert.equal(afterCooldown.pending.length, 1);
  });

  it("lépés-váltás után a cooldown nem tartja vissza az új lépés emlékeztetőjét", () => {
    const cohort = selectStepReminderCohort(
      SCAN_V1,
      [
        {
          userId: "u1",
          currentStep: 2,
          lastRemindedStep: 1,
          lastRemindedAt: new Date(NOW.getTime() - 1000),
        },
      ],
      NOW,
    );
    assert.deepEqual(cohort.pending, [
      { userId: "u1", stepIndex: 2, stepType: "PSYCH_SAFETY" },
    ]);
  });
});
