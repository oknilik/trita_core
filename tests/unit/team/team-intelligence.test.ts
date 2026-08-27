import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildTeamIntelligencePriorities } from "@/lib/team-intelligence";
import type { SerializedTeamMember } from "@/lib/team-stats";

// ── Fixtúrák ────────────────────────────────────────────────────────────────

const FULL_SCORES = {
  H: 50,
  E: 50,
  X: 50,
  A: 50,
  C: 50,
  O: 50,
};

/** Mért szerep-kérdőív, ahol az adott szerep az elsődleges. */
function measuredTop(role: string): Record<string, number> {
  const base: Record<string, number> = {
    OG: 0, KE: 0, KO: 0, HA: 0, ER: 0, CS: 0, MV: 0, MI: 0, SZ: 0,
  };
  base[role] = 9;
  return base;
}

function member(
  userId: string,
  overrides: Partial<SerializedTeamMember> = {},
): SerializedTeamMember {
  return {
    id: `tm_${userId}`,
    userId,
    displayName: userId,
    email: null,
    role: "member",
    joinedAt: "2026-01-01T00:00:00.000Z",
    scores: null,
    testType: null,
    top3Dims: [],
    teamRoleScores: null,
    teamRoleSource: null,
    ...overrides,
  };
}

function buildPriorities(members: SerializedTeamMember[]) {
  return buildTeamIntelligencePriorities({
    members,
    completedCount: members.filter((m) => m.scores !== null).length,
    memberCount: members.length,
    teamId: "team_1",
    orgId: null,
    hasObserverRound: false,
    canManageTeamActions: false,
    locale: "hu",
  });
}

// ── FIX 5: a szerep-lefedettség MINDEN tagból számolódik ────────────────────

describe("buildTeamIntelligencePriorities – szerep-lefedettség minden tagból", () => {
  it("regresszió: teszt nélküli tag MÉRT kulcsszerepe lefedettségnek számít – nincs hamis 'Hiányzó kulcsszerep'", () => {
    const members = [
      member("u1", { scores: { ...FULL_SCORES }, teamRoleSource: "questionnaire", teamRoleScores: measuredTop("HA") }),
      member("u2", { scores: { ...FULL_SCORES }, teamRoleSource: "questionnaire", teamRoleScores: measuredTop("ER") }),
      member("u3", { scores: { ...FULL_SCORES }, teamRoleSource: "questionnaire", teamRoleScores: measuredTop("MV") }),
      member("u4", { scores: { ...FULL_SCORES }, teamRoleSource: "questionnaire", teamRoleScores: measuredTop("CS") }),
      // KO-t az a tag hozza, akinek NINCS személyiség-tesztje, csak mért
      // szerep-kérdőíve – a régi kód (csak scores-os tagok) őt eldobta.
      member("u5", { scores: null, teamRoleSource: "questionnaire", teamRoleScores: measuredTop("KO") }),
    ];
    const priorities = buildPriorities(members);
    assert.ok(
      !priorities.some((p) => p.id === "role_coverage_gap"),
      "lefedett kulcsszerep hamisan hiányzóként jelent meg",
    );
  });

  it("tisztán MÉRT szerepképnél a hiány-indoklás a mért változat (nem 'becsült')", () => {
    // Minden szerep mért, de a kulcsszerepek (KO/HA/ER) nincsenek lefedve.
    const members = ["u1", "u2", "u3", "u4"].map((id) =>
      member(id, {
        scores: { ...FULL_SCORES },
        teamRoleSource: "questionnaire",
        teamRoleScores: measuredTop("OG"),
      }),
    );
    const priorities = buildPriorities(members);
    const gap = priorities.find((p) => p.id === "role_coverage_gap");
    assert.ok(gap, "hiányzó kulcsszerep prioritásnak kell lennie");
    assert.ok(gap!.reason.startsWith("A mért szerepképben"), gap!.reason);
    assert.ok(!gap!.reason.includes("becsült"), gap!.reason);
  });

  it("tisztán becsült szerepképnél marad a 'becsült' indoklás", () => {
    // Azonos (csupa 50) profilokból a becslés minden tagnál ugyanazt az
    // elsődleges szerepet adja → a 3 kulcsszerep nem lehet mind lefedett.
    const members = ["u1", "u2", "u3", "u4"].map((id) =>
      member(id, { scores: { ...FULL_SCORES } }),
    );
    const priorities = buildPriorities(members);
    const gap = priorities.find((p) => p.id === "role_coverage_gap");
    assert.ok(gap, "hiányzó kulcsszerep prioritásnak kell lennie");
    assert.ok(gap!.reason.startsWith("A becsült szerepképben"), gap!.reason);
  });

  it("vegyes (mért + becsült) képnél a vegyes indoklás-változat jár", () => {
    const members = [
      member("u1", { scores: { ...FULL_SCORES }, teamRoleSource: "questionnaire", teamRoleScores: measuredTop("OG") }),
      member("u2", { scores: { ...FULL_SCORES }, teamRoleSource: "questionnaire", teamRoleScores: measuredTop("KE") }),
      member("u3", { scores: { ...FULL_SCORES }, teamRoleSource: "questionnaire", teamRoleScores: measuredTop("SZ") }),
      // becslés-ág: nincs mért kérdőív, teljes profilból becslünk
      member("u4", { scores: { ...FULL_SCORES } }),
    ];
    const priorities = buildPriorities(members);
    const gap = priorities.find((p) => p.id === "role_coverage_gap");
    assert.ok(gap, "hiányzó kulcsszerep prioritásnak kell lennie");
    assert.ok(gap!.reason.startsWith("A részben mért, részben becsült"), gap!.reason);
  });
});
