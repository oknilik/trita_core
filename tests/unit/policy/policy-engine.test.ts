import test from "node:test";
import assert from "node:assert/strict";
import { can, getAccessPolicy, resolveCapabilities } from "@/lib/policy-engine";

test("unauthenticated user has no capabilities", () => {
  const capabilities = resolveCapabilities({
    isAuthenticated: false,
  });

  assert.equal(capabilities.size, 0);

  const decision = can({ isAuthenticated: false }, "read");
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "AUTH_REQUIRED");
  assert.equal(decision.upgradeHint?.code, "sign_in");
});

test("active org admin gets full org capabilities", () => {
  const policy = getAccessPolicy(
    {
      isAuthenticated: true,
      orgRole: "ORG_ADMIN",
      membership: { hasOrgMembership: true, orgId: "org_1" },
    },
    {
      subscriptionState: "active",
    },
  );

  assert.equal(policy.capabilities.has("create"), true);
  assert.equal(policy.capabilities.has("manage"), true);
  assert.equal(policy.capabilities.has("invite"), true);
  assert.equal(policy.capabilities.has("launchCampaign"), true);
  assert.equal(policy.capabilities.has("candidateEvaluate"), true);
  assert.equal(policy.capabilities.has("billingManage"), true);
  assert.equal(policy.capabilities.has("orgAdminManage"), true);
});

test("org member cannot manage even in active subscription", () => {
  const decision = can(
    {
      isAuthenticated: true,
      orgRole: "ORG_MEMBER",
      membership: { hasOrgMembership: true, orgId: "org_1" },
    },
    "manage",
    { subscriptionState: "active" },
  );

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "ROLE_INSUFFICIENT");
  assert.equal(decision.upgradeHint?.code, "request_manager_access");
});

test("org member in restricted org gets ROLE_INSUFFICIENT, not billing state", () => {
  // A szerep-ellenőrzés megelőzi az előfizetés-ellenőrzést: a tag ne kapjon
  // billing-CTA-t (és billing-állapot-információt) olyan capabilityre,
  // amelyhez a szerepe eleve kevés.
  const decision = can(
    {
      isAuthenticated: true,
      orgRole: "ORG_MEMBER",
      membership: { hasOrgMembership: true, orgId: "org_1" },
    },
    "manage",
    { subscriptionState: "restricted" },
  );

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "ROLE_INSUFFICIENT");
  assert.equal(decision.upgradeHint?.code, "request_manager_access");
});

test("restricted subscription blocks write capabilities with reactivation hint", () => {
  const decision = can(
    {
      isAuthenticated: true,
      orgRole: "ORG_MANAGER",
      membership: { hasOrgMembership: true, orgId: "org_1" },
    },
    "launchCampaign",
    { subscriptionState: "restricted" },
  );

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "SUBSCRIPTION_RESTRICTED");
  assert.equal(decision.upgradeHint?.code, "reactivate_subscription");
});

test("past_due uses transitional policy: export allowed, manage denied", () => {
  const exportDecision = can(
    {
      isAuthenticated: true,
      orgRole: "ORG_MANAGER",
      membership: { hasOrgMembership: true, orgId: "org_1" },
    },
    "export",
    { subscriptionStatus: "past_due" },
  );
  const manageDecision = can(
    {
      isAuthenticated: true,
      orgRole: "ORG_MANAGER",
      membership: { hasOrgMembership: true, orgId: "org_1" },
    },
    "manage",
    { subscriptionStatus: "past_due" },
  );

  assert.equal(exportDecision.allowed, true);
  assert.equal(manageDecision.allowed, false);
  assert.equal(manageDecision.reason, "SUBSCRIPTION_RESTRICTED");
});

test("no org membership denies org-scoped capabilities with join hint", () => {
  const decision = can(
    {
      isAuthenticated: true,
      role: "INDIVIDUAL",
      membership: { hasOrgMembership: false },
    },
    "create",
    { subscriptionState: "none" },
  );

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "ORG_MEMBERSHIP_REQUIRED");
  assert.equal(decision.upgradeHint?.code, "join_org_or_team");
});

test("observer invite needs org/team context", () => {
  // 2026-07-31: a vásárlás-alapú ág megszűnt a csomagokkal együtt — az
  // observer-meghívó jogosultságát ma kizárólag a szervezeti/csapat-tagság adja.
  const denied = can(
    {
      isAuthenticated: true,
      role: "INDIVIDUAL",
      membership: { hasOrgMembership: false, hasTeamMembership: false },
    },
    "observerInvite",
    { subscriptionState: "none" },
  );
  const allowed = can(
    {
      isAuthenticated: true,
      role: "INDIVIDUAL",
      membership: { hasOrgMembership: true, hasTeamMembership: false },
    },
    "observerInvite",
    { subscriptionState: "none" },
  );

  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, "CAPABILITY_NOT_GRANTED");
  assert.equal(allowed.allowed, true);
});

test("getAccessPolicy returns denial reason and hint maps", () => {
  const policy = getAccessPolicy(
    {
      isAuthenticated: true,
      orgRole: "ORG_MANAGER",
      membership: { hasOrgMembership: true, orgId: "org_1" },
    },
    { subscriptionState: "frozen" },
  );

  assert.equal(policy.policyState, "frozen");
  assert.equal(policy.capabilities.has("read"), true);
  assert.equal(policy.capabilities.has("manage"), false);
  assert.equal(policy.denialReasons.manage, "SUBSCRIPTION_FROZEN");
  assert.equal(policy.upgradeHints.manage?.code, "reactivate_subscription");
});


test("consultant gets admin-parity org capabilities", () => {
  const policy = getAccessPolicy(
    {
      isAuthenticated: true,
      orgRole: "ORG_CONSULTANT",
      membership: { orgId: "org_1", hasOrgMembership: true },
    },
    { subscriptionStatus: "active", subscriptionState: "active" },
  );

  assert.equal(policy.capabilities.has("read"), true);
  assert.equal(policy.capabilities.has("manage"), true);
  assert.equal(policy.capabilities.has("orgAdminManage"), true);
});
