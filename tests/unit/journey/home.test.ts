import test from "node:test";
import assert from "node:assert/strict";
import { resolveHome } from "@/lib/journey/home";
import {
  buildJourneyContext,
  buildJourneyState,
} from "../../factories/journey-fixture-builder";

test("pending join invite has highest priority", () => {
  const context = buildJourneyContext({
    currentContext: "org-admin",
    pendingJoinInvite: {
      kind: "org",
      inviteId: "inv123",
      token: "tok_inv123",
      email: "test@trita.app",
      teamId: null,
      orgId: "org2",
      role: "ORG_MEMBER",
      createdAt: new Date(),
    },
  });
  const state = buildJourneyState("TEAM_READY");

  const result = resolveHome({ context, state });
  assert.equal(result.activeSurface, "continuation");
  assert.equal(result.home.reason, "pending_join");
  assert.equal(result.home.destination, "/join/org/tok_inv123");
});

test("self in progress goes to assessment", () => {
  const context = buildJourneyContext({
    assessment: { started: true, completed: false, skipped: false, hasDraft: true, hasResult: false },
  });
  const state = buildJourneyState("SELF_IN_PROGRESS");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "continuation");
  assert.equal(result.home.reason, "assessment_continuation");
  assert.equal(result.home.destination, "/assessment");
});

test("admin goes to org cockpit", () => {
  const context = buildJourneyContext({
    currentContext: "org-admin",
    orgId: "org_1",
    assessment: { started: true, completed: true, skipped: false, hasDraft: false, hasResult: true },
  });
  const state = buildJourneyState("TEAM_READY");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "org");
  assert.equal(result.home.reason, "org_cockpit");
  assert.equal(result.home.destination, "/org/org_1");
});

test("manager goes to manager cockpit", () => {
  const context = buildJourneyContext({
    currentContext: "org-manager",
    assessment: { started: true, completed: true, skipped: false, hasDraft: false, hasResult: true },
  });
  const state = buildJourneyState("TEAM_READY");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "team");
  assert.equal(result.home.reason, "manager_cockpit");
  assert.equal(result.home.destination, "/manager");
});

test("org member without completed self is redirected to assessment", () => {
  const context = buildJourneyContext({
    currentContext: "org-member",
    assessment: { started: true, completed: false, skipped: false, hasDraft: true, hasResult: false },
  });
  const state = buildJourneyState("SELF_IN_PROGRESS");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "continuation");
  assert.equal(result.home.destination, "/assessment");
});

test("org member with completed self can land on team home", () => {
  const context = buildJourneyContext({
    currentContext: "org-member",
    assessment: { started: true, completed: true, skipped: false, hasDraft: false, hasResult: true },
    teamId: "team42",
  });
  const state = buildJourneyState("TEAM_NOT_JOINED");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "team");
  assert.equal(result.home.reason, "team_home");
  assert.equal(result.home.destination, "/team/team42");
});

test("org member with completed self but no team goes to personal home (nem az org-cockpitra — redirect-loop guard)", () => {
  const context = buildJourneyContext({
    currentContext: "org-member",
    orgId: "org_1",
    assessment: { started: true, completed: true, skipped: false, hasDraft: false, hasResult: true },
  });
  // org.joined miatt a stage ORG_PARTIAL — de plain member SOHA nem mehet /org/[id]-re.
  const state = buildJourneyState("ORG_PARTIAL");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "personal");
  assert.equal(result.home.reason, "personal_home");
  assert.equal(result.home.destination, "/profile/results");
});

test("self completed goes to profile results", () => {
  const context = buildJourneyContext({
    assessment: { started: true, completed: true, skipped: false, hasDraft: false, hasResult: true },
  });
  const state = buildJourneyState("SELF_COMPLETED");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "personal");
  assert.equal(result.home.reason, "personal_home");
  assert.equal(result.home.destination, "/profile/results");
});

test("first start goes to assessment", () => {
  const context = buildJourneyContext({
    assessment: { started: false, completed: false, skipped: false, hasDraft: false, hasResult: false },
  });
  const state = buildJourneyState("SELF_NOT_STARTED");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "personal");
  assert.equal(result.home.reason, "first_assessment");
  assert.equal(result.home.destination, "/assessment");
});
