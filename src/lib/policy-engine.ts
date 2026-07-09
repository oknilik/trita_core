import {
  CAPABILITIES,
  resolveOrgCapabilities,
  resolveSubscriptionCapabilityPolicyState,
  type Capability,
  type SubscriptionCapabilityPolicyState,
} from "@/lib/capabilities";
import type { SubscriptionState } from "@/lib/subscription";

export type AccessDenialReason =
  | "AUTH_REQUIRED"
  | "ORG_MEMBERSHIP_REQUIRED"
  | "ROLE_INSUFFICIENT"
  | "SUBSCRIPTION_REQUIRED"
  | "SUBSCRIPTION_RESTRICTED"
  | "SUBSCRIPTION_FROZEN"
  | "PURCHASE_REQUIRED"
  | "CAPABILITY_NOT_GRANTED";

export type AccessUpgradeHintCode =
  | "sign_in"
  | "join_org_or_team"
  | "request_manager_access"
  | "request_admin_access"
  | "activate_subscription"
  | "reactivate_subscription"
  | "upgrade_to_self_plus";

export interface AccessUpgradeHint {
  code: AccessUpgradeHintCode;
}

export interface AccessPolicyMembership {
  orgId?: string | null;
  teamId?: string | null;
  hasOrgMembership?: boolean;
  hasTeamMembership?: boolean;
}

export interface AccessPolicyPurchaseState {
  tiers?: readonly string[];
  hasObserverAccess?: boolean;
  canExportPersonal?: boolean;
}

export interface AccessPolicyUser {
  isAuthenticated?: boolean;
  role?: string | null;
  orgRole?: string | null;
  teamRole?: string | null;
  membership?: AccessPolicyMembership;
  purchaseState?: AccessPolicyPurchaseState;
}

export interface AccessPolicyContext {
  activeOrgId?: string | null;
  activeTeamId?: string | null;
  subscriptionState?: SubscriptionState | null;
  subscriptionStatus?: string | null;
  capabilityPolicyState?: SubscriptionCapabilityPolicyState | null;
}

export interface AccessPolicy {
  capabilities: ReadonlySet<Capability>;
  policyState: SubscriptionCapabilityPolicyState;
  denialReasons: Partial<Record<Capability, AccessDenialReason>>;
  upgradeHints: Partial<Record<Capability, AccessUpgradeHint>>;
}

export interface CapabilityDecision {
  allowed: boolean;
  capability: Capability;
  reason?: AccessDenialReason;
  upgradeHint?: AccessUpgradeHint;
}

const ORG_SCOPED_CAPABILITIES = new Set<Capability>([
  "create",
  "manage",
  "invite",
  "launchCampaign",
  "candidateEvaluate",
  "billingManage",
  "orgAdminManage",
]);

const MANAGER_CAPABILITIES = new Set<Capability>([
  "create",
  "manage",
  "invite",
  "launchCampaign",
  "candidateEvaluate",
]);

const ADMIN_ONLY_CAPABILITIES = new Set<Capability>(["billingManage", "orgAdminManage"]);

const SELF_PLUS_EQUIVALENT_TIERS = new Set([
  "self_plus",
  "team_snapshot",
  "team_deep_dive",
  "team_pulse",
  "org_insight",
  "org_growth",
  "org_partner",
]);

interface DerivedContext {
  isAuthenticated: boolean;
  hasOrgMembership: boolean;
  hasTeamMembership: boolean;
  orgRole: string | null;
  policyState: SubscriptionCapabilityPolicyState;
  hasObserverPurchaseAccess: boolean;
}

function deriveContext(user: AccessPolicyUser, context: AccessPolicyContext): DerivedContext {
  const membership = user.membership;
  const hasOrgMembership =
    membership?.hasOrgMembership ??
    (Boolean(membership?.orgId) ||
      Boolean(context.activeOrgId) ||
      Boolean(user.orgRole));
  const hasTeamMembership =
    membership?.hasTeamMembership ??
    (Boolean(membership?.teamId) ||
      Boolean(context.activeTeamId) ||
      Boolean(user.teamRole));

  const hasObserverPurchaseAccess =
    Boolean(user.purchaseState?.hasObserverAccess) ||
    Boolean(
      user.purchaseState?.tiers?.some((tier) => SELF_PLUS_EQUIVALENT_TIERS.has(tier)),
    );

  return {
    isAuthenticated: user.isAuthenticated !== false,
    hasOrgMembership,
    hasTeamMembership,
    orgRole: user.orgRole ?? null,
    policyState: resolveSubscriptionCapabilityPolicyState({
      capabilityPolicyState: context.capabilityPolicyState,
      subscriptionState: context.subscriptionState,
      subscriptionStatus: context.subscriptionStatus,
    }),
    hasObserverPurchaseAccess,
  };
}

function canRoleManage(orgRole: string | null): boolean {
  return orgRole === "ORG_MANAGER" || orgRole === "ORG_ADMIN";
}

function isAdmin(orgRole: string | null): boolean {
  return orgRole === "ORG_ADMIN";
}

function resolveDeniedCapability(
  capability: Capability,
  derived: DerivedContext,
): { reason: AccessDenialReason; upgradeHint?: AccessUpgradeHint } {
  if (!derived.isAuthenticated) {
    return { reason: "AUTH_REQUIRED", upgradeHint: { code: "sign_in" } };
  }

  if (ORG_SCOPED_CAPABILITIES.has(capability) && !derived.hasOrgMembership) {
    return {
      reason: "ORG_MEMBERSHIP_REQUIRED",
      upgradeHint: { code: "join_org_or_team" },
    };
  }

  if (derived.hasOrgMembership) {
    if (derived.policyState === "none") {
      return {
        reason: "SUBSCRIPTION_REQUIRED",
        upgradeHint: { code: "activate_subscription" },
      };
    }
    if (derived.policyState === "past_due" || derived.policyState === "restricted") {
      return {
        reason: "SUBSCRIPTION_RESTRICTED",
        upgradeHint: { code: "reactivate_subscription" },
      };
    }
    if (derived.policyState === "frozen") {
      return {
        reason: "SUBSCRIPTION_FROZEN",
        upgradeHint: { code: "reactivate_subscription" },
      };
    }
  }

  if (MANAGER_CAPABILITIES.has(capability) && !canRoleManage(derived.orgRole)) {
    return {
      reason: "ROLE_INSUFFICIENT",
      upgradeHint: { code: "request_manager_access" },
    };
  }

  if (ADMIN_ONLY_CAPABILITIES.has(capability) && !isAdmin(derived.orgRole)) {
    return {
      reason: "ROLE_INSUFFICIENT",
      upgradeHint: { code: "request_admin_access" },
    };
  }

  if (
    capability === "observerInvite" &&
    !derived.hasOrgMembership &&
    !derived.hasTeamMembership &&
    !derived.hasObserverPurchaseAccess
  ) {
    return {
      reason: "PURCHASE_REQUIRED",
      upgradeHint: { code: "upgrade_to_self_plus" },
    };
  }

  return { reason: "CAPABILITY_NOT_GRANTED" };
}

export function resolveCapabilities(
  user: AccessPolicyUser,
  context: AccessPolicyContext = {},
): ReadonlySet<Capability> {
  const derived = deriveContext(user, context);
  const granted = new Set<Capability>();

  if (!derived.isAuthenticated) return granted;

  granted.add("read");
  granted.add("list");

  if (derived.hasOrgMembership) {
    const orgResolution = resolveOrgCapabilities({
      orgRole: derived.orgRole,
      capabilityPolicyState: derived.policyState,
    });
    for (const capability of orgResolution.granted) {
      granted.add(capability);
    }
  }

  if (
    derived.hasOrgMembership ||
    derived.hasTeamMembership ||
    derived.hasObserverPurchaseAccess
  ) {
    granted.add("observerInvite");
  }

  if (user.purchaseState?.canExportPersonal) {
    granted.add("export");
  }

  return granted;
}

export function getAccessPolicy(
  user: AccessPolicyUser,
  context: AccessPolicyContext = {},
): AccessPolicy {
  const derived = deriveContext(user, context);
  const capabilities = resolveCapabilities(user, context);
  const denialReasons: Partial<Record<Capability, AccessDenialReason>> = {};
  const upgradeHints: Partial<Record<Capability, AccessUpgradeHint>> = {};

  for (const capability of CAPABILITIES) {
    if (capabilities.has(capability)) continue;

    const denied = resolveDeniedCapability(capability, derived);
    denialReasons[capability] = denied.reason;
    if (denied.upgradeHint) {
      upgradeHints[capability] = denied.upgradeHint;
    }
  }

  return {
    capabilities,
    policyState: derived.policyState,
    denialReasons,
    upgradeHints,
  };
}

export function can(
  user: AccessPolicyUser,
  capability: Capability,
  context: AccessPolicyContext = {},
): CapabilityDecision {
  const policy = getAccessPolicy(user, context);
  if (policy.capabilities.has(capability)) {
    return { allowed: true, capability };
  }

  return {
    allowed: false,
    capability,
    reason: policy.denialReasons[capability] ?? "CAPABILITY_NOT_GRANTED",
    upgradeHint: policy.upgradeHints[capability],
  };
}
