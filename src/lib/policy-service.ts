import {
  can,
  getAccessPolicy,
  type AccessPolicy,
  type AccessPolicyContext,
  type AccessPolicyUser,
  type CapabilityDecision,
} from "@/lib/policy-engine";
import type { Capability, SubscriptionCapabilityPolicyState } from "@/lib/capabilities";
import {
  getOrgSubscription,
  getSubscriptionState,
  type SubscriptionState,
} from "@/lib/subscription";
import { isPolicyEngineEnforcementEnabled } from "@/lib/rollout-guards.server";
import { getTeamMembershipRole } from "@/lib/team-auth";

export interface OrgPolicySubjectInput {
  orgId: string;
  orgRole?: string | null;
  teamId?: string | null;
  /** A hívó team-szerepe az aktív csapatban (member/manager) — a teamManage
   * capability feloldásához. Használd a resolveTeamPolicySnapshot-ot, ami
   * ezt az adatbázisból tölti a korábbi hardcode-olt flag helyett. */
  teamRole?: string | null;
  hasTeamMembership?: boolean;
  hasOrgMembership?: boolean;
  isAuthenticated?: boolean;
}

export interface OrgPolicySnapshot {
  orgId: string;
  subscription: Awaited<ReturnType<typeof getOrgSubscription>>;
  subject: AccessPolicyUser;
  context: AccessPolicyContext;
  policy: AccessPolicy;
}

export function createOrgPolicyInputs(
  params: OrgPolicySubjectInput,
  subscription: Awaited<ReturnType<typeof getOrgSubscription>>,
): {
  subject: AccessPolicyUser;
  context: AccessPolicyContext;
} {
  const subject: AccessPolicyUser = {
    isAuthenticated: params.isAuthenticated ?? true,
    orgRole: params.orgRole ?? null,
    teamRole: params.teamRole ?? null,
    membership: {
      hasOrgMembership: params.hasOrgMembership ?? true,
      orgId: params.orgId,
      hasTeamMembership: params.hasTeamMembership,
      teamId: params.teamId ?? undefined,
    },
  };
  const context: AccessPolicyContext = {
    activeOrgId: params.orgId,
    activeTeamId: params.teamId ?? undefined,
    subscriptionState: getSubscriptionState(subscription),
    subscriptionStatus: subscription?.status ?? "none",
  };
  return { subject, context };
}

export async function resolveOrgPolicySnapshot(
  params: OrgPolicySubjectInput,
): Promise<OrgPolicySnapshot> {
  const subscription = await getOrgSubscription(params.orgId);
  const { subject, context } = createOrgPolicyInputs(params, subscription);
  return {
    orgId: params.orgId,
    subscription,
    subject,
    context,
    policy: getAccessPolicy(subject, context),
  };
}

/**
 * Csapat-hatókörű policy-pillanatkép: a hívó TÉNYLEGES team-tagságát és
 * team-szerepét az adatbázisból tölti (a korábbi, hívónként hardcode-olt
 * hasTeamMembership: true helyett) — így a teamManage capability helyesen
 * oldódik fel: ORG_MANAGER csak a saját csapatában kapja meg.
 */
export async function resolveTeamPolicySnapshot(params: {
  orgId: string;
  orgRole?: string | null;
  teamId: string;
  profileId: string;
}): Promise<OrgPolicySnapshot> {
  // Ugyanaz a lekérés, mint a canAccessTeam/canManageTeam mögött — a közös,
  // kérés-szinten memoizált forrásból (mérve: renderenként 3× ment ki).
  const teamRole = await getTeamMembershipRole(params.profileId, params.teamId);
  return resolveOrgPolicySnapshot({
    orgId: params.orgId,
    orgRole: params.orgRole,
    teamId: params.teamId,
    hasTeamMembership: teamRole !== null,
    teamRole,
  });
}

export function resolveOrgCapabilityDecision(
  snapshot: OrgPolicySnapshot,
  capability: Capability,
): CapabilityDecision {
  if (!isPolicyEngineEnforcementEnabled()) {
    return { allowed: true, capability };
  }
  return can(snapshot.subject, capability, snapshot.context);
}

export function isPolicyReadOnly(
  policyState: SubscriptionCapabilityPolicyState,
): boolean {
  return (
    policyState === "none" ||
    policyState === "past_due" ||
    policyState === "restricted" ||
    policyState === "frozen"
  );
}

export function toOrgSubscriptionBannerState(
  policyState: SubscriptionCapabilityPolicyState,
): Extract<SubscriptionState, "none" | "restricted" | "frozen"> | null {
  if (policyState === "none") return "none";
  if (policyState === "frozen") return "frozen";
  if (policyState === "past_due" || policyState === "restricted") {
    return "restricted";
  }
  return null;
}
