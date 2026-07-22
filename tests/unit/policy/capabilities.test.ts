import test from "node:test";
import assert from "node:assert/strict";
import {
  CAPABILITIES,
  SUBSCRIPTION_CAPABILITY_POLICY_STATES,
  hasAnyCapability,
  hasCapability,
  resolveOrgCapabilities,
  resolveSubscriptionCapabilityPolicyState,
  toCapabilityRecord,
} from "@/lib/capabilities";

test("defines all required capability keys centrally", () => {
  assert.deepEqual(CAPABILITIES, [
    "read",
    "list",
    "create",
    "manage",
    "invite",
    "launchCampaign",
    "candidateEvaluate",
    "billingManage",
    "orgAdminManage",
    "export",
    "observerInvite",
    "teamManage",
    "teamInviteEmail",
  ]);
});

test("defines all required capability policy states centrally", () => {
  assert.deepEqual(SUBSCRIPTION_CAPABILITY_POLICY_STATES, [
    "none",
    "trialing",
    "active",
    "past_due",
    "restricted",
    "frozen",
  ]);
});

test("maps derived state first, then raw status to capability policy state", () => {
  assert.equal(
    resolveSubscriptionCapabilityPolicyState({
      subscriptionState: "frozen",
      subscriptionStatus: "active",
    }),
    "frozen",
  );
  assert.equal(
    resolveSubscriptionCapabilityPolicyState({
      subscriptionStatus: "trialing",
    }),
    "trialing",
  );
  assert.equal(
    resolveSubscriptionCapabilityPolicyState({
      subscriptionStatus: "past_due",
    }),
    "past_due",
  );
  assert.equal(
    resolveSubscriptionCapabilityPolicyState({
      subscriptionStatus: "canceled",
    }),
    "restricted",
  );
  assert.equal(
    resolveSubscriptionCapabilityPolicyState({
      capabilityPolicyState: "restricted",
      subscriptionState: "active",
      subscriptionStatus: "active",
    }),
    "restricted",
  );
});

test("active org member gets read/list/export + observer invite but not management", () => {
  const resolution = resolveOrgCapabilities({
    orgRole: "ORG_MEMBER",
    subscriptionState: "active",
  });

  assert.equal(hasCapability(resolution.granted, "read"), true);
  assert.equal(hasCapability(resolution.granted, "list"), true);
  assert.equal(hasCapability(resolution.granted, "export"), true);
  assert.equal(hasCapability(resolution.granted, "observerInvite"), true);
  assert.equal(hasCapability(resolution.granted, "manage"), false);
  assert.equal(hasCapability(resolution.granted, "billingManage"), false);
});

test("trialing behaves active-like for manager capabilities", () => {
  const resolution = resolveOrgCapabilities({
    orgRole: "ORG_MANAGER",
    subscriptionStatus: "trialing",
  });

  assert.equal(hasCapability(resolution.granted, "create"), true);
  assert.equal(hasCapability(resolution.granted, "manage"), true);
  assert.equal(hasCapability(resolution.granted, "launchCampaign"), true);
  assert.equal(hasCapability(resolution.granted, "export"), true);
});

test("past_due uses transitional read/list/export policy", () => {
  const resolution = resolveOrgCapabilities({
    orgRole: "ORG_MANAGER",
    subscriptionStatus: "past_due",
  });

  assert.equal(hasCapability(resolution.granted, "read"), true);
  assert.equal(hasCapability(resolution.granted, "list"), true);
  assert.equal(hasCapability(resolution.granted, "export"), true);
  assert.equal(hasCapability(resolution.granted, "create"), false);
  assert.equal(hasCapability(resolution.granted, "launchCampaign"), false);
});

test("active manager gets org write capabilities", () => {
  const resolution = resolveOrgCapabilities({
    orgRole: "ORG_MANAGER",
    subscriptionState: "active",
  });

  assert.equal(hasCapability(resolution.granted, "create"), true);
  assert.equal(hasCapability(resolution.granted, "manage"), true);
  assert.equal(hasCapability(resolution.granted, "invite"), true);
  assert.equal(hasCapability(resolution.granted, "launchCampaign"), true);
  assert.equal(hasCapability(resolution.granted, "candidateEvaluate"), true);
  assert.equal(hasCapability(resolution.granted, "orgAdminManage"), false);
});

test("active admin gets billing and org admin capabilities", () => {
  const resolution = resolveOrgCapabilities({
    orgRole: "ORG_ADMIN",
    subscriptionState: "active",
  });

  assert.equal(hasCapability(resolution.granted, "billingManage"), true);
  assert.equal(hasCapability(resolution.granted, "orgAdminManage"), true);
  assert.equal(hasCapability(resolution.granted, "invite"), true);
});

test("restricted admin remains read-only but can manage billing", () => {
  const resolution = resolveOrgCapabilities({
    orgRole: "ORG_ADMIN",
    subscriptionState: "restricted",
  });

  assert.equal(hasCapability(resolution.granted, "read"), true);
  assert.equal(hasCapability(resolution.granted, "list"), true);
  assert.equal(hasCapability(resolution.granted, "export"), false);
  assert.equal(hasCapability(resolution.granted, "billingManage"), true);
  assert.equal(hasCapability(resolution.granted, "create"), false);
  assert.equal(hasCapability(resolution.granted, "launchCampaign"), false);
});

test("frozen manager keeps only minimal read capability", () => {
  const resolution = resolveOrgCapabilities({
    orgRole: "ORG_MANAGER",
    subscriptionState: "frozen",
  });

  assert.equal(hasCapability(resolution.granted, "read"), true);
  assert.equal(hasCapability(resolution.granted, "list"), false);
  assert.equal(hasCapability(resolution.granted, "export"), false);
  assert.equal(hasCapability(resolution.granted, "manage"), false);
});

test("none subscription keeps only admin billing capability", () => {
  const admin = resolveOrgCapabilities({
    orgRole: "ORG_ADMIN",
    subscriptionState: "none",
  });
  const member = resolveOrgCapabilities({
    orgRole: "ORG_MEMBER",
    subscriptionState: "none",
  });

  assert.equal(hasCapability(admin.granted, "billingManage"), true);
  assert.equal(hasAnyCapability(admin.granted, ["read", "list", "create"]), false);
  assert.equal(admin.denied.has("read"), true);
  assert.equal(hasCapability(member.granted, "billingManage"), false);
});

test("unknown role yields no capabilities", () => {
  const resolution = resolveOrgCapabilities({
    orgRole: "TEAM_OWNER",
    subscriptionState: "active",
  });

  assert.equal(resolution.granted.size, 0);
});

test("can materialize capability record", () => {
  const resolution = resolveOrgCapabilities({
    orgRole: "ORG_ADMIN",
    subscriptionState: "active",
  });
  const record = toCapabilityRecord(resolution.granted);

  assert.equal(record.read, true);
  assert.equal(record.billingManage, true);
  assert.equal(record.orgAdminManage, true);
  assert.equal(record.candidateEvaluate, true);
});
