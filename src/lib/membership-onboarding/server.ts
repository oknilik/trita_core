import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership, setActiveOrgContext } from "@/lib/org-context";
import { syncSeatBilling } from "@/lib/seat-billing";
import { resolveJourney } from "@/lib/journey/engine";

export type MembershipJoinKind = "team" | "org";

export const MEMBERSHIP_INVITE_STATES = [
  "INVITE_NOT_FOUND",
  "INVITED_UNAUTHENTICATED",
  "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE",
  "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED",
  "INVITED_AUTHENTICATED_ALREADY_IN_OTHER_ORG",
  "INVITED_READY_TO_JOIN",
  "INVITE_ACCEPTED",
] as const;

export type MembershipInviteState = (typeof MEMBERSHIP_INVITE_STATES)[number];

export type MembershipProfileMissingField =
  | "username"
  | "birthYear"
  | "gender"
  | "consentedAt"
  | "onboardedAt";

export interface MembershipProfileStatus {
  isOnboarded: boolean;
  missingFields: MembershipProfileMissingField[];
  requiresProfileCompletion: boolean;
}

export interface MembershipJoinActor {
  profileId: string;
  username: string | null;
  profileStatus: MembershipProfileStatus;
  activeOrgMembership: {
    orgId: string;
    orgName: string;
  } | null;
}

export interface TeamJoinInviteContext {
  kind: "team";
  inviteId: string;
  teamId: string;
  teamName: string;
  orgId: string;
  orgName: string;
  email: string;
  isReusableInvite: boolean;
}

export interface OrgJoinInviteContext {
  kind: "org";
  inviteId: string;
  orgId: string;
  orgName: string;
  role: string;
}

export type MembershipJoinInviteContext = TeamJoinInviteContext | OrgJoinInviteContext;

export type MembershipOnboardingErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "INVITE_NOT_FOUND"
  | "ALREADY_IN_ORG"
  | "PROFILE_INCOMPLETE";

export class MembershipOnboardingError extends Error {
  readonly code: MembershipOnboardingErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: MembershipOnboardingErrorCode,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "MembershipOnboardingError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface MembershipJoinResult {
  ok: true;
  inviteState: "INVITE_ACCEPTED";
  nextPath: string;
}

export interface MembershipInviteResolution {
  kind: MembershipJoinKind;
  inviteId: string;
  inviteState: MembershipInviteState;
  invite: MembershipJoinInviteContext | null;
  actor: MembershipJoinActor | null;
  signUpRedirectUrl: string | null;
  redirectTo: string | null;
}

type ReadyMembershipInviteResolution = MembershipInviteResolution & {
  invite: MembershipJoinInviteContext;
  actor: MembershipJoinActor;
};

type ReadyMembershipInviteResolutionForState<TAllowed extends MembershipInviteState> =
  Omit<ReadyMembershipInviteResolution, "inviteState"> & {
    inviteState: TAllowed;
  };

export type MembershipJoinPageAccessResult<TAllowed extends MembershipInviteState> =
  | { type: "not_found" }
  | { type: "redirect"; href: string }
  | { type: "ready"; resolution: ReadyMembershipInviteResolutionForState<TAllowed> };

function buildJoinPath(kind: MembershipJoinKind, inviteId: string): string {
  return kind === "team" ? `/join/${inviteId}` : `/join/org/${inviteId}`;
}

function buildSignUpRedirectUrl(kind: MembershipJoinKind, inviteId: string): string {
  return `/sign-up?redirect_url=${buildJoinPath(kind, inviteId)}`;
}

function getProfileStatus(profile: {
  username: string | null;
  birthYear: number | null;
  gender: string | null;
  consentedAt: Date | null;
  onboardedAt: Date | null;
}): MembershipProfileStatus {
  const missingFields: MembershipProfileMissingField[] = [];
  if (!profile.username?.trim()) missingFields.push("username");
  if (!profile.birthYear) missingFields.push("birthYear");
  if (!profile.gender) missingFields.push("gender");
  if (!profile.consentedAt) missingFields.push("consentedAt");
  if (!profile.onboardedAt) missingFields.push("onboardedAt");

  return {
    isOnboarded: Boolean(profile.onboardedAt),
    missingFields,
    requiresProfileCompletion: missingFields.length > 0,
  };
}

export async function resolveMembershipJoinActor(clerkId: string): Promise<MembershipJoinActor> {
  const profile = await prisma.userProfile.upsert({
    where: { clerkId },
    create: { clerkId },
    update: {},
    select: {
      id: true,
      username: true,
      birthYear: true,
      gender: true,
      consentedAt: true,
      onboardedAt: true,
    },
  });
  const activeMembership = await getActiveOrgMembership(profile.id);
  const activeOrg = activeMembership
    ? await prisma.organization.findUnique({
        where: { id: activeMembership.orgId },
        select: { id: true, name: true },
      })
    : null;

  return {
    profileId: profile.id,
    username: profile.username,
    profileStatus: getProfileStatus(profile),
    activeOrgMembership: activeMembership && activeOrg
      ? {
          orgId: activeOrg.id,
          orgName: activeOrg.name,
        }
      : null,
  };
}

export async function resolveTeamJoinInviteContext(
  inviteId: string,
): Promise<TeamJoinInviteContext | null> {
  const invite = await prisma.teamPendingInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      email: true,
      teamId: true,
      team: {
        select: {
          name: true,
          orgId: true,
          org: { select: { name: true } },
        },
      },
    },
  });

  if (!invite?.team.orgId) return null;

  return {
    kind: "team",
    inviteId: invite.id,
    teamId: invite.teamId,
    teamName: invite.team.name,
    orgId: invite.team.orgId,
    orgName: invite.team.org?.name ?? "",
    email: invite.email,
    isReusableInvite: invite.email === "__open__",
  };
}

export async function resolveOrgJoinInviteContext(
  inviteId: string,
): Promise<OrgJoinInviteContext | null> {
  const invite = await prisma.organizationPendingInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      orgId: true,
      role: true,
      org: { select: { name: true } },
    },
  });

  if (!invite) return null;

  return {
    kind: "org",
    inviteId: invite.id,
    orgId: invite.orgId,
    orgName: invite.org.name,
    role: invite.role,
  };
}

function normalizeJoinError(error: unknown): MembershipOnboardingError {
  if (error instanceof MembershipOnboardingError) return error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique violation on OrganizationMember membership constraint.
    if (error.code === "P2002") {
      return new MembershipOnboardingError("ALREADY_IN_ORG", 409);
    }
    if (error.code === "P2025") {
      return new MembershipOnboardingError("INVITE_NOT_FOUND", 404);
    }
  }

  return new MembershipOnboardingError("INVALID_INPUT", 400);
}

async function runJoinTransaction(
  actor: MembershipJoinActor,
  invite: MembershipJoinInviteContext,
  options: { skipOrgMembershipCreate?: boolean } = {},
): Promise<void> {
  if (invite.kind === "team") {
    const tx: Prisma.PrismaPromise<unknown>[] = [];
    if (!options.skipOrgMembershipCreate) {
      tx.push(
        prisma.organizationMember.upsert({
          where: { orgId_userId: { orgId: invite.orgId, userId: actor.profileId } },
          create: { orgId: invite.orgId, userId: actor.profileId, role: "ORG_MEMBER" },
          update: { leftAt: null },
        }),
      );
    }
    tx.push(
      prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: invite.teamId, userId: actor.profileId } },
        create: { teamId: invite.teamId, userId: actor.profileId, role: "member" },
        update: {},
      }),
    );

    if (!invite.isReusableInvite) {
      tx.push(prisma.teamPendingInvite.delete({ where: { id: invite.inviteId } }));
    }
    await prisma.$transaction(tx);
    await setActiveOrgContext(actor.profileId, invite.orgId);
    return;
  }

  await prisma.$transaction([
    prisma.organizationMember.upsert({
      where: { orgId_userId: { orgId: invite.orgId, userId: actor.profileId } },
      create: { orgId: invite.orgId, userId: actor.profileId, role: invite.role },
      update: { role: invite.role, leftAt: null },
    }),
    prisma.organizationPendingInvite.delete({ where: { id: invite.inviteId } }),
  ]);
  await setActiveOrgContext(actor.profileId, invite.orgId);
  void syncSeatBilling(invite.orgId);
}

async function resolveJoinNextPath(profileId: string): Promise<string> {
  const resolution = await resolveJourney(profileId, {
    entryPoint: "membership_join_handoff",
  });
  return resolution.destination;
}

export async function resolveMembershipJoinPageAccess<const TAllowed extends MembershipInviteState>(
  params: {
  kind: MembershipJoinKind;
  inviteId: string;
  clerkId?: string | null;
  allowedStates: readonly TAllowed[];
}): Promise<MembershipJoinPageAccessResult<TAllowed>> {
  const isAllowedState = (state: MembershipInviteState): state is TAllowed =>
    (params.allowedStates as readonly MembershipInviteState[]).includes(state);

  const resolution = await resolveMembershipInviteResolution({
    kind: params.kind,
    inviteId: params.inviteId,
    clerkId: params.clerkId,
  });

  if (resolution.inviteState === "INVITE_NOT_FOUND" || !resolution.invite) {
    return { type: "not_found" };
  }

  if (resolution.inviteState === "INVITED_UNAUTHENTICATED") {
    return {
      type: "redirect",
      href:
        resolution.signUpRedirectUrl ??
        buildSignUpRedirectUrl(params.kind, params.inviteId),
    };
  }

  if (resolution.redirectTo) {
    return { type: "redirect", href: resolution.redirectTo };
  }

  if (!resolution.actor || !isAllowedState(resolution.inviteState)) {
    return { type: "not_found" };
  }

  return {
    type: "ready",
    resolution: resolution as ReadyMembershipInviteResolutionForState<TAllowed>,
  };
}

export async function joinMembershipFromInvite(params: {
  clerkId: string;
  kind: MembershipJoinKind;
  inviteId: string;
}): Promise<MembershipJoinResult> {
  const resolution = await resolveMembershipInviteResolution({
    kind: params.kind,
    inviteId: params.inviteId,
    clerkId: params.clerkId,
  });

  if (resolution.inviteState === "INVITE_NOT_FOUND" || !resolution.invite) {
    throw new MembershipOnboardingError("INVITE_NOT_FOUND", 404);
  }
  if (resolution.inviteState === "INVITED_UNAUTHENTICATED") {
    throw new MembershipOnboardingError("UNAUTHORIZED", 401);
  }
  if (resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE" || !resolution.actor) {
    throw new MembershipOnboardingError("PROFILE_INCOMPLETE", 409, {
      missingFields: resolution.actor?.profileStatus.missingFields ?? [],
    });
  }
  if (resolution.inviteState === "INVITE_ACCEPTED") {
    return {
      ok: true,
      inviteState: "INVITE_ACCEPTED",
      nextPath: await resolveJoinNextPath(resolution.actor.profileId),
    };
  }

  try {
    await runJoinTransaction(resolution.actor, resolution.invite, {
      skipOrgMembershipCreate:
        resolution.invite.kind === "team" &&
        resolution.actor.activeOrgMembership?.orgId === resolution.invite.orgId,
    });
  } catch (error) {
    throw normalizeJoinError(error);
  }

  return {
    ok: true,
    inviteState: "INVITE_ACCEPTED",
    nextPath: await resolveJoinNextPath(resolution.actor.profileId),
  };
}

export async function switchMembershipContextFromInvite(params: {
  clerkId: string;
  inviteId: string;
}): Promise<{ ok: true; nextPath: string }> {
  const resolution = await resolveMembershipInviteResolution({
    kind: "team",
    inviteId: params.inviteId,
    clerkId: params.clerkId,
  });

  if (resolution.inviteState === "INVITE_NOT_FOUND" || !resolution.invite) {
    throw new MembershipOnboardingError("INVITE_NOT_FOUND", 404);
  }
  if (resolution.inviteState === "INVITED_UNAUTHENTICATED") {
    throw new MembershipOnboardingError("UNAUTHORIZED", 401);
  }
  if (resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE" || !resolution.actor) {
    throw new MembershipOnboardingError("PROFILE_INCOMPLETE", 409, {
      missingFields: resolution.actor?.profileStatus.missingFields ?? [],
    });
  }
  if (
    resolution.inviteState !== "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED" ||
    resolution.invite.kind !== "team"
  ) {
    throw new MembershipOnboardingError("INVALID_INPUT", 400);
  }

  try {
    await runJoinTransaction(resolution.actor, resolution.invite, {
      skipOrgMembershipCreate: false,
    });
  } catch (error) {
    throw normalizeJoinError(error);
  }

  return {
    ok: true,
    nextPath: await resolveJoinNextPath(resolution.actor.profileId),
  };
}

export async function resolveMembershipInviteResolution(params: {
  kind: MembershipJoinKind;
  inviteId: string;
  clerkId?: string | null;
}): Promise<MembershipInviteResolution> {
  const invite =
    params.kind === "team"
      ? await resolveTeamJoinInviteContext(params.inviteId)
      : await resolveOrgJoinInviteContext(params.inviteId);

  if (!invite) {
    return {
      kind: params.kind,
      inviteId: params.inviteId,
      inviteState: "INVITE_NOT_FOUND",
      invite: null,
      actor: null,
      signUpRedirectUrl: null,
      redirectTo: null,
    };
  }

  if (!params.clerkId) {
    return {
      kind: params.kind,
      inviteId: params.inviteId,
      inviteState: "INVITED_UNAUTHENTICATED",
      invite,
      actor: null,
      signUpRedirectUrl: buildSignUpRedirectUrl(params.kind, params.inviteId),
      redirectTo: null,
    };
  }

  const actor = await resolveMembershipJoinActor(params.clerkId);
  const activeOrgId = actor.activeOrgMembership?.orgId ?? null;

  if (params.kind === "team") {
    const teamInvite = invite as TeamJoinInviteContext;

    if (activeOrgId && activeOrgId !== teamInvite.orgId) {
      return {
        kind: params.kind,
        inviteId: params.inviteId,
        inviteState: "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED",
        invite: teamInvite,
        actor,
        signUpRedirectUrl: null,
        redirectTo: null,
      };
    }

    if (activeOrgId === teamInvite.orgId) {
      const existingTeamMember = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: teamInvite.teamId, userId: actor.profileId } },
        select: { id: true },
      });
      if (existingTeamMember) {
        return {
          kind: params.kind,
          inviteId: params.inviteId,
          inviteState: "INVITE_ACCEPTED",
          invite: teamInvite,
          actor,
          signUpRedirectUrl: null,
          redirectTo: await resolveJoinNextPath(actor.profileId),
        };
      }
    }
  }

  if (params.kind === "org" && activeOrgId) {
    const existingMembership = await prisma.organizationMember.findFirst({
      where: { userId: actor.profileId, orgId: invite.orgId, leftAt: null },
      select: { orgId: true },
    });
    const inviteState: MembershipInviteState = existingMembership
      ? "INVITE_ACCEPTED"
      : "INVITED_READY_TO_JOIN";
    return {
      kind: params.kind,
      inviteId: params.inviteId,
      inviteState,
      invite,
      actor,
      signUpRedirectUrl: null,
      redirectTo:
        inviteState === "INVITE_ACCEPTED" && activeOrgId === invite.orgId
          ? await resolveJoinNextPath(actor.profileId)
          : null,
    };
  }

  if (actor.profileStatus.requiresProfileCompletion) {
    return {
      kind: params.kind,
      inviteId: params.inviteId,
      inviteState: "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE",
      invite,
      actor,
      signUpRedirectUrl: null,
      redirectTo: null,
    };
  }

  return {
    kind: params.kind,
    inviteId: params.inviteId,
    inviteState: "INVITED_READY_TO_JOIN",
    invite,
    actor,
    signUpRedirectUrl: null,
    redirectTo: null,
  };
}
