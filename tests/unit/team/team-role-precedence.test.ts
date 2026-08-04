import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  estimateTeamRolesFromTritan,
  resolveDisplayRoleScores,
} from "@/lib/team-role-estimate";
import { getTopRoles } from "@/lib/team-role-scoring";

const NEUTRAL_TRITAN = {
  INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50,
} as const;

describe("resolveDisplayRoleScores — kitöltött kérdőív > becslés", () => {
  it("kitöltött kérdőívnél a mért pontszámokat adja questionnaire forrással", () => {
    const measured = { OG: 83, KE: 17, KO: 33, HA: 0, ER: 50, CS: 67, MV: 100, MI: 33, SZ: 17 };
    const resolved = resolveDisplayRoleScores(measured, NEUTRAL_TRITAN);
    assert.equal(resolved.source, "questionnaire");
    assert.deepEqual(resolved.scores, measured);
    assert.equal(getTopRoles(resolved.scores, 1)[0].role, "MV");
  });

  it("mért adat nélkül becslésre esik vissza", () => {
    const resolved = resolveDisplayRoleScores(null, NEUTRAL_TRITAN);
    assert.equal(resolved.source, "estimate");
    assert.deepEqual(resolved.scores, estimateTeamRolesFromTritan(NEUTRAL_TRITAN));
  });

  it("csak legacy (ismeretlen) kulcsú mért sorra becslésre esik vissza", () => {
    const legacyOnly = { PL: 70, CO: 60, SH: 55 };
    const resolved = resolveDisplayRoleScores(legacyOnly, NEUTRAL_TRITAN);
    assert.equal(resolved.source, "estimate");
  });

  it("vegyes kulcsoknál csak az ismert szerep-kódok maradnak, questionnaire forrással", () => {
    const mixed = { OG: 83, PL: 70, KE: 33 };
    const resolved = resolveDisplayRoleScores(mixed, NEUTRAL_TRITAN);
    assert.equal(resolved.source, "questionnaire");
    assert.deepEqual(Object.keys(resolved.scores).sort(), ["KE", "OG"]);
  });

  it("a becslés rangsora reagál a TRITAN-profilra (magas TEMP → hajtó/kapcsolatépítő szerepek elöl)", () => {
    const highTemp = { ...NEUTRAL_TRITAN, TEMP: 90, ADAP: 30 };
    const resolved = resolveDisplayRoleScores(undefined, highTemp);
    assert.equal(resolved.source, "estimate");
    const top = getTopRoles(resolved.scores, 2).map((r) => r.role);
    assert.ok(top.includes("HA"), `HA hiányzik a top2-ből: ${top.join(",")}`);
  });
});
