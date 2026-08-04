import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPairSimulation } from "@/lib/interaction-view";
import type { DimScores } from "@/lib/interaction-engine";

// Markánsan eltérő pár: strukturált vs. felfedező működés.
const STRUCTURED: DimScores = {
  INTE: 70, RESO: 40, TEMP: 45, ADAP: 55, THOR: 85, OPEN: 25,
};
const EXPLORER: DimScores = {
  INTE: 50, RESO: 55, TEMP: 75, ADAP: 40, THOR: 25, OPEN: 85,
};
// Kontraszt nélküli (közép-sávos) profil — sparse-ág.
const NEUTRAL: DimScores = {
  INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50,
};

describe("buildPairSimulation — valódi páros mód (profile-profile)", () => {
  it("markáns párnál blokkokat ad, és a discuss sosem üres", () => {
    const sim = buildPairSimulation(STRUCTURED, EXPLORER, "hu");
    assert.equal(sim.sparse, false);
    assert.ok(sim.discuss.length > 0, "a discuss a funkció magja — nem lehet üres");
    for (const line of [...sim.easy, ...sim.friction, ...sim.discuss]) {
      assert.ok(line.text.length > 20);
      assert.ok(line.dimLabels.length >= 1);
      assert.ok(line.atomId.length > 0);
    }
  });

  it("mindkét vezető-irány kiegészítőit kiszámolja, és azok a saját pólusokból jönnek", () => {
    const sim = buildPairSimulation(STRUCTURED, EXPLORER, "hu");
    assert.ok(sim.leaderNotesSelf.length > 0);
    assert.ok(sim.leaderNotesOther.length > 0);
    // A self (STRUCTURED) poláris dimenziói mások, mint az EXPLORER-é —
    // a két irány jegyzetei nem lehetnek azonosak.
    const selfDims = sim.leaderNotesSelf.map((n) => n.dim).join(",");
    const otherDims = sim.leaderNotesOther.map((n) => n.dim).join(",");
    assert.notEqual(selfDims, otherDims);
  });

  it("a kért nyelven szerializál (hu vs en eltér)", () => {
    const hu = buildPairSimulation(STRUCTURED, EXPLORER, "hu");
    const en = buildPairSimulation(STRUCTURED, EXPLORER, "en");
    assert.equal(hu.discuss.length, en.discuss.length);
    assert.notEqual(hu.discuss[0].text, en.discuss[0].text);
    assert.equal(hu.discuss[0].atomId, en.discuss[0].atomId);
  });

  it("kontraszt nélküli párnál sparse jelzést ad üres blokkok helyett", () => {
    const sim = buildPairSimulation(NEUTRAL, NEUTRAL, "hu");
    assert.equal(sim.sparse, true);
    assert.equal(sim.easy.length + sim.friction.length + sim.discuss.length, 0);
  });
});
