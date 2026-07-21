import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TEAM_ROLES,
  calculateTeamRoleScores,
  getTopRoles,
  type TeamRoleCode,
} from "@/lib/team-role-scoring";
import {
  TEAM_ROLE_ITEMS,
  TEAM_ROLE_ITEM_COUNT,
  TEAM_ROLE_MIN_SELECT,
  TEAM_ROLE_MAX_SELECT,
  TEAM_ROLE_TOP_SELECT,
  isValidTeamRoleSelectionSet,
  type TeamRoleSelections,
} from "@/lib/team-role-questions";
import {
  aggregatePeerRoleScores,
  compareSelfAndPeerTopRoles,
  TEAM_ROLE_PEER_MIN_RATERS,
} from "@/lib/team-role-peer";

describe("team-role itembank", () => {
  it("has 27 items — 3 per role, ids prefixed with the role code", () => {
    assert.equal(TEAM_ROLE_ITEM_COUNT, 27);
    const perRole = new Map<string, number>();
    for (const item of TEAM_ROLE_ITEMS) {
      assert.ok(item.id.startsWith(item.role));
      assert.ok(item.self.hu.length > 0);
      assert.ok(item.self.en.length > 0);
      assert.ok(item.peer.hu.length > 0);
      assert.ok(item.peer.en.length > 0);
      perRole.set(item.role, (perRole.get(item.role) ?? 0) + 1);
    }
    assert.equal(perRole.size, Object.keys(TEAM_ROLES).length);
    for (const count of perRole.values()) assert.equal(count, 3);
  });

  it("validates selection sets: count band and exact top count", () => {
    const ids = TEAM_ROLE_ITEMS.map((i) => i.id);
    const valid: TeamRoleSelections = {};
    ids.slice(0, TEAM_ROLE_MIN_SELECT).forEach((id, idx) => {
      valid[id] = idx < TEAM_ROLE_TOP_SELECT ? 2 : 1;
    });
    assert.equal(isValidTeamRoleSelectionSet(valid), true);

    // túl kevés kijelölés
    const few = { ...valid };
    delete few[ids[TEAM_ROLE_MIN_SELECT - 1]];
    assert.equal(isValidTeamRoleSelectionSet(few), false);

    // túl sok kijelölés
    const many: TeamRoleSelections = {};
    ids.slice(0, TEAM_ROLE_MAX_SELECT + 1).forEach((id, idx) => {
      many[id] = idx < TEAM_ROLE_TOP_SELECT ? 2 : 1;
    });
    assert.equal(isValidTeamRoleSelectionSet(many), false);

    // rossz kiemelt-darabszám
    const wrongTop = { ...valid, [ids[0]]: 1 } as TeamRoleSelections;
    assert.equal(isValidTeamRoleSelectionSet(wrongTop), false);

    // ismeretlen item-id
    assert.equal(
      isValidTeamRoleSelectionSet({ ...valid, NOPE1: 1 } as TeamRoleSelections),
      false,
    );
  });
});

describe("team-role scoring (selection-based)", () => {
  it("scores a full-role highlighted pick at 100 and unpicked roles at 0", () => {
    // OG mindhárom iteme kiemelt (a 3 kiemelt-limit pont kijön), + 5 sima
    const selections: TeamRoleSelections = {
      OG1: 2,
      OG2: 2,
      OG3: 2,
      KE1: 1,
      KO1: 1,
      HA1: 1,
      ER1: 1,
      CS1: 1,
    };
    const scores = calculateTeamRoleScores(selections);
    assert.equal(scores.OG, 100);
    assert.equal(scores.KE, Math.round((1 / 6) * 100));
    assert.equal(scores.MV, 0);
    const top = getTopRoles(scores);
    assert.equal(top[0].role, "OG");
    assert.equal(top.length, 3);
  });

  it("ignores unknown item ids defensively", () => {
    const scores = calculateTeamRoleScores({
      OG1: 1,
      XX9: 2,
    } as TeamRoleSelections);
    assert.equal(scores.OG, Math.round((1 / 6) * 100));
    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    assert.equal(sum, scores.OG);
  });
});

describe("peer aggregate (anonymity threshold)", () => {
  const pick = (ids: string[], top: string[]): TeamRoleSelections => {
    const sel: TeamRoleSelections = {};
    ids.forEach((id) => {
      sel[id] = top.includes(id) ? 2 : 1;
    });
    return sel;
  };
  const raterA = pick(
    ["OG1", "OG2", "OG3", "KE1", "KO1", "HA1", "ER1", "CS1"],
    ["OG1", "OG2", "OG3"],
  );
  const raterB = pick(
    ["OG1", "OG2", "MV1", "MV2", "KE1", "KO1", "HA1", "ER1"],
    ["OG1", "MV1", "MV2"],
  );
  const raterC = pick(
    ["OG1", "OG3", "MV1", "SZ1", "KE2", "KO2", "HA2", "ER2"],
    ["OG1", "OG3", "MV1"],
  );

  it("returns no scores below the rater threshold", () => {
    const agg = aggregatePeerRoleScores([raterA, raterB]);
    assert.equal(agg.raterCount, 2);
    assert.ok(agg.raterCount < TEAM_ROLE_PEER_MIN_RATERS);
    assert.equal(agg.scores, null);
    assert.equal(agg.topRoles.length, 0);
  });

  it("averages rater profiles at or above the threshold", () => {
    const agg = aggregatePeerRoleScores([raterA, raterB, raterC]);
    assert.equal(agg.raterCount, 3);
    assert.notEqual(agg.scores, null);
    assert.equal(agg.topRoles[0].role, "OG");
    // OG: A=100, B=(2+1+0? OG1=2,OG2=1 →3/6=50), C=(2+0+2 →4/6≈67) → átlag ~72
    assert.ok(agg.scores!.OG > agg.scores!.KE);
  });

  it("compares self and peer top-3 sets", () => {
    const diff = compareSelfAndPeerTopRoles(
      [{ role: "OG" as TeamRoleCode }, { role: "KE" as TeamRoleCode }, { role: "KO" as TeamRoleCode }],
      [{ role: "OG" as TeamRoleCode }, { role: "MV" as TeamRoleCode }, { role: "KO" as TeamRoleCode }],
    );
    assert.deepEqual([...diff.shared].sort(), ["KO", "OG"]);
    assert.deepEqual(diff.selfOnly, ["KE"]);
    assert.deepEqual(diff.peerOnly, ["MV"]);
  });
});
