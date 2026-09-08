import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateTeamRange } from "@/lib/pricing/team-ladder";

// A létszám nem csapatszám: a kalkulátor tájékoztató sávja a tipikus
// csapatméretből (4–8 fő) mondja meg, hány csapat lehet a résztvevőkből.
describe("estimateTeamRange", () => {
  it("35 fő 5–8 csapat (a döntés példája)", () => {
    assert.deepEqual(estimateTeamRange(35), { min: 5, max: 8 });
  });

  it("kis létszám egyetlen csapat is lehet", () => {
    assert.deepEqual(estimateTeamRange(5), { min: 1, max: 1 });
    assert.deepEqual(estimateTeamRange(10), { min: 1, max: 2 });
    assert.deepEqual(estimateTeamRange(12), { min: 1, max: 3 });
  });

  it("12 fő felett a felső csapatméret adja az alsó határt", () => {
    assert.deepEqual(estimateTeamRange(13), { min: 2, max: 3 });
    assert.deepEqual(estimateTeamRange(20), { min: 3, max: 5 });
    assert.deepEqual(estimateTeamRange(40), { min: 5, max: 10 });
  });

  it("sosem ad üres vagy fordított sávot", () => {
    for (let heads = 1; heads <= 60; heads += 1) {
      const range = estimateTeamRange(heads);
      assert.ok(range.min >= 1 && range.min <= range.max, `${heads} fő: ${range.min}–${range.max}`);
    }
  });
});
