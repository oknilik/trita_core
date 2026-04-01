import assert from "node:assert/strict";
import test from "node:test";
import {
  createOrgPolicyInputs,
  isPolicyReadOnly,
  toOrgSubscriptionBannerState,
} from "@/lib/policy-service";

test("createOrgPolicyInputs derives org access context from subscription", () => {
  const { subject, context } = createOrgPolicyInputs(
    {
      orgId: "org_1",
      orgRole: "ORG_MANAGER",
      hasTeamMembership: true,
      teamId: "team_1",
    },
    {
      status: "active",
      trialEndsAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      candidateCredits: 0,
    },
  );

  assert.equal(subject.orgRole, "ORG_MANAGER");
  assert.equal(subject.membership?.hasOrgMembership, true);
  assert.equal(subject.membership?.orgId, "org_1");
  assert.equal(context.subscriptionState, "active");
  assert.equal(context.subscriptionStatus, "active");
});

test("createOrgPolicyInputs supports membership-less user for org-scoped checks", () => {
  const { subject } = createOrgPolicyInputs(
    {
      orgId: "org_1",
      hasOrgMembership: false,
      orgRole: null,
      isAuthenticated: true,
    },
    null,
  );

  assert.equal(subject.membership?.hasOrgMembership, false);
  assert.equal(subject.orgRole, null);
});

test("toOrgSubscriptionBannerState normalizes policy states", () => {
  assert.equal(toOrgSubscriptionBannerState("none"), "none");
  assert.equal(toOrgSubscriptionBannerState("past_due"), "restricted");
  assert.equal(toOrgSubscriptionBannerState("restricted"), "restricted");
  assert.equal(toOrgSubscriptionBannerState("frozen"), "frozen");
  assert.equal(toOrgSubscriptionBannerState("active"), null);
  assert.equal(toOrgSubscriptionBannerState("trialing"), null);
});

test("isPolicyReadOnly is true for blocked policy states", () => {
  assert.equal(isPolicyReadOnly("none"), true);
  assert.equal(isPolicyReadOnly("past_due"), true);
  assert.equal(isPolicyReadOnly("restricted"), true);
  assert.equal(isPolicyReadOnly("frozen"), true);
  assert.equal(isPolicyReadOnly("active"), false);
  assert.equal(isPolicyReadOnly("trialing"), false);
});
