import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { getAccessPolicy } from "@/lib/policy-engine";
import { resolveManagerCockpitAccess } from "@/lib/manager-cockpit-core";
import { getManagerCockpitTeamStats, type ManagerCockpitDatabase } from "@/lib/manager-cockpit";
import type { SubscriptionCapabilityPolicyState } from "@/lib/capabilities";

function access(state: SubscriptionCapabilityPolicyState, consultant = false) {
  const policy = getAccessPolicy(
    { orgRole: consultant ? "ORG_CONSULTANT" : "ORG_MANAGER", membership: { orgId: "org" } },
    { capabilityPolicyState: state, activeOrgId: "org" },
  );
  return resolveManagerCockpitAccess(policy, consultant);
}

function databaseFixture(frozen = false) {
  return {
    team: { findMany: mock.fn(async (_args: unknown) => frozen ? [{
      id: "team", name: "Team", _count: { members: 4, pendingInvites: 1 },
    }] : [{ id: "team", name: "Team", members: [
      { role: "manager", user: { id: "one", username: "One", email: null } },
      { role: "member", user: { id: "two", username: "Two", email: null } },
    ] }]) },
    assessmentResult: { findMany: mock.fn(async (_args: unknown) => [
      // Even an overly broad upstream fixture must not leak values to managers.
      { userProfileId: "one", scores: { H: 91, E: 33 } },
    ]) },
    trustObservation: { findMany: mock.fn(async () => []) },
    teamPendingInvite: { groupBy: mock.fn(async () => []) },
    campaign: { findMany: mock.fn(async () => []) },
    observerInvitation: { findMany: mock.fn(async () => []) },
  };
}

for (const state of ["active", "trialing", "restricted", "past_due", "frozen", "none"] as const) {
  test(`ordinary manager never receives raw results in ${state}`, () => {
    assert.equal(access(state).canViewRaw, false);
    assert.equal(access(state).canViewProgress, state !== "frozen" && state !== "none");
    assert.equal(access(state).readOnly, state !== "active" && state !== "trialing");
  });
  test(`consultant raw access follows detailed read permission in ${state}`, () => {
    assert.equal(access(state, true).canViewRaw, state !== "frozen" && state !== "none");
  });
}

test("team-level manager remains actionable with active access even with ORG_MEMBER role", () => {
  const policy = getAccessPolicy(
    { orgRole: "ORG_MEMBER", teamRole: "manager", membership: { orgId: "org", teamId: "team" } },
    { capabilityPolicyState: "active", activeOrgId: "org", activeTeamId: "team" },
  );
  assert.equal(resolveManagerCockpitAccess(policy, false).readOnly, false);
});

for (const state of ["active", "restricted"] as const) {
  test(`${state} manager query selects completion only and never loads trust answers`, async () => {
    const database = databaseFixture();
    const [team] = await getManagerCockpitTeamStats(["team"], "org", access(state), database as unknown as ManagerCockpitDatabase);
    const query = database.assessmentResult.findMany.mock.calls[0].arguments[0] as { select: unknown };
    assert.deepEqual(query.select, { userProfileId: true });
    assert.equal(database.trustObservation.findMany.mock.callCount(), 0);
    assert.equal(team.completedCount, 1);
    assert.equal(team.members[0].hasSelfAssessment, true);
    assert.ok(team.members.every((member) => member.scores === null));
    assert.deepEqual(team.dynamicsEdges, []);
    assert.ok(!JSON.stringify(team).includes('"H":91'));
  });
}

test("frozen cockpit queries only basic team counts, with no assessments or member details", async () => {
  const database = databaseFixture(true);
  const [team] = await getManagerCockpitTeamStats(["team"], "org", access("frozen", true), database as unknown as ManagerCockpitDatabase);
  assert.equal(database.assessmentResult.findMany.mock.callCount(), 0);
  assert.equal(database.trustObservation.findMany.mock.callCount(), 0);
  const query = database.team.findMany.mock.calls[0].arguments[0] as { select: unknown };
  assert.deepEqual(query.select, {
    id: true, name: true, _count: { select: { members: true, pendingInvites: true } },
  });
  assert.deepEqual(team.members, []);
  assert.equal(team.memberCount, 4);
  assert.equal(team.pendingInviteCount, 1);
});
