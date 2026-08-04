import test from "node:test";
import assert from "node:assert/strict";
import { resolveJourneyFromContext } from "@/lib/journey/engine-core";
import { buildJourneyContext } from "../../factories/journey-fixture-builder";

test("resolveJourneyFromContext exposes the unified handoff contract fields", () => {
  const resolution = resolveJourneyFromContext(buildJourneyContext());

  assert.equal(resolution.stage, "SELF_NOT_STARTED");
  assert.equal(resolution.activeSurface, "personal");
  assert.equal(resolution.destination, "/assessment");
  assert.equal(resolution.reason, "first_assessment");
  assert.ok(resolution.nextBestAction.primary.href.length > 0);
  assert.equal(typeof resolution.scopeProgress.scopeProgress, "number");
  assert.equal(typeof resolution.experienceHints.showAssessmentContinuation, "boolean");
  assert.equal(resolution.restrictionFlags.subscriptionState, "none");
  assert.equal(resolution.destination, resolution.home.destination);
  assert.equal(resolution.reason, resolution.home.reason);
});

test("restriction flags mark restricted org scope as read-only", () => {
  const resolution = resolveJourneyFromContext(
    buildJourneyContext({
      currentContext: "org-member",
      orgId: "org1",
      orgMembership: { orgId: "org1", role: "ORG_MEMBER", joinedAt: new Date() },
      assessment: { started: true, completed: true, hasResult: true },
      subscription: { state: "restricted", orgId: "org1", status: "past_due", hasAccess: false },
      completionSummary: {
        self: { started: true, completed: true },
        org: { joined: true, orgId: "org1" },
      },
    }),
  );

  assert.equal(resolution.restrictionFlags.subscriptionState, "restricted");
  assert.equal(resolution.restrictionFlags.missingOrgSubscription, false);
  assert.equal(resolution.restrictionFlags.readOnlyOrgViews, true);
  assert.equal(resolution.restrictionFlags.disableOrgWriteActions, true);
  assert.equal(resolution.restrictionFlags.hideDetailedOrgInsights, false);
  assert.equal(resolution.restrictionFlags.requiresSubscriptionAction, true);
});

test("restriction flags hide detailed insights in frozen state", () => {
  const resolution = resolveJourneyFromContext(
    buildJourneyContext({
      currentContext: "org-manager",
      orgId: "org1",
      orgMembership: { orgId: "org1", role: "ORG_MANAGER", joinedAt: new Date() },
      assessment: { started: true, completed: true, hasResult: true },
      subscription: { state: "frozen", orgId: "org1", status: "canceled", hasAccess: false },
      completionSummary: {
        self: { started: true, completed: true },
        org: { joined: true, orgId: "org1" },
      },
    }),
  );

  assert.equal(resolution.restrictionFlags.subscriptionState, "frozen");
  assert.equal(resolution.restrictionFlags.readOnlyOrgViews, true);
  assert.equal(resolution.restrictionFlags.hideDetailedOrgInsights, true);
});
