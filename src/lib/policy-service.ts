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

export interface OrgPolicySubjectInput {
  orgId: string;
  orgRole?: string | null;
  teamId?: string | null;
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

export function resolveOrgCapabilityDecision(
  snapshot: OrgPolicySnapshot,
  capability: Capability,
): CapabilityDecision {
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
