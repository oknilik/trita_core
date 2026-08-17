import assert from "node:assert/strict";
import test from "node:test";
import { PSYCH_SAFETY_ITEMS } from "../../../src/lib/psych-safety";
import { TEAM_ROLES } from "../../../src/lib/team-role-scoring";
import {
  PSYCH_SAFETY_TARGET_ITEM_IDS,
  TEAM_ROLE_TARGET_CODES,
  parseTeamActionTarget,
  teamActionTargetFromKey,
  teamActionTargetKey,
  teamActionTargetOptions,
} from "../../../src/lib/team-action-target";

test("a célmutató-kódlisták a kanonikus mérési készleteket fedik", () => {
  assert.deepEqual(
    [...PSYCH_SAFETY_TARGET_ITEM_IDS],
    PSYCH_SAFETY_ITEMS.map((item) => item.id),
  );
  assert.deepEqual([...TEAM_ROLE_TARGET_CODES], Object.keys(TEAM_ROLES));
});

test("minden célmutató select-kulcsa veszteség nélkül visszaolvasható", () => {
  for (const option of teamActionTargetOptions("hu")) {
    assert.deepEqual(teamActionTargetFromKey(option.key), option.target);
    assert.equal(teamActionTargetKey(option.target), option.key);
  }
});

test("ismeretlen itemet, szerepet és kindot fail-closed elutasít", () => {
  assert.equal(
    parseTeamActionTarget({ kind: "psych_safety_item", itemId: "PS99" }),
    undefined,
  );
  assert.equal(
    parseTeamActionTarget({ kind: "role_gap", roleCode: "UNKNOWN" }),
    undefined,
  );
  assert.equal(parseTeamActionTarget({ kind: "revenue" }), undefined);
});
