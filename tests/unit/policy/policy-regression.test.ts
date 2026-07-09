import test from "node:test";
import assert from "node:assert/strict";
import { getAccessPolicy } from "@/lib/policy-engine";
import { hasCandidateAccess } from "@/lib/subscription";

type CapabilitySnapshot = {
  read: boolean;
  list: boolean;
  create: boolean;
  manage: boolean;
  export: boolean;
  billingManage: boolean;
  candidateEvaluate: boolean;
  invite: boolean;
};

function extractCapabilitySnapshot(capabilities: ReadonlySet<string>): CapabilitySnapshot {
  return {
    read: capabilities.has("read"),
    list: capabilities.has("list"),
    create: capabilities.has("create"),
    manage: capabilities.has("manage"),
    export: capabilities.has("export"),
    billingManage: capabilities.has("billingManage"),
    candidateEvaluate: capabilities.has("candidateEvaluate"),
    invite: capabilities.has("invite"),
  };
}

const ORG_CONTEXT = { hasOrgMembership: true, orgId: "org_1" as const };

test("policy regression matrix scenarios remain stable", () => {
  const scenarios: Array<{
    name: string;
    user: Parameters<typeof getAccessPolicy>[0];
    context: Parameters<typeof getAccessPolicy>[1];
    expected: CapabilitySnapshot;
  }> = [
    {
      name: "admin + active",
      user: { isAuthenticated: true, orgRole: "ORG_ADMIN", membership: ORG_CONTEXT },
      context: { subscriptionState: "active" },
      expected: {
        read: true,
        list: true,
        create: true,
        manage: true,
        export: true,
        billingManage: true,
        candidateEvaluate: true,
        invite: true,
      },
    },
    {
      name: "admin + restricted",
      user: { isAuthenticated: true, orgRole: "ORG_ADMIN", membership: ORG_CONTEXT },
      context: { subscriptionState: "restricted" },
      expected: {
        read: true,
        list: true,
        create: false,
        manage: false,
        export: false,
        billingManage: true,
        candidateEvaluate: false,
        invite: false,
      },
    },
    {
      name: "admin + frozen",
      user: { isAuthenticated: true, orgRole: "ORG_ADMIN", membership: ORG_CONTEXT },
      context: { subscriptionState: "frozen" },
      expected: {
        read: true,
        list: true,
        create: false,
        manage: false,
        export: false,
        billingManage: true,
        candidateEvaluate: false,
        invite: false,
      },
    },
    {
      name: "manager + active",
      user: { isAuthenticated: true, orgRole: "ORG_MANAGER", membership: ORG_CONTEXT },
      context: { subscriptionState: "active" },
      expected: {
        read: true,
        list: true,
        create: true,
        manage: true,
        export: true,
        billingManage: false,
        candidateEvaluate: true,
        invite: true,
      },
    },
    {
      name: "member + active",
      user: { isAuthenticated: true, orgRole: "ORG_MEMBER", membership: ORG_CONTEXT },
      context: { subscriptionState: "active" },
      expected: {
        read: true,
        list: true,
        create: false,
        manage: false,
        export: true,
        billingManage: false,
        candidateEvaluate: false,
        invite: false,
      },
    },
    {
      name: "self-only + plus",
      user: {
        isAuthenticated: true,
        membership: { hasOrgMembership: false, hasTeamMembership: false },
        purchaseState: { tiers: ["self_plus"], hasObserverAccess: true, canExportPersonal: true },
      },
      context: { subscriptionState: "none" },
      expected: {
        read: true,
        list: true,
        create: false,
        manage: false,
        export: true,
        billingManage: false,
        candidateEvaluate: false,
        invite: false,
      },
    },
    {
      name: "self-only + no plus",
      user: {
        isAuthenticated: true,
        membership: { hasOrgMembership: false, hasTeamMembership: false },
        purchaseState: { tiers: [], hasObserverAccess: false, canExportPersonal: false },
      },
      context: { subscriptionState: "none" },
      expected: {
        read: true,
        list: true,
        create: false,
        manage: false,
        export: false,
        billingManage: false,
        candidateEvaluate: false,
        invite: false,
      },
    },
  ];

  for (const scenario of scenarios) {
    const policy = getAccessPolicy(scenario.user, scenario.context);
    const snapshot = extractCapabilitySnapshot(policy.capabilities);
    assert.deepEqual(snapshot, scenario.expected, scenario.name);
  }
});

function teamSubscription(overrides: {
  status: string;
  candidateCredits: number;
}) {
  return {
    status: overrides.status,
    planType: "team",
    billingInterval: null,
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    candidateCredits: overrides.candidateCredits,
  };
}

test("candidate add-on available for active team subscription with positive credits", () => {
  const available = hasCandidateAccess(
    teamSubscription({ status: "active", candidateCredits: 2 }),
  );
  assert.equal(available, true);
});

test("candidate add-on unavailable without credits or with non-active status", () => {
  const noCredits = hasCandidateAccess(
    teamSubscription({ status: "active", candidateCredits: 0 }),
  );
  assert.equal(noCredits, false);

  const restricted = hasCandidateAccess(
    teamSubscription({ status: "past_due", candidateCredits: 4 }),
  );
  assert.equal(restricted, false);
});
