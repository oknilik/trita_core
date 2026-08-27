import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildIntelligenceViewData } from "@/app/(app)/team/[id]/_tabs/intelligence-data";
import type { TeamPageData } from "@/lib/team-stats";

// ── Fixtúra ─────────────────────────────────────────────────────────────────

const FULL_SCORES = {
  H: 61.4,
  E: 40,
  X: 55,
  A: 48,
  C: 70,
  O: 52,
};

function teamData(overrides: Partial<TeamPageData> = {}): TeamPageData {
  return {
    teamId: "team_1",
    teamName: "Teszt csapat",
    teamCreatedAt: "2026-01-01T00:00:00.000Z",
    orgId: null,
    orgName: null,
    memberCount: 0,
    completedCount: 0,
    dimAvg: null,
    activeCampaign: null,
    dynamicsEdges: [],
    trustHubUserIds: [],
    members: [],
    pendingInvites: [],
    heatmapRows: [],
    dimConfigs: [],
    patternResult: null,
    ...overrides,
  };
}

function member(
  userId: string,
  scores: Record<string, number> | null,
): TeamPageData["members"][number] {
  return {
    id: `tm_${userId}`,
    userId,
    displayName: userId,
    email: null,
    role: "member",
    joinedAt: "2026-01-01T00:00:00.000Z",
    scores,
    testType: null,
    top3Dims: [],
    teamRoleScores: null,
    teamRoleSource: null,
  };
}

function build(data: TeamPageData) {
  return buildIntelligenceViewData({
    teamData: data,
    teamId: data.teamId,
    locale: "hu",
    canReachOrgCampaigns: false,
  });
}

// ── FIX 6: nincs kitalált 50-es dimenzió-érték ──────────────────────────────

describe("buildIntelligenceViewData – nincs fabrikált dimenzió-adat", () => {
  it("kitöltetlen tag tritan-ja üres (nem csupa 50), hasAssessmentData false", () => {
    const vm = build(
      teamData({ members: [member("u1", null)], memberCount: 1 }),
    );
    assert.deepEqual(vm.intelligenceMembers[0].tritan, {});
    assert.equal(vm.intelligenceMembers[0].hasAssessmentData, false);
    assert.equal(vm.assessedCount, 0);
  });

  it("részleges profilnál csak a jelen lévő dimenziók kerülnek át, hasAssessmentData false", () => {
    const vm = build(
      teamData({
        members: [member("u1", { H: 80, X: 20 })],
        memberCount: 1,
      }),
    );
    assert.deepEqual(vm.intelligenceMembers[0].tritan, { H: 80, X: 20 });
    // Részleges készletből nem állítunk teljes profilt (hasCompleteTritanDims kapu).
    assert.equal(vm.intelligenceMembers[0].hasAssessmentData, false);
  });

  it("teljes profilnál mind a hat dimenzió (kerekítve) átmegy, hasAssessmentData true", () => {
    const vm = build(
      teamData({
        members: [member("u1", { ...FULL_SCORES })],
        memberCount: 1,
        completedCount: 1,
      }),
    );
    assert.deepEqual(vm.intelligenceMembers[0].tritan, {
      H: 61,
      E: 40,
      X: 55,
      A: 48,
      C: 70,
      O: 52,
    });
    assert.equal(vm.intelligenceMembers[0].hasAssessmentData, true);
    assert.equal(vm.assessedCount, 1);
  });
});

// ── FIX 7: mért trust-hub jelölés átadása a térképnek ───────────────────────

describe("buildIntelligenceViewData – trust-hub jelölés", () => {
  it("a trustHubUserIds-ben szereplő tag isTrustHub jelölést kap", () => {
    const vm = build(
      teamData({
        members: [member("u1", { ...FULL_SCORES }), member("u2", null)],
        memberCount: 2,
        trustHubUserIds: ["u2"],
      }),
    );
    assert.equal(vm.intelligenceMembers.find((m) => m.id === "u1")?.isTrustHub, false);
    assert.equal(vm.intelligenceMembers.find((m) => m.id === "u2")?.isTrustHub, true);
  });
});
