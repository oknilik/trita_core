import test from "node:test";
import assert from "node:assert/strict";
import type { SerializedTeamMember } from "@/lib/team-stats";
import {
  MIN_INTELLIGENCE_ASSESSMENTS,
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
    testType: "HEXACO",
    top3Dims: [],
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
    makeMember("u1", "member", { H: 60, E: 45, X: 20, A: 60, C: 60, O: 50 }),
    makeMember("u2", "member", { H: 61, E: 46, X: 75, A: 59, C: 58, O: 52 }),
    makeMember("u3", "member", { H: 59, E: 44, X: 24, A: 61, C: 62, O: 48 }),
    makeMember("u4", "member", { H: 60, E: 45, X: 70, A: 60, C: 61, O: 50 }),
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
    makeMember("lead_1", "manager", { H: 80, E: 45, X: 50, A: 80, C: 55, O: 50 }),
    makeMember("u2", "member", { H: 55, E: 48, X: 52, A: 55, C: 54, O: 51 }),
    makeMember("u3", "member", { H: 54, E: 47, X: 50, A: 56, C: 56, O: 49 }),
    makeMember("u4", "member", { H: 56, E: 46, X: 49, A: 54, C: 55, O: 50 }),
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
