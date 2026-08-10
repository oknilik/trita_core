import test from "node:test";
import assert from "node:assert/strict";
import type { SerializedTeamMember } from "@/lib/team-stats";
import {
  MIN_INTELLIGENCE_ASSESSMENTS,
  buildTeamIntelligenceEvidence,
  buildTeamIntelligencePriorities,
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
  // A TeamMember.role kötött készlete: "member" | "manager" | "admin" —
  // mindkét kezelő szerep vezetőnek számít.
  for (const leaderRole of ["manager", "admin"] as const) {
    const members: SerializedTeamMember[] = [
      makeMember("lead_1", leaderRole, { INTE: 80, RESO: 45, TEMP: 50, ADAP: 80, THOR: 55, OPEN: 50 }),
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

    assert.equal(
      priorities.some((priority) => priority.id === "leader_team_mismatch"),
      true,
      `leader role: ${leaderRole}`,
    );
  }
});

test("priority engine falls back to a dedicated healthy_baseline card", () => {
  const members: SerializedTeamMember[] = [
    makeMember("u1", "member", { INTE: 55, RESO: 48, TEMP: 52, ADAP: 55, THOR: 54, OPEN: 51 }),
    makeMember("u2", "member", { INTE: 54, RESO: 47, TEMP: 50, ADAP: 56, THOR: 56, OPEN: 49 }),
    makeMember("u3", "member", { INTE: 56, RESO: 46, TEMP: 49, ADAP: 54, THOR: 55, OPEN: 50 }),
  ];

  const priorities = buildTeamIntelligencePriorities({
    members,
    completedCount: 3,
    memberCount: 3,
    teamId: "team_1",
    orgId: "org_1",
    hasObserverRound: true,
    canManageTeamActions: true,
    locale: "hu",
  });

  assert.equal(priorities.length, 1);
  assert.equal(priorities[0].id, "healthy_baseline");
});

// ─── buildTeamIntelligenceEvidence — dinamika-provenance ─────────────────────

test("dynamics evidence: purely estimated edges stay self-sourced, low confidence", () => {
  const evidence = buildTeamIntelligenceEvidence({
    assessedCount: 4,
    totalCount: 4,
    dynamicsEdgeCount: 6,
    measuredDynamicsEdgeCount: 0,
    locale: "en",
  });

  assert.equal(evidence.dynamics.source, "self");
  assert.equal(evidence.dynamics.quality, "partial");
  assert.equal(evidence.dynamics.confidence, "low");
});

test("dynamics evidence: measured trust edges raise source and confidence", () => {
  const evidence = buildTeamIntelligenceEvidence({
    assessedCount: 4,
    totalCount: 4,
    dynamicsEdgeCount: 6,
    measuredDynamicsEdgeCount: 2,
    locale: "en",
  });

  assert.equal(evidence.dynamics.source, "self_plus_observer");
  assert.equal(evidence.dynamics.confidence, "medium");
});

test("dynamics evidence: no edges at all → quality none", () => {
  const evidence = buildTeamIntelligenceEvidence({
    assessedCount: 4,
    totalCount: 4,
    dynamicsEdgeCount: 0,
    measuredDynamicsEdgeCount: 0,
    locale: "en",
  });

  assert.equal(evidence.dynamics.quality, "none");
  assert.equal(evidence.dynamics.confidence, "low");
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
