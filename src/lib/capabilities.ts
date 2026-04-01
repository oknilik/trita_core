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

export interface OrgCapabilityContext {
  orgRole: string | null | undefined;
  subscriptionState: SubscriptionState;
}

export interface OrgCapabilityResolution {
  granted: ReadonlySet<Capability>;
  denied: ReadonlySet<Capability>;
}

const MANAGER_OR_ABOVE = new Set<OrgRoleCapabilityContext>(["ORG_MANAGER", "ORG_ADMIN"]);

function buildDeniedSet(granted: ReadonlySet<Capability>): ReadonlySet<Capability> {
  return new Set(CAPABILITIES.filter((capability) => !granted.has(capability)));
}

function normalizeOrgRole(role: string | null | undefined): OrgRoleCapabilityContext | null {
  if (role === "ORG_MEMBER" || role === "ORG_MANAGER" || role === "ORG_ADMIN") {
    return role;
  }
  return null;
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
  const granted = new Set<Capability>();

  if (!role) {
    return { granted, denied: buildDeniedSet(granted) };
  }

  if (context.subscriptionState === "none") {
    if (role === "ORG_ADMIN") granted.add("billingManage");
    return { granted, denied: buildDeniedSet(granted) };
  }

  // Read-only states keep visibility and explicitly block org write paths.
  if (context.subscriptionState === "restricted") {
    granted.add("read");
    granted.add("list");
    granted.add("export");

    if (role === "ORG_ADMIN") {
      granted.add("billingManage");
    }

    return { granted, denied: buildDeniedSet(granted) };
  }

  if (context.subscriptionState === "frozen") {
    granted.add("read");
    granted.add("list");

    if (role === "ORG_ADMIN") {
      granted.add("billingManage");
    }

    return { granted, denied: buildDeniedSet(granted) };
  }

  // Active org subscription.
  granted.add("read");
  granted.add("list");
  granted.add("export");
  granted.add("observerInvite");

  if (MANAGER_OR_ABOVE.has(role)) {
    granted.add("create");
    granted.add("manage");
    granted.add("invite");
    granted.add("launchCampaign");
    granted.add("candidateEvaluate");
  }

  if (role === "ORG_ADMIN") {
    granted.add("billingManage");
    granted.add("orgAdminManage");
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

