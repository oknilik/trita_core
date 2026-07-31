import test from "node:test";
import assert from "node:assert/strict";
import { getAccessPolicy, type AccessPolicyContext, type AccessPolicyUser } from "@/lib/policy-engine";

const CAPABILITY_COLUMNS = [
  "read",
  "list",
  "create",
  "manage",
  "invite",
  "export",
  "candidateEvaluate",
  "billingManage",
] as const;

type CapabilityColumn = (typeof CAPABILITY_COLUMNS)[number];
type RoleAxis = "self-only" | "org member" | "org manager" | "org admin";
type SubscriptionAxis = "none" | "active" | "restricted" | "frozen";

interface MatrixRow {
  role: RoleAxis;
  subscription: SubscriptionAxis;
  expectedPolicyState: AccessPolicyContext["capabilityPolicyState"] | "none" | "active" | "restricted" | "frozen";
  allowed: readonly CapabilityColumn[];
}

const MATRIX_ROWS: readonly MatrixRow[] = [
  { role: "self-only", subscription: "none", expectedPolicyState: "none", allowed: ["read", "list"] },
  { role: "self-only", subscription: "active", expectedPolicyState: "active", allowed: ["read", "list"] },
  { role: "self-only", subscription: "restricted", expectedPolicyState: "restricted", allowed: ["read", "list"] },
  { role: "self-only", subscription: "frozen", expectedPolicyState: "frozen", allowed: ["read", "list"] },

  { role: "org member", subscription: "none", expectedPolicyState: "none", allowed: ["read", "list"] },
  { role: "org member", subscription: "active", expectedPolicyState: "active", allowed: ["read", "list", "export"] },
  { role: "org member", subscription: "restricted", expectedPolicyState: "restricted", allowed: ["read", "list"] },
  { role: "org member", subscription: "frozen", expectedPolicyState: "frozen", allowed: ["read", "list"] },

  { role: "org manager", subscription: "none", expectedPolicyState: "none", allowed: ["read", "list"] },
  {
    role: "org manager",
    subscription: "active",
    expectedPolicyState: "active",
    allowed: ["read", "list", "create", "manage", "invite", "export", "candidateEvaluate"],
  },
  { role: "org manager", subscription: "restricted", expectedPolicyState: "restricted", allowed: ["read", "list"] },
  { role: "org manager", subscription: "frozen", expectedPolicyState: "frozen", allowed: ["read", "list"] },

  { role: "org admin", subscription: "none", expectedPolicyState: "none", allowed: ["read", "list", "billingManage"] },
  {
    role: "org admin",
    subscription: "active",
    expectedPolicyState: "active",
    allowed: ["read", "list", "create", "manage", "invite", "export", "candidateEvaluate", "billingManage"],
  },
  {
    role: "org admin",
    subscription: "restricted",
    expectedPolicyState: "restricted",
    allowed: ["read", "list", "billingManage"],
  },
  {
    role: "org admin",
    subscription: "frozen",
    expectedPolicyState: "frozen",
    allowed: ["read", "list", "billingManage"],
  },
] as const;

function buildScenarioAxes(
  role: RoleAxis,
  subscription: SubscriptionAxis,
): {
  user: AccessPolicyUser;
  context: AccessPolicyContext;
} {
  const user: AccessPolicyUser = {
    isAuthenticated: true,
  };
  const context: AccessPolicyContext = {};

  if (role === "self-only") {
    user.membership = { hasOrgMembership: false, hasTeamMembership: false };
  } else {
    user.membership = {
      hasOrgMembership: true,
      orgId: "org_matrix_1",
    };
    user.orgRole =
      role === "org member"
        ? "ORG_MEMBER"
        : role === "org manager"
          ? "ORG_MANAGER"
          : "ORG_ADMIN";
  }


  context.subscriptionState = subscription;
  return { user, context };
}

test("E1 capability matrix is data-driven across role x subscription x capability axes", () => {
  for (const row of MATRIX_ROWS) {
    const { user, context } = buildScenarioAxes(row.role, row.subscription);
    const policy = getAccessPolicy(user, context);

    assert.equal(
      policy.policyState,
      row.expectedPolicyState,
      `${row.role} x ${row.subscription} -> policyState`,
    );

    const allowedSet = new Set<CapabilityColumn>(row.allowed);
    for (const capability of CAPABILITY_COLUMNS) {
      assert.equal(
        policy.capabilities.has(capability),
        allowedSet.has(capability),
        `${row.role} x ${row.subscription} -> ${capability}`,
      );
    }
  }
});
