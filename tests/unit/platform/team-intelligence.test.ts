import test from "node:test";
import assert from "node:assert/strict";
import type { SerializedTeamMember } from "@/lib/team-stats";
import {
  MIN_INTELLIGENCE_ASSESSMENTS,
  buildTeamIntelligencePriorities,
  resolveContributionPlacement,
  resolveTeamIntelligenceConfidence,
  resolveTeamIntelligenceQuality,
  resolveTeamTabRedirect,
} from "@/lib/team-intelligence";

function makeMember(
  id: string,
  role: string,
  scores: Record<string, number>,
): SerializedTeamMember {
  return {
    id,
    userId: id,
    displayName: `Member ${id}`,
    email: `${id}@example.com`,
    role,
    joinedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    scores,
    testType: "TRITAN",
    top3Dims: [],
    teamRoleScores: null,
    teamRoleSource: null,
  };
}

test("quality resolver follows minimum-assessment threshold", () => {
  assert.equal(resolveTeamIntelligenceQuality(0, 6), "none");
  assert.equal(resolveTeamIntelligenceQuality(MIN_INTELLIGENCE_ASSESSMENTS - 1, 6), "partial");
  assert.equal(resolveTeamIntelligenceQuality(MIN_INTELLIGENCE_ASSESSMENTS, 6), "sufficient");
});

test("confidence resolver maps quality to expected confidence", () => {
  assert.equal(resolveTeamIntelligenceConfidence("none"), "low");
  assert.equal(resolveTeamIntelligenceConfidence("partial"), "medium");
  assert.equal(resolveTeamIntelligenceConfidence("sufficient"), "high");
});

test("legacy roles tab redirects to intelligence", () => {
  assert.equal(resolveTeamTabRedirect("roles"), "intelligence");
  assert.equal(resolveTeamTabRedirect("intelligence"), null);
  assert.equal(resolveTeamTabRedirect(undefined), null);
});

test("priority engine flags missing assessment completions", () => {
  const priorities = buildTeamIntelligencePriorities({
    members: [],
    completedCount: 1,
    memberCount: 5,
    teamId: "team_1",
    orgId: "org_1",
    hasObserverRound: false,
    canManageTeamActions: true,
    locale: "hu",
  });

  assert.equal(priorities[0]?.id, "missing_assessments");
});

test("priority engine adds high spread trigger when a dimension range is wide", () => {
  const members: SerializedTeamMember[] = [
    makeMember("u1", "member", { INTE: 60, RESO: 45, TEMP: 20, ADAP: 60, THOR: 60, OPEN: 50 }),
    makeMember("u2", "member", { INTE: 61, RESO: 46, TEMP: 75, ADAP: 59, THOR: 58, OPEN: 52 }),
    makeMember("u3", "member", { INTE: 59, RESO: 44, TEMP: 24, ADAP: 61, THOR: 62, OPEN: 48 }),
    makeMember("u4", "member", { INTE: 60, RESO: 45, TEMP: 70, ADAP: 60, THOR: 61, OPEN: 50 }),
  ];

  const priorities = buildTeamIntelligencePriorities({
    members,
    completedCount: 4,
    memberCount: 4,
    teamId: "team_1",
    orgId: "org_1",
    hasObserverRound: true,
    canManageTeamActions: false,
    locale: "hu",
  });

  assert.equal(priorities.some((priority) => priority.id === "dimension_spread"), true);
});

test("priority engine adds leader-team mismatch trigger for large H/A delta", () => {
  const members: SerializedTeamMember[] = [
    makeMember("lead_1", "manager", { INTE: 80, RESO: 45, TEMP: 50, ADAP: 80, THOR: 55, OPEN: 50 }),
    makeMember("u2", "member", { INTE: 55, RESO: 48, TEMP: 52, ADAP: 55, THOR: 54, OPEN: 51 }),
    makeMember("u3", "member", { INTE: 54, RESO: 47, TEMP: 50, ADAP: 56, THOR: 56, OPEN: 49 }),
    makeMember("u4", "member", { INTE: 56, RESO: 46, TEMP: 49, ADAP: 54, THOR: 55, OPEN: 50 }),
  ];

  const priorities = buildTeamIntelligencePriorities({
    members,
    completedCount: 4,
    memberCount: 4,
    teamId: "team_1",
    orgId: "org_1",
    hasObserverRound: true,
    canManageTeamActions: false,
    locale: "hu",
  });

  assert.equal(priorities.some((priority) => priority.id === "leader_team_mismatch"), true);
});

// ─── resolveContributionPlacement ────────────────────────────────────────────

test("contribution placement: high C/H + low E lands in top delivery band", () => {
  const placement = resolveContributionPlacement({
    INTE: 80, RESO: 20, TEMP: 50, ADAP: 50, THOR: 85, OPEN: 50,
  });

  // delivery = 0.6*85 + 0.25*80 + 0.15*(100-20) = 83
  assert.equal(placement.deliveryScore, 83);
  assert.equal(placement.skillLevel, 3);
  assert.equal(placement.source, "self_estimate");
});

test("contribution placement: high O/X + low E lands in top growth band", () => {
  const placement = resolveContributionPlacement({
    INTE: 50, RESO: 25, TEMP: 75, ADAP: 50, THOR: 50, OPEN: 85,
  });

  // growth = 0.5*85 + 0.3*75 + 0.2*(100-25) = 80
  assert.equal(placement.growthScore, 80);
  assert.equal(placement.growthPotential, 3);
});

test("contribution placement: emotionality is inverted (high E lowers both axes)", () => {
  const calm = resolveContributionPlacement({ INTE: 50, RESO: 10, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50 });
  const anxious = resolveContributionPlacement({ INTE: 50, RESO: 90, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50 });

  assert.ok(calm.deliveryScore > anxious.deliveryScore);
  assert.ok(calm.growthScore > anxious.growthScore);
});

test("contribution placement: composite near band edge is low confidence", () => {
  // delivery composite lands exactly on the 60 boundary → distance 0 → low
  const placement = resolveContributionPlacement({
    INTE: 60, RESO: 40, TEMP: 80, ADAP: 50, THOR: 60, OPEN: 80,
  });

  assert.equal(placement.deliveryScore, 60);
  assert.equal(placement.confidence, "low");
});

test("contribution placement: composites far from both edges are high confidence", () => {
  const placement = resolveContributionPlacement({
    INTE: 90, RESO: 10, TEMP: 90, ADAP: 50, THOR: 90, OPEN: 90,
  });

  assert.ok(placement.deliveryScore >= 70);
  assert.ok(placement.growthScore >= 70);
  assert.equal(placement.confidence, "high");
});

test("contribution placement: middle profile lands in the middle band", () => {
  const placement = resolveContributionPlacement({
    INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50,
  });

  assert.equal(placement.skillLevel, 2);
  assert.equal(placement.growthPotential, 2);
});

// ─── canViewRawTeamResults (report gating, F1) ──────────────────────────────

test("raw team results are consultant-only", async () => {
  const { canViewRawTeamResults } = await import("@/lib/team-auth");
  assert.equal(canViewRawTeamResults("ORG_CONSULTANT"), true);
  assert.equal(canViewRawTeamResults("ORG_ADMIN"), false);
  assert.equal(canViewRawTeamResults("ORG_MANAGER"), false);
  assert.equal(canViewRawTeamResults("ORG_MEMBER"), false);
  assert.equal(canViewRawTeamResults(null), false);
});
