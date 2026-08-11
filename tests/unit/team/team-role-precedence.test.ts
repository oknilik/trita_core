import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  estimateTeamRolesFromTritan,
  hasCompleteTritanDims,
  resolveDisplayRoleScores,
} from "@/lib/team-role-estimate";
import { getTopRoles, type TeamRoleCode } from "@/lib/team-role-scoring";

const NEUTRAL_TRITAN = {
  INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50,
} as const;

// Teljes (mind a 9 kanonikus kódot tartalmazó) mért sor — a valódi submit
// (calculateTeamRoleScores) mindig ilyet perzisztál.
const FULL_MEASURED = {
  OG: 83, KE: 17, KO: 33, HA: 0, ER: 50, CS: 67, MV: 100, MI: 33, SZ: 17,
} as const;

describe("resolveDisplayRoleScores — kitöltött kérdőív > becslés", () => {
  it("kitöltött kérdőívnél a mért pontszámokat adja questionnaire forrással", () => {
    const measured = { ...FULL_MEASURED };
    const resolved = resolveDisplayRoleScores(measured, NEUTRAL_TRITAN);
    assert.ok(resolved);
    assert.equal(resolved.source, "questionnaire");
    assert.deepEqual(resolved.scores, measured);
    assert.equal(getTopRoles(resolved.scores, 1)[0].role, "MV");
  });

  it("mért adat nélkül becslésre esik vissza", () => {
    const resolved = resolveDisplayRoleScores(null, NEUTRAL_TRITAN);
    assert.ok(resolved);
    assert.equal(resolved.source, "estimate");
    assert.deepEqual(resolved.scores, estimateTeamRolesFromTritan(NEUTRAL_TRITAN));
  });

  it("becslés-ágon az exact a kerekítetlen összegeket hordozza (S2 holtverseny-evidencia), mért ágon nincs", () => {
    const estimated = resolveDisplayRoleScores(null, { ...NEUTRAL_TRITAN, TEMP: 63, ADAP: 47 });
    assert.ok(estimated);
    assert.equal(estimated.source, "estimate");
    assert.ok(estimated.exact, "a becslés-ág nem adott exact evidenciát");
    const exactMap: Partial<Record<TeamRoleCode, number>> = estimated.exact ?? {};
    for (const [role, rounded] of Object.entries(estimated.scores)) {
      const exactValue: number | undefined = exactMap[role as TeamRoleCode];
      assert.equal(typeof exactValue, "number");
      assert.equal(
        Math.round(exactValue as number),
        rounded,
        `${role}: az exact nem a scores kerekítetlen párja`,
      );
    }

    const measured = resolveDisplayRoleScores({ ...FULL_MEASURED }, NEUTRAL_TRITAN);
    assert.ok(measured);
    assert.equal(measured.source, "questionnaire");
    assert.equal(measured.exact, undefined, "mért ágon nincs exact — a perzisztált pontszám a jel");
  });

  it("csak legacy (ismeretlen) kulcsú mért sorra becslésre esik vissza", () => {
    const legacyOnly = { PL: 70, CO: 60, SH: 55 };
    const resolved = resolveDisplayRoleScores(legacyOnly, NEUTRAL_TRITAN);
    assert.ok(resolved);
    assert.equal(resolved.source, "estimate");
  });

  it("vegyes kulcsoknál csak az ismert szerep-kódok maradnak, questionnaire forrással", () => {
    // Teljes kanonikus készlet + egy legacy kulcs: a legacy kiesik, a 9
    // kanonikus marad, a forrás mért.
    const mixed = { ...FULL_MEASURED, PL: 70 };
    const resolved = resolveDisplayRoleScores(mixed, NEUTRAL_TRITAN);
    assert.ok(resolved);
    assert.equal(resolved.source, "questionnaire");
    assert.deepEqual(
      Object.keys(resolved.scores).sort(),
      ["CS", "ER", "HA", "KE", "KO", "MI", "MV", "OG", "SZ"],
    );
  });

  it("RÉSZLEGES mért sor (pl. csak OG) NEM mérvadó — becslésre esik vissza", () => {
    // Örökség/sérült sor: mértként elfogadva a többi 8 szerepre elnyomná a
    // becslést, és csonka profilt mutatna „kitöltött" badge-dzsel.
    const resolved = resolveDisplayRoleScores({ OG: 100 }, NEUTRAL_TRITAN);
    assert.ok(resolved);
    assert.equal(resolved.source, "estimate");
    assert.deepEqual(resolved.scores, estimateTeamRolesFromTritan(NEUTRAL_TRITAN));
  });

  it("részleges mért sor + hiányos TRITAN → null (se mért, se becsülhető)", () => {
    assert.equal(resolveDisplayRoleScores({ OG: 100 }, { INTE: 80 }), null);
  });

  it("prototípus-lánc kulcsok (constructor/toString) nem számítanak szerep-kódnak", () => {
    // Az `in`-alapú szűrő ezeket átengedné (a TEAM_ROLES prototípus-láncán
    // léteznek) — own-key (Object.hasOwn) szűréssel becslésre esik vissza.
    const poisoned = { constructor: 90, toString: 80, hasOwnProperty: 70 };
    const resolved = resolveDisplayRoleScores(poisoned, NEUTRAL_TRITAN);
    assert.ok(resolved);
    assert.equal(resolved.source, "estimate");
    for (const key of Object.keys(resolved.scores)) {
      assert.notEqual(key, "constructor");
      assert.notEqual(key, "toString");
      assert.notEqual(key, "hasOwnProperty");
    }
  });

  it("a becslés rangsora reagál a TRITAN-profilra (magas TEMP → hajtó/kapcsolatépítő szerepek elöl)", () => {
    const highTemp = { ...NEUTRAL_TRITAN, TEMP: 90, ADAP: 30 };
    const resolved = resolveDisplayRoleScores(undefined, highTemp);
    assert.ok(resolved);
    assert.equal(resolved.source, "estimate");
    const top = getTopRoles(resolved.scores, 2).map((r) => r.role);
    assert.ok(top.includes("HA"), `HA hiányzik a top2-ből: ${top.join(",")}`);
  });

  it("részleges dimenzió-készletből NEM becsül — null, nem default-feltöltött szerep", () => {
    // Örökség/sérült sor: csak 2 dimenzió van meg a 6-ból.
    assert.equal(resolveDisplayRoleScores(null, { INTE: 80, TEMP: 20 }), null);
    assert.equal(resolveDisplayRoleScores(null, null), null);
    assert.equal(resolveDisplayRoleScores(null, {}), null);
  });

  it("mért kérdőív részleges TRITAN mellett is megjelenik (a becslés-kapu csak a fallbackra vonatkozik)", () => {
    const resolved = resolveDisplayRoleScores({ ...FULL_MEASURED }, { INTE: 80 });
    assert.ok(resolved);
    assert.equal(resolved.source, "questionnaire");
  });
});

describe("hasCompleteTritanDims — becslés-teljességi kapu", () => {
  it("mind a 6 dimenzió számként → true; hiányzó vagy nem-szám kulcs → false", () => {
    assert.equal(hasCompleteTritanDims(NEUTRAL_TRITAN), true);
    assert.equal(hasCompleteTritanDims({ ...NEUTRAL_TRITAN, OPEN: undefined }), false);
    assert.equal(hasCompleteTritanDims(null), false);
  });
});
