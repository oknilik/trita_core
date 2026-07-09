import test from "node:test";
import assert from "node:assert/strict";
import { assertJourneyInvariants, enforceJourneyGuardrails } from "@/lib/journey/guardrails";
import {
  buildJourneyContext,
  buildJourneyState,
} from "../../factories/journey-fixture-builder";

function createState() {
  return buildJourneyState("ORG_PARTIAL", {
    recommendedNextAction: {
      id: "LAUNCH_ORG_CAMPAIGN",
      href: "/org/o1/campaigns/new",
      scope: "org",
    },
    availableNextActions: [
      {
        id: "LAUNCH_ORG_CAMPAIGN",
        href: "/org/o1/campaigns/new",
        scope: "org",
      },
      {
        id: "VIEW_ORG_INSIGHTS",
        href: "/org/o1",
        scope: "org",
      },
    ],
  });
}

test("enforces unfinished assessment guardrail", () => {
  const context = buildJourneyContext({
    assessment: { started: true, completed: false },
  });
  const result = enforceJourneyGuardrails({
    context,
    state: createState(),
    home: {
      activeSurface: "org",
      destination: "/dashboard",
      reason: "org_cockpit",
    },
  });

  assert.equal(result.home.destination, "/assessment");
  assert.equal(result.home.reason, "assessment_continuation");
  assert.equal(result.home.activeSurface, "continuation");
});

test("enforces pending join before team/org home", () => {
  const context = buildJourneyContext({
    pendingJoinInvite: {
      kind: "org",
      inviteId: "inv123",
      email: "a@b.com",
      teamId: null,
      orgId: "o1",
      role: "ORG_MEMBER",
      createdAt: new Date(),
    },
  });
  const result = enforceJourneyGuardrails({
    context,
    state: createState(),
    home: {
      activeSurface: "org",
      destination: "/dashboard",
      reason: "org_cockpit",
    },
  });

  assert.equal(result.home.destination, "/join/org/inv123");
  assert.equal(result.home.reason, "pending_join");
  assert.equal(result.home.activeSurface, "continuation");
});

test("filters create/manage actions in restricted state", () => {
  const context = buildJourneyContext({
    currentContext: "org-member",
    orgId: "o1",
    orgMembership: { orgId: "o1", role: "ORG_MEMBER", joinedAt: new Date() },
    subscription: { state: "restricted", orgId: "o1", status: "past_due" },
  });
  const result = enforceJourneyGuardrails({
    context,
    state: createState(),
    home: {
      activeSurface: "org",
      destination: "/dashboard",
      reason: "org_cockpit",
    },
  });

  assert.equal(result.restrictionFlags.disableOrgWriteActions, true);
  assert.equal(result.state.availableNextActions.some((a) => a.id === "LAUNCH_ORG_CAMPAIGN"), false);
  assert.equal(result.state.recommendedNextAction?.id, "VIEW_ORG_INSIGHTS");
});

test("self-only users never keep org home", () => {
  const context = buildJourneyContext({
    currentContext: "self-only",
    assessment: { completed: true, started: true, hasResult: true },
  });
  const result = enforceJourneyGuardrails({
    context,
    state: createState(),
    home: {
      activeSurface: "org",
      destination: "/dashboard",
      reason: "org_cockpit",
    },
  });

  assert.equal(result.home.activeSurface, "personal");
  assert.equal(result.home.destination, "/profile/results");
  assert.equal(result.home.reason, "personal_home");
});

test("assertJourneyInvariants reports violations", () => {
  const context = buildJourneyContext({
    assessment: { started: true, completed: false },
  });
  const state = createState();
  const violations = assertJourneyInvariants({
    context,
    state,
    home: {
      activeSurface: "org",
      destination: "/dashboard",
      reason: "org_cockpit",
    },
    restrictionFlags: {
      subscriptionState: "restricted",
      missingOrgSubscription: false,
      readOnlyOrgViews: true,
      disableOrgWriteActions: true,
      hideDetailedOrgInsights: false,
      requiresSubscriptionAction: true,
    },
  });

  assert.ok(violations.some((v) => v.code === "UNFINISHED_ASSESSMENT_NOT_FORCED"));
  assert.ok(violations.some((v) => v.code === "SELF_ONLY_ORG_HOME"));
  assert.ok(violations.some((v) => v.code === "RESTRICTED_WRITE_ACTION_EXPOSED"));
});
