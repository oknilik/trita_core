import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPairSimulation } from "@/lib/interaction-view";
import type { DimScores } from "@/lib/interaction-engine";

// Markánsan eltérő pár: strukturált vs. felfedező működés.
const STRUCTURED: DimScores = {
  H: 70, E: 40, X: 45, A: 55, C: 85, O: 25,
};
const EXPLORER: DimScores = {
  H: 50, E: 55, X: 75, A: 40, C: 25, O: 85,
};
// Kontraszt nélküli (közép-sávos) profil — sparse-ág.
const NEUTRAL: DimScores = {
  H: 50, E: 50, X: 50, A: 50, C: 50, O: 50,
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

// ── Kiterjesztett lefedettség (2026-08-18) ───────────────────────────

describe("buildPairSimulation — hat dimenziós sáv és facet-nüansz", () => {
  it("mind a hat dimenzióra ad sort, lokalizált címkével", () => {
    const sim = buildPairSimulation(STRUCTURED, EXPLORER, "hu");
    assert.equal(sim.dimensions.length, 6);
    for (const row of sim.dimensions) {
      assert.ok(row.dimLabel.length > 0);
      assert.ok(["aligned", "differs"].includes(row.state));
    }
    const en = buildPairSimulation(STRUCTURED, EXPLORER, "en");
    assert.notEqual(sim.dimensions[0].dimLabel, en.dimensions[0].dimLabel);
  });

  it("kontraszt nélküli párnál is nyilatkozik mind a hat dimenzióról", () => {
    // Ez a sparse-ág lényege: a „megnéztük, és nincs róla mit mondani" eset
    // nem lehet megkülönböztethetetlen a „nem néztük meg"-től.
    const sim = buildPairSimulation(NEUTRAL, NEUTRAL, "hu");
    assert.equal(sim.sparse, true);
    assert.equal(sim.dimensions.length, 6);
    assert.ok(sim.dimensions.every((row) => row.state === "aligned"));
  });

  it("a facet-nüansz feloldott alskála-nevet ad, nem nyers kódot", () => {
    const sim = buildPairSimulation(
      { ...STRUCTURED, C: 70 },
      { ...EXPLORER, C: 66 },
      "hu",
      {
        selfFacets: { C: { organization: 88, diligence: 60 } },
        otherFacets: { C: { organization: 52, diligence: 62 } },
        facetMinGap: 17,
      },
    );
    assert.equal(sim.facetNuances.length, 1);
    const [nuance] = sim.facetNuances;
    assert.equal(nuance.facet, "organization");
    assert.equal(nuance.facetLabel, "Szervezettség");
    assert.equal(nuance.higher, "self");
  });

  it("ADATVÉDELEM: a kliensre menő nézetben EGYETLEN szám sincs", () => {
    // A pár-nézet határa, hogy a partner nyers pontszámai nem hagyják el a
    // szervert. A szerver a KÉSZ összevetést küldi — nem a számokat, amikből
    // a kliens (vagy bárki, aki megnyitja a payloadot) visszafejtené őket.
    // Ezért a `PairSimulationView` egyetlen ága sem hordozhat number-t.
    const sim = buildPairSimulation(STRUCTURED, EXPLORER, "hu", {
      selfFacets: { C: { organization: 88, diligence: 60 } },
      otherFacets: { C: { organization: 52, diligence: 62 } },
      facetMinGap: 17,
    });

    const numericPaths: string[] = [];
    const walk = (value: unknown, path: string): void => {
      if (typeof value === "number") {
        numericPaths.push(path);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item, index) => walk(item, `${path}[${index}]`));
        return;
      }
      if (value && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) {
          walk(child, `${path}.${key}`);
        }
      }
    };
    walk(JSON.parse(JSON.stringify(sim)), "sim");

    assert.deepEqual(numericPaths, [], `pontszám szivárgott a kliensre:\n${numericPaths.join("\n")}`);
  });
});
