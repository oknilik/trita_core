import type { SubscriptionState } from "@/lib/subscription";

export const CAPABILITIES = [
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
] as const;

export type Capability = (typeof CAPABILITIES)[number];
export type OrgRoleCapabilityContext = "ORG_MEMBER" | "ORG_MANAGER" | "ORG_ADMIN";
export const SUBSCRIPTION_CAPABILITY_POLICY_STATES = [
  "none",
  "trialing",
  "active",
  "past_due",
  "restricted",
  "frozen",
] as const;

export type SubscriptionCapabilityPolicyState =
  (typeof SUBSCRIPTION_CAPABILITY_POLICY_STATES)[number];

export const SUBSCRIPTION_CAPABILITY_BASE_MAP: Record<
  SubscriptionCapabilityPolicyState,
  readonly Capability[]
> = {
  none: [],
  trialing: [
    "read",
    "list",
    "create",
    "manage",
    "invite",
    "launchCampaign",
    "candidateEvaluate",
    "export",
    "observerInvite",
  ],
  active: [
    "read",
    "list",
    "create",
    "manage",
    "invite",
    "launchCampaign",
    "candidateEvaluate",
    "export",
    "observerInvite",
  ],
  // Transitional state: keep visibility while blocking write paths.
  past_due: ["read", "list", "export"],
  restricted: ["read", "list"],
  frozen: ["read"],
};

export interface OrgCapabilityContext {
  orgRole: string | null | undefined;
  subscriptionState?: SubscriptionState | null;
  subscriptionStatus?: string | null;
  capabilityPolicyState?: SubscriptionCapabilityPolicyState | null;
}

export interface OrgCapabilityResolution {
  granted: ReadonlySet<Capability>;
  denied: ReadonlySet<Capability>;
}

const MANAGER_OR_ABOVE = new Set<OrgRoleCapabilityContext>(["ORG_MANAGER", "ORG_ADMIN"]);
const FULL_ACCESS_POLICY_STATES = new Set<SubscriptionCapabilityPolicyState>([
  "trialing",
  "active",
]);
const MANAGER_PLUS_CAPABILITIES = new Set<Capability>([
  "create",
  "manage",
  "invite",
  "launchCampaign",
  "candidateEvaluate",
]);

function buildDeniedSet(granted: ReadonlySet<Capability>): ReadonlySet<Capability> {
  return new Set(CAPABILITIES.filter((capability) => !granted.has(capability)));
}

function normalizeOrgRole(role: string | null | undefined): OrgRoleCapabilityContext | null {
  if (role === "ORG_MEMBER" || role === "ORG_MANAGER" || role === "ORG_ADMIN") {
    return role;
  }
  // Assigned consultants operate with admin-parity capabilities.
  if (role === "ORG_CONSULTANT") {
    return "ORG_ADMIN";
  }
  return null;
}

/**
 * Central mapping from subscription state/status to capability policy state.
 *
 * Priority:
 * 1) explicit capabilityPolicyState override
 * 2) derived subscriptionState (none/active/restricted/frozen)
 * 3) raw subscriptionStatus (none/trialing/active/past_due)
 * 4) fallback to restricted for unpaid/canceled/unknown non-active statuses
 */
export function resolveSubscriptionCapabilityPolicyState(context: {
  capabilityPolicyState?: SubscriptionCapabilityPolicyState | null;
  subscriptionState?: SubscriptionState | null;
  subscriptionStatus?: string | null;
}): SubscriptionCapabilityPolicyState {
  if (context.capabilityPolicyState) return context.capabilityPolicyState;

  if (context.subscriptionState === "none") return "none";
  if (context.subscriptionState === "active") return "active";
  if (context.subscriptionState === "restricted") return "restricted";
  if (context.subscriptionState === "frozen") return "frozen";

  if (context.subscriptionStatus === "none") return "none";
  if (context.subscriptionStatus === "trialing") return "trialing";
  if (context.subscriptionStatus === "active") return "active";
  if (context.subscriptionStatus === "past_due") return "past_due";

  return "restricted";
}

/**
 * Capability policy for organization surfaces.
 *
 * Notes:
 * - "none" subscription keeps only admin billing management.
 * - "restricted" keeps read-only org visibility (+ export) and billing for admins.
 * - "frozen" keeps minimal read/list visibility and billing for admins.
 */
export function resolveOrgCapabilities(context: OrgCapabilityContext): OrgCapabilityResolution {
  const role = normalizeOrgRole(context.orgRole);
  const policyState = resolveSubscriptionCapabilityPolicyState(context);
  const granted = new Set<Capability>();

  if (!role) {
    return { granted, denied: buildDeniedSet(granted) };
  }

  for (const capability of SUBSCRIPTION_CAPABILITY_BASE_MAP[policyState]) {
    granted.add(capability);
  }

  if (!MANAGER_OR_ABOVE.has(role)) {
    for (const capability of MANAGER_PLUS_CAPABILITIES) {
      granted.delete(capability);
    }
  }

  if (role === "ORG_ADMIN") {
    granted.add("billingManage");
    if (FULL_ACCESS_POLICY_STATES.has(policyState)) {
      granted.add("orgAdminManage");
    }
  }

  return { granted, denied: buildDeniedSet(granted) };
}

export function hasCapability(
  granted: Iterable<Capability>,
  capability: Capability,
): boolean {
  for (const existing of granted) {
    if (existing === capability) return true;
  }
  return false;
}

export function hasAnyCapability(
  granted: Iterable<Capability>,
  required: readonly Capability[],
): boolean {
  for (const capability of required) {
    if (hasCapability(granted, capability)) return true;
  }
  return false;
}

export function toCapabilityRecord(
  granted: Iterable<Capability>,
): Record<Capability, boolean> {
  const grantedSet = new Set(granted);
  return {
    read: grantedSet.has("read"),
    list: grantedSet.has("list"),
    create: grantedSet.has("create"),
    manage: grantedSet.has("manage"),
    invite: grantedSet.has("invite"),
    launchCampaign: grantedSet.has("launchCampaign"),
    candidateEvaluate: grantedSet.has("candidateEvaluate"),
    billingManage: grantedSet.has("billingManage"),
    orgAdminManage: grantedSet.has("orgAdminManage"),
    export: grantedSet.has("export"),
    observerInvite: grantedSet.has("observerInvite"),
  };
}
