import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  pickPrimaryTeam,
  sortTeamsByCompletion,
  splitDynamicsEdges,
} from "@/lib/manager-cockpit-core";
import type { DynamicsEdgeType } from "@/lib/friction-model";

function edge(type: DynamicsEdgeType, source: string) {
  return { type, source };
}

describe("splitDynamicsEdges — él-típus és mért/becsült megoszlás", () => {
  it("üres bemenetre minden számláló nulla", () => {
    assert.deepEqual(splitDynamicsEdges([]), {
      alignedCount: 0,
      complementaryCount: 0,
      frictionCount: 0,
      measuredEdgeCount: 0,
      estimatedEdgeCount: 0,
    });
  });

  it("típus-számok és forrás-megoszlás egy menetben", () => {
    const split = splitDynamicsEdges([
      edge("aligned", "trust_round"),
      edge("aligned", "profile_estimate"),
      edge("complementary", "profile_estimate"),
      edge("friction", "trust_round"),
      edge("friction", "profile_estimate"),
    ]);
    assert.deepEqual(split, {
      alignedCount: 2,
      complementaryCount: 1,
      frictionCount: 2,
      measuredEdgeCount: 2,
      estimatedEdgeCount: 3,
    });
  });

  it("a mért definíció a team-report.ts-sel azonos: trust_round VAGY observer", () => {
    const split = splitDynamicsEdges([
      edge("aligned", "observer"),
      edge("complementary", "trust_round"),
      edge("friction", "profile_estimate"),
    ]);
    assert.equal(split.measuredEdgeCount, 2);
    assert.equal(split.estimatedEdgeCount, 1);
  });

  it("csak becsült élekre a mért nulla — a felület ilyenkor profil-becslés jelzést mutat", () => {
    const split = splitDynamicsEdges([
      edge("aligned", "profile_estimate"),
      edge("friction", "profile_estimate"),
    ]);
    assert.equal(split.measuredEdgeCount, 0);
    assert.equal(split.estimatedEdgeCount, 2);
  });

  it("mért + becsült = összes él (a headline számok fedik a teljes megoszlást)", () => {
    const edges = [
      edge("aligned", "trust_round"),
      edge("complementary", "observer"),
      edge("friction", "profile_estimate"),
      edge("aligned", "profile_estimate"),
    ];
    const split = splitDynamicsEdges(edges);
    assert.equal(split.measuredEdgeCount + split.estimatedEdgeCount, edges.length);
    assert.equal(
      split.alignedCount + split.complementaryCount + split.frictionCount,
      edges.length,
    );
  });
});

describe("sortTeamsByCompletion + pickPrimaryTeam — rendezés és primary-választás", () => {
  const team = (teamId: string, completionPct: number) => ({ teamId, completionPct });

  it("legalacsonyabb kitöltöttség kerül előre", () => {
    const sorted = sortTeamsByCompletion([team("a", 80), team("b", 20), team("c", 50)]);
    assert.deepEqual(sorted.map((t) => t.teamId), ["b", "c", "a"]);
  });

  it("stabil: azonos kitöltöttségnél a bemeneti sorrend marad", () => {
    const sorted = sortTeamsByCompletion([
      team("a", 50),
      team("b", 50),
      team("c", 10),
      team("d", 50),
    ]);
    assert.deepEqual(sorted.map((t) => t.teamId), ["c", "a", "b", "d"]);
  });

  it("nem mutálja a bemenetet", () => {
    const input = [team("a", 90), team("b", 10)];
    sortTeamsByCompletion(input);
    assert.deepEqual(input.map((t) => t.teamId), ["a", "b"]);
  });

  it("a primary a RENDEZETT lista első eleme, nem a betöltési [0]", () => {
    const teams = [team("elso-betoltott", 100), team("figyelmet-kivan", 25)];
    const primary = pickPrimaryTeam(teams);
    assert.equal(primary?.teamId, "figyelmet-kivan");
    assert.equal(primary?.teamId, sortTeamsByCompletion(teams)[0]?.teamId);
  });

  it("döntetlennél a korábban betöltött csapat a primary", () => {
    const primary = pickPrimaryTeam([team("a", 40), team("b", 40)]);
    assert.equal(primary?.teamId, "a");
  });

  it("üres listára null", () => {
    assert.equal(pickPrimaryTeam([]), null);
  });
});
