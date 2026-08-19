import "server-only";

import { Prisma, type TestType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership, setActiveOrgContext } from "@/lib/org-context";
import { resolveJourney, resolveJourneyForClerkId } from "@/lib/journey/engine";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { getAcceptedAnswerIds, isCompleteFormAnswerSet } from "@/lib/questions";
import { calculateScores } from "@/lib/scoring";
import { isSharedAcceptanceServiceEnabled } from "@/lib/rollout-guards.server";
import { createLogger } from "@/lib/logger";
import { normalizeLocale } from "@/lib/i18n/core";

const log = createLogger("acceptance");

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
  email: string | null;
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
  email: string;
  isReusableInvite: boolean;
}

export type MembershipJoinInviteContext = TeamJoinInviteContext | OrgJoinInviteContext;

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

export interface MembershipJoinResult {
  ok: true;
  acceptanceState: "acceptance_success";
  // Backward-compatible legacy field for existing client parsers.
  inviteState: "INVITE_ACCEPTED";
  nextPath: string;
}

export type MembershipOnboardingErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "INVITE_NOT_FOUND"
  | "INVITE_EMAIL_MISMATCH"
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

type CandidateInviteStatus = "PENDING" | "COMPLETED" | "CANCELED";

export interface CandidateInviteContext {
  id: string;
  token: string;
  testType: string;
  position: string | null;
  name: string | null;
  status: CandidateInviteStatus;
  /** Opcionális 2. lépés: csapatszerep-kérdőív az apply-flow-ban */
  includeTeamRole: boolean;
  expiresAt: Date;
  draftStartedAt: Date | null;
  draftAnsweredCount: number;
}

export type CandidateAcceptanceState =
  | "APPLY_NOT_FOUND"
  | "APPLY_READY"
  | "APPLY_COMPLETED"
  | "APPLY_CANCELED"
  | "APPLY_EXPIRED";

export type AcceptanceState = MembershipInviteState | CandidateAcceptanceState | "INVALID_ROUTE_SOURCE";

export type AcceptanceRouteSource =
  | "join.team.page"
  | "join.org.page"
  | "apply.page"
  | "api.team.join"
  | "api.org.join"
  | "api.org.switch"
  | "api.candidate.lookup"
  | "api.candidate.progress"
  | "api.candidate.submit"
  | "membership.resolve";

export interface AcceptanceAuthState {
  clerkId: string | null;
  authenticated?: boolean;
}

export interface AcceptanceCurrentUserContext {
  profileId?: string | null;
  activeOrgId?: string | null;
}

export interface AcceptanceTargetContext {
  kind?: MembershipJoinKind | "candidate";
  teamId?: string | null;
  orgId?: string | null;
}

export interface ResolveAcceptanceInput {
  token: string;
  routeSource: AcceptanceRouteSource;
  authState?: AcceptanceAuthState;
  currentUserContext?: AcceptanceCurrentUserContext;
  targetContext?: AcceptanceTargetContext;
  now?: Date;
}

export interface AcceptInvitationInput extends ResolveAcceptanceInput {
  forceContextSwitch?: boolean;
}

export interface CompleteAcceptanceInput extends ResolveAcceptanceInput {
  answers?: Array<{ questionId: number; value: number }>;
}

export interface AcceptanceErrorState {
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

export interface AcceptanceHandoffContext {
  signUpRedirectUrl: string | null;
  redirectTo: string | null;
  nextPath: string | null;
}

export interface AcceptanceUiState {
  view:
    | "not_found"
    | "redirect"
    | "ready"
    | "completed"
    | "canceled"
    | "expired"
    | "error";
  requiresProfileCompletion?: boolean;
  requiresOrgSwitch?: boolean;
}

export interface AcceptanceMembershipMutationResult {
  changed: boolean;
  kind: MembershipJoinKind | null;
  orgId: string | null;
  teamId: string | null;
}

export const ACCEPTANCE_MACHINE_STATES = [
  "invalid_route",
  "invalid_token",
  "expired_token",
  "auth_required",
  "already_accepted",
  "acceptance_success",
  "team_assignment_pending",
  "org_mismatch",
  "policy_restricted",
  "profile_completion_required",
  "ready",
] as const;

export type AcceptanceMachineState = (typeof ACCEPTANCE_MACHINE_STATES)[number];

export interface AcceptanceResult {
  domain: "membership" | "candidate";
  acceptanceState: AcceptanceState;
  machineState: AcceptanceMachineState;
  membershipResolution: MembershipInviteResolution | null;
  candidateContext: CandidateInviteContext | null;
  membershipMutationResult: AcceptanceMembershipMutationResult | null;
  handoffContext: AcceptanceHandoffContext;
  uiState: AcceptanceUiState;
  errorState: AcceptanceErrorState | null;
}

interface AcceptanceRuntimeDeps {
  getActiveOrgMembership: typeof getActiveOrgMembership;
  setActiveOrgContext: typeof setActiveOrgContext;
  resolveJourney: typeof resolveJourney;
  resolveJourneyForClerkId: typeof resolveJourneyForClerkId;
}

const acceptanceRuntimeDeps: AcceptanceRuntimeDeps = {
  getActiveOrgMembership,
  setActiveOrgContext,
  resolveJourney,
  resolveJourneyForClerkId,
};

export function __setAcceptanceRuntimeForTests(
  overrides: Partial<AcceptanceRuntimeDeps>,
): () => void {
  const previous: AcceptanceRuntimeDeps = { ...acceptanceRuntimeDeps };

  if (overrides.getActiveOrgMembership) {
    acceptanceRuntimeDeps.getActiveOrgMembership = overrides.getActiveOrgMembership;
  }
  if (overrides.setActiveOrgContext) {
    acceptanceRuntimeDeps.setActiveOrgContext = overrides.setActiveOrgContext;
  }
  if (overrides.resolveJourney) {
    acceptanceRuntimeDeps.resolveJourney = overrides.resolveJourney;
  }
  if (overrides.resolveJourneyForClerkId) {
    acceptanceRuntimeDeps.resolveJourneyForClerkId = overrides.resolveJourneyForClerkId;
  }

  return () => {
    acceptanceRuntimeDeps.getActiveOrgMembership = previous.getActiveOrgMembership;
    acceptanceRuntimeDeps.setActiveOrgContext = previous.setActiveOrgContext;
    acceptanceRuntimeDeps.resolveJourney = previous.resolveJourney;
    acceptanceRuntimeDeps.resolveJourneyForClerkId = previous.resolveJourneyForClerkId;
  };
}

export interface TeamJoinPagePayload {
  acceptanceState:
    | "profile_completion_required"
    | "org_mismatch"
    | "team_assignment_pending";
  inviteId: string;
  teamName: string;
  orgName: string;
  alreadyInTargetOrg: boolean;
  existingProfile: { username: string | null } | null;
  existingOrg: { orgId: string; orgName: string } | null;
}

export type TeamJoinPageModel =
  | { state: "invalid_token" }
  | { state: "auth_required"; redirectTo: string }
  | { state: "already_accepted"; redirectTo: string }
  | { state: "policy_restricted"; redirectTo: string }
  | { state: "ready"; payload: TeamJoinPagePayload };

export interface OrgJoinPagePayload {
  acceptanceState:
    | "profile_completion_required"
    | "ready";
  inviteId: string;
  orgName: string;
  existingProfile: { username: string | null } | null;
}

export type OrgJoinPageModel =
  | { state: "invalid_token" }
  | { state: "auth_required"; redirectTo: string }
  | { state: "already_accepted"; redirectTo: string }
  | { state: "policy_restricted"; redirectTo: string }
  | { state: "ready"; payload: OrgJoinPagePayload };

export type CandidateApplyPageModel =
  | { state: "invalid_token" }
  | { state: "already_accepted"; invite: CandidateInviteContext }
  | { state: "policy_restricted"; invite: CandidateInviteContext }
  | { state: "expired_token"; invite: CandidateInviteContext }
  | { state: "ready"; invite: CandidateInviteContext };

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

function normalizeJoinError(error: unknown): MembershipOnboardingError {
  if (error instanceof MembershipOnboardingError) return error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new MembershipOnboardingError("ALREADY_IN_ORG", 409);
    }
    if (error.code === "P2025") {
      return new MembershipOnboardingError("INVITE_NOT_FOUND", 404);
    }
  }

  return new MembershipOnboardingError("INVALID_INPUT", 400);
}

function isMembershipRouteSource(source: AcceptanceRouteSource): boolean {
  return (
    source === "join.team.page" ||
    source === "join.org.page" ||
    source === "api.team.join" ||
    source === "api.org.join" ||
    source === "api.org.switch" ||
    source === "membership.resolve"
  );
}

function resolveMembershipKind(input: ResolveAcceptanceInput): MembershipJoinKind | null {
  if (input.targetContext?.kind === "team" || input.targetContext?.kind === "org") {
    return input.targetContext.kind;
  }
  if (input.routeSource === "join.team.page" || input.routeSource === "api.team.join" || input.routeSource === "api.org.switch") {
    return "team";
  }
  if (input.routeSource === "join.org.page" || input.routeSource === "api.org.join") {
    return "org";
  }
  return null;
}

function buildBaseResult(domain: "membership" | "candidate"): AcceptanceResult {
  return {
    domain,
    acceptanceState: "INVALID_ROUTE_SOURCE",
    machineState: "invalid_route",
    membershipResolution: null,
    candidateContext: null,
    membershipMutationResult: null,
    handoffContext: {
      signUpRedirectUrl: null,
      redirectTo: null,
      nextPath: null,
    },
    uiState: { view: "error" },
    errorState: null,
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
      email: true,
      birthYear: true,
      gender: true,
      consentedAt: true,
      onboardedAt: true,
    },
  });
  const activeMembership = await acceptanceRuntimeDeps.getActiveOrgMembership(profile.id);
  const activeOrg = activeMembership
    ? await prisma.organization.findUnique({
        where: { id: activeMembership.orgId },
        select: { id: true, name: true },
      })
    : null;

  return {
    profileId: profile.id,
    username: profile.username,
    email: profile.email,
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
  // A join-link kripto-random tokent hordoz (nem a rekord cuid id-ját).
  const invite = await prisma.teamPendingInvite.findUnique({
    where: { token: inviteId },
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
  // A join-link kripto-random tokent hordoz (nem a rekord cuid id-ját).
  const invite = await prisma.organizationPendingInvite.findUnique({
    where: { token: inviteId },
    select: {
      id: true,
      orgId: true,
      role: true,
      email: true,
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
    email: invite.email,
    isReusableInvite: invite.email === "__open__",
  };
}

async function resolveJoinNextPath(profileId: string): Promise<string> {
  if (!isSharedAcceptanceServiceEnabled()) {
    return "/dashboard";
  }
  const resolution = await acceptanceRuntimeDeps.resolveJourney(profileId, {
    entryPoint: "membership_join_handoff",
  });
  return resolution.destination;
}

async function resolveCandidateNextPath(clerkId: string | null): Promise<string | null> {
  if (!clerkId) return null;
  if (!isSharedAcceptanceServiceEnabled()) {
    return "/dashboard";
  }

  const resolution = await acceptanceRuntimeDeps.resolveJourneyForClerkId(clerkId, {
    entryPoint: "candidate_apply_handoff",
  });
  return resolution?.destination ?? JOURNEY_HOME_HANDOFF_PATH;
}

// Named (nem reusable) meghívó csak a címzett email-jével fogadható el.
// A "__open__" reusable linkek szabadok. Case-insensitive összevetés.
function inviteEmailMatches(
  invite: MembershipJoinInviteContext,
  actorEmail: string | null,
): boolean {
  if (invite.isReusableInvite) return true;
  const target = invite.email.trim().toLowerCase();
  if (!target || target === "__open__") return true;
  return Boolean(actorEmail && actorEmail.trim().toLowerCase() === target);
}

async function runJoinTransaction(
  actor: MembershipJoinActor,
  invite: MembershipJoinInviteContext,
  options: { skipOrgMembershipCreate?: boolean } = {},
): Promise<AcceptanceMembershipMutationResult> {
  // Jogosultság-kapu: a named meghívó a címzett fiókjához kötött. Ez a
  // mutáció egyetlen belépési pontja (shared + legacy + org-switch flow-k
  // mind ide futnak), így a kliens-oldali állapottól függetlenül véd.
  if (!inviteEmailMatches(invite, actor.email)) {
    throw new MembershipOnboardingError("INVITE_EMAIL_MISMATCH", 403);
  }

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
    await acceptanceRuntimeDeps.setActiveOrgContext(actor.profileId, invite.orgId);
    return {
      changed: true,
      kind: "team",
      orgId: invite.orgId,
      teamId: invite.teamId,
    };
  }

  await prisma.$transaction([
    prisma.organizationMember.upsert({
      where: { orgId_userId: { orgId: invite.orgId, userId: actor.profileId } },
      create: { orgId: invite.orgId, userId: actor.profileId, role: invite.role },
      update: { role: invite.role, leftAt: null },
    }),
    prisma.organizationPendingInvite.delete({ where: { id: invite.inviteId } }),
  ]);
  await acceptanceRuntimeDeps.setActiveOrgContext(actor.profileId, invite.orgId);

  // Notify org admins via orchestrator (fire-and-forget)
  import("@/lib/notifications").then(({ handleOrgInviteAccepted }) =>
    handleOrgInviteAccepted({
      orgId: invite.orgId,
      memberName: actor.username ?? "—",
      memberUserId: actor.profileId,
    }).catch((err) => log.error({ event: "acceptance.org_invite_accepted_error", err: err }, "Org invite accepted error")),
  );

  return {
    changed: true,
    kind: "org",
    orgId: invite.orgId,
    teamId: null,
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
        // A címzett már csapattag — a lógva maradt meghívó-sort eltakarítjuk,
        // különben a journey pending-join prioritása redirect-hurkot okoz
        // (join-oldal → journey → join-oldal). A next path-ot CSAK a törlés
        // után oldjuk fel, hogy már a meghívó nélküli állapotot lássa.
        if (!teamInvite.isReusableInvite) {
          await prisma.teamPendingInvite
            .delete({ where: { id: teamInvite.inviteId } })
            .catch(() => {});
        }
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
    if (inviteState === "INVITE_ACCEPTED") {
      // A címzett már org-tag — a lógva maradt meghívó-sort eltakarítjuk,
      // különben a journey pending-join prioritása redirect-hurkot okoz
      // (join-oldal → journey → join-oldal). A next path-ot CSAK a törlés
      // után oldjuk fel, hogy már a meghívó nélküli állapotot lássa.
      await prisma.organizationPendingInvite
        .delete({ where: { id: invite.inviteId } })
        .catch(() => {});
    }
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

// Jelölt-kitöltés értesítései: in-app notif + email az org tanácsadóinak
// (ORG_CONSULTANT) és adminjainak (ORG_ADMIN). Lazy importok, hogy a
// levelezés/notif-réteg csak ilyenkor töltődjön.
async function notifyCandidateCompleted(inviteId: string): Promise<void> {
  const invite = await prisma.candidateInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      orgId: true,
      team: { select: { orgId: true } },
    },
  });
  const orgId = invite?.orgId ?? invite?.team?.orgId ?? null;
  if (!invite || !orgId) return;

  const candidateName = invite.name ?? invite.email ?? "—";

  const { handleCandidateCompleted } = await import("@/lib/notifications");
  await handleCandidateCompleted({
    inviteId: invite.id,
    candidateName,
    position: invite.position,
    orgId,
  });

  const recipients = await prisma.organizationMember.findMany({
    where: {
      orgId,
      leftAt: null,
      role: { in: ["ORG_CONSULTANT", "ORG_ADMIN"] },
    },
    select: { user: { select: { email: true, locale: true } } },
  });
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.io").replace(/\/+$/, "");
  const resultUrl = `${appUrl}/hiring/${orgId}/candidates/${invite.id}`;

  const { sendCandidateCompletedEmail } = await import("@/lib/emails");
  await Promise.allSettled(
    recipients
      .map((m) => m.user)
      .filter((u): u is { email: string; locale: string | null } => Boolean(u.email))
      .map((u) =>
        sendCandidateCompletedEmail({
          to: u.email,
          candidateName,
          position: invite.position,
          resultUrl,
          locale: normalizeLocale(u.locale),
        }),
      ),
  );
}

async function resolveCandidateInviteContext(
  token: string,
): Promise<CandidateInviteContext | null> {
  const invite = await prisma.candidateInvite.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      testType: true,
      position: true,
      name: true,
      status: true,
      includeTeamRole: true,
      expiresAt: true,
      draftStartedAt: true,
      draftAnsweredCount: true,
    },
  });
  if (!invite) return null;

  return {
    id: invite.id,
    token: invite.token,
    testType: invite.testType,
    position: invite.position,
    name: invite.name,
    status: invite.status as CandidateInviteStatus,
    includeTeamRole: invite.includeTeamRole,
    expiresAt: invite.expiresAt,
    draftStartedAt: invite.draftStartedAt,
    draftAnsweredCount: invite.draftAnsweredCount,
  };
}

function mapMembershipUiState(state: MembershipInviteState): AcceptanceUiState {
  if (state === "INVITE_NOT_FOUND") return { view: "not_found" };
  if (state === "INVITED_UNAUTHENTICATED") return { view: "redirect" };
  if (state === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE") {
    return { view: "ready", requiresProfileCompletion: true };
  }
  if (state === "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED") {
    return { view: "ready", requiresOrgSwitch: true };
  }
  if (state === "INVITE_ACCEPTED") return { view: "completed" };
  return { view: "ready" };
}

function mapMembershipMachineState(
  resolution: MembershipInviteResolution,
): AcceptanceMachineState {
  if (resolution.inviteState === "INVITE_NOT_FOUND") return "invalid_token";
  if (resolution.inviteState === "INVITED_UNAUTHENTICATED") return "auth_required";
  if (resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE") {
    return "profile_completion_required";
  }
  if (resolution.inviteState === "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED") {
    return "org_mismatch";
  }
  if (resolution.inviteState === "INVITE_ACCEPTED") return "already_accepted";
  if (resolution.inviteState === "INVITED_READY_TO_JOIN" && resolution.kind === "team") {
    return "team_assignment_pending";
  }
  return "ready";
}

function mapCandidateMachineState(state: CandidateAcceptanceState): AcceptanceMachineState {
  if (state === "APPLY_NOT_FOUND") return "invalid_token";
  if (state === "APPLY_COMPLETED") return "already_accepted";
  if (state === "APPLY_CANCELED") return "policy_restricted";
  if (state === "APPLY_EXPIRED") return "expired_token";
  return "ready";
}

function toMembershipError(result: AcceptanceResult): AcceptanceResult {
  if (result.acceptanceState === "INVITE_NOT_FOUND") {
    return {
      ...result,
      errorState: { code: "INVITE_NOT_FOUND", status: 404 },
    };
  }
  if (result.acceptanceState === "INVITED_UNAUTHENTICATED") {
    return {
      ...result,
      errorState: { code: "UNAUTHORIZED", status: 401 },
    };
  }
  return result;
}

function toInvalidRouteError(domain: "membership" | "candidate"): AcceptanceResult {
  const base = buildBaseResult(domain);
  return {
    ...base,
    acceptanceState: "INVALID_ROUTE_SOURCE",
    machineState: "invalid_route",
    errorState: { code: "INVALID_INPUT", status: 400 },
    uiState: { view: "error" },
  };
}

function resolveClerkId(authState?: AcceptanceAuthState): string | null {
  if (!authState) return null;
  if (typeof authState.authenticated === "boolean") {
    if (!authState.authenticated) return null;
  }
  return authState.clerkId;
}

export async function resolveAcceptance(input: ResolveAcceptanceInput): Promise<AcceptanceResult> {
  const now = input.now ?? new Date();
  const isMembership = isMembershipRouteSource(input.routeSource) || input.targetContext?.kind === "team" || input.targetContext?.kind === "org";

  if (isMembership) {
    const kind = resolveMembershipKind(input);
    if (!kind) return toInvalidRouteError("membership");

    const membershipResolution = await resolveMembershipInviteResolution({
      kind,
      inviteId: input.token,
      clerkId: resolveClerkId(input.authState),
    });

    const base = buildBaseResult("membership");
    const result: AcceptanceResult = {
      ...base,
      acceptanceState: membershipResolution.inviteState,
      machineState: mapMembershipMachineState(membershipResolution),
      membershipResolution,
      handoffContext: {
        signUpRedirectUrl: membershipResolution.signUpRedirectUrl,
        redirectTo: membershipResolution.redirectTo,
        nextPath: membershipResolution.redirectTo,
      },
      uiState: mapMembershipUiState(membershipResolution.inviteState),
    };

    return toMembershipError(result);
  }

  const candidateContext = await resolveCandidateInviteContext(input.token);
  const base = buildBaseResult("candidate");
  if (!candidateContext) {
    return {
      ...base,
      acceptanceState: "APPLY_NOT_FOUND",
      machineState: mapCandidateMachineState("APPLY_NOT_FOUND"),
      uiState: { view: "not_found" },
      errorState: { code: "INVALID_TOKEN", status: 404 },
    };
  }

  if (candidateContext.status === "COMPLETED") {
    return {
      ...base,
      acceptanceState: "APPLY_COMPLETED",
      machineState: mapCandidateMachineState("APPLY_COMPLETED"),
      candidateContext,
      uiState: { view: "completed" },
    };
  }

  if (candidateContext.status === "CANCELED") {
    return {
      ...base,
      acceptanceState: "APPLY_CANCELED",
      machineState: mapCandidateMachineState("APPLY_CANCELED"),
      candidateContext,
      uiState: { view: "canceled" },
    };
  }

  if (candidateContext.expiresAt < now) {
    return {
      ...base,
      acceptanceState: "APPLY_EXPIRED",
      machineState: mapCandidateMachineState("APPLY_EXPIRED"),
      candidateContext,
      uiState: { view: "expired" },
    };
  }

  return {
    ...base,
    acceptanceState: "APPLY_READY",
    machineState: mapCandidateMachineState("APPLY_READY"),
    candidateContext,
    uiState: { view: "ready" },
  };
}

export async function acceptInvitation(input: AcceptInvitationInput): Promise<AcceptanceResult> {
  const resolved = await resolveAcceptance(input);
  if (resolved.domain !== "membership") {
    return toInvalidRouteError("candidate");
  }
  if (!resolved.membershipResolution) {
    return resolved;
  }

  const membershipResolution = resolved.membershipResolution;
  if (membershipResolution.inviteState === "INVITE_NOT_FOUND") return resolved;
  if (membershipResolution.inviteState === "INVITED_UNAUTHENTICATED") return resolved;

  if (!membershipResolution.actor || membershipResolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE") {
    return {
      ...resolved,
      errorState: {
        code: "PROFILE_INCOMPLETE",
        status: 409,
        details: {
          missingFields: membershipResolution.actor?.profileStatus.missingFields ?? [],
        },
      },
    };
  }
  if (!membershipResolution.invite) {
    return {
      ...resolved,
      errorState: { code: "INVITE_NOT_FOUND", status: 404 },
    };
  }

  const invite = membershipResolution.invite;

  if (input.routeSource === "api.org.switch") {
    if (
      membershipResolution.inviteState !== "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED" ||
      invite.kind !== "team"
    ) {
      return {
        ...resolved,
        errorState: { code: "INVALID_INPUT", status: 400 },
      };
    }
  }

  if (membershipResolution.inviteState === "INVITE_ACCEPTED") {
    const nextPath = await resolveJoinNextPath(membershipResolution.actor.profileId);
    return {
      ...resolved,
      handoffContext: {
        ...resolved.handoffContext,
        nextPath,
      },
      membershipMutationResult: {
        changed: false,
        kind: invite.kind,
        orgId: invite.orgId,
        teamId: invite.kind === "team" ? invite.teamId : null,
      },
      uiState: { view: "completed" },
    };
  }

  try {
    const mutationResult = await runJoinTransaction(membershipResolution.actor, invite, {
      skipOrgMembershipCreate:
        !(input.routeSource === "api.org.switch" || input.forceContextSwitch) &&
        invite.kind === "team" &&
        membershipResolution.actor.activeOrgMembership?.orgId === invite.orgId,
    });
    const nextPath = await resolveJoinNextPath(membershipResolution.actor.profileId);
    return {
      ...resolved,
      acceptanceState: "INVITE_ACCEPTED",
      machineState: "acceptance_success",
      membershipMutationResult: mutationResult,
      handoffContext: {
        ...resolved.handoffContext,
        nextPath,
      },
      uiState: { view: "completed" },
      errorState: null,
      membershipResolution: {
        ...membershipResolution,
        inviteState: "INVITE_ACCEPTED",
        redirectTo: nextPath,
      },
    };
  } catch (error) {
    const normalized = normalizeJoinError(error);
    return {
      ...resolved,
      errorState: {
        code: normalized.code,
        status: normalized.status,
        details: normalized.details,
      },
    };
  }
}

export async function completeAcceptance(input: CompleteAcceptanceInput): Promise<AcceptanceResult> {
  const resolved = await resolveAcceptance(input);
  if (resolved.domain === "membership") {
    return acceptInvitation(input);
  }

  const candidateContext = resolved.candidateContext;
  if (!candidateContext) return resolved;

  if (resolved.acceptanceState === "APPLY_COMPLETED") {
    return {
      ...resolved,
      errorState: { code: "ALREADY_USED", status: 400 },
    };
  }
  if (resolved.acceptanceState === "APPLY_EXPIRED") {
    return {
      ...resolved,
      errorState: { code: "INVITE_EXPIRED", status: 400 },
    };
  }
  if (resolved.acceptanceState === "APPLY_CANCELED") {
    return {
      ...resolved,
      errorState: { code: "INVITE_REVOKED", status: 400 },
    };
  }

  if (!input.answers) {
    return {
      ...resolved,
      errorState: { code: "INVALID_INPUT", status: 400 },
    };
  }

  const testType = candidateContext.testType as TestType;
  // A jelölt a kiszolgált formot tölti ki (operating-mode: short).
  // A teljesség-ellenőrzés a KÖZÖS forma-tudatos kapun megy (a többi beadási
  // úttal azonosan): a mai rövid vagy teljes forma pontos id-halmaza, illetve
  // egy korábbi rövid formáé is érvényes. A korábbi „csak a mai rövid forma
  // id-jaira szűrünk, aztán darabszámot hasonlítunk" változat egy forma-
  // összetétel-váltás után minden futó jelölt-kitöltést MISSING_ANSWER-rel
  // dobott volna (a kivezetett itemek már a szűrőn kiestek). A pontozás
  // formától független.
  const expectedIds = getAcceptedAnswerIds(testType);
  const relevantAnswers = input.answers.filter((a) => expectedIds.has(a.questionId));

  const answeredIds = new Set(relevantAnswers.map((a) => a.questionId));
  if (answeredIds.size !== relevantAnswers.length) {
    return {
      ...resolved,
      errorState: { code: "DUPLICATE_ANSWER", status: 400 },
    };
  }
  if (!isCompleteFormAnswerSet(testType, answeredIds)) {
    return {
      ...resolved,
      errorState: { code: "MISSING_ANSWER", status: 400 },
    };
  }

  const typedAnswers = relevantAnswers.map((a) => ({
    questionId: a.questionId,
    value: a.value,
  }));
  const scores = calculateScores(testType, typedAnswers);

  try {
    await prisma.$transaction([
      prisma.candidateResult.create({
        data: {
          inviteId: candidateContext.id,
          testType: candidateContext.testType,
          scores: {
            ...scores,
            answers: relevantAnswers,
            questionCount: relevantAnswers.length,
          },
        },
      }),
      prisma.candidateInvite.update({
        where: { id: candidateContext.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      }),
    ]);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return {
        ...resolved,
        errorState: { code: "ALREADY_USED", status: 400 },
      };
    }
    return {
      ...resolved,
      errorState: { code: "INVALID_INPUT", status: 400 },
    };
  }

  // Értesítés a tanácsadóknak + org adminoknak (notif + email) —
  // fire-and-forget, a jelölt válaszát nem blokkolja és nem buktatja.
  void notifyCandidateCompleted(candidateContext.id).catch((err) =>
    log.error({ event: "acceptance.completion_notify_error", err: err }, "completion notify error"),
  );

  const nextPath = await resolveCandidateNextPath(resolveClerkId(input.authState));

  return {
    ...resolved,
    acceptanceState: "APPLY_COMPLETED",
    machineState: "acceptance_success",
    handoffContext: {
      ...resolved.handoffContext,
      nextPath,
    },
    uiState: { view: "completed" },
    errorState: null,
    candidateContext: {
      ...candidateContext,
      status: "COMPLETED",
    },
  };
}

export async function resolveMembershipJoinPageAccess<const TAllowed extends MembershipInviteState>(
  params: {
    kind: MembershipJoinKind;
    inviteId: string;
    clerkId?: string | null;
    allowedStates: readonly TAllowed[];
  },
): Promise<MembershipJoinPageAccessResult<TAllowed>> {
  const isAllowedState = (state: MembershipInviteState): state is TAllowed =>
    (params.allowedStates as readonly MembershipInviteState[]).includes(state);

  const resolved = await resolveAcceptance({
    token: params.inviteId,
    routeSource: params.kind === "team" ? "join.team.page" : "join.org.page",
    authState: { clerkId: params.clerkId ?? null },
    targetContext: { kind: params.kind },
  });

  const resolution = resolved.membershipResolution;
  if (!resolution || resolution.inviteState === "INVITE_NOT_FOUND" || !resolution.invite) {
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

async function resolveTeamJoinPageModelLegacy(params: {
  inviteId: string;
  clerkId?: string | null;
}): Promise<TeamJoinPageModel> {
  const resolution = await resolveMembershipInviteResolution({
    kind: "team",
    inviteId: params.inviteId,
    clerkId: params.clerkId ?? null,
  });

  if (!resolution.invite || resolution.invite.kind !== "team") {
    return { state: "invalid_token" };
  }
  if (resolution.inviteState === "INVITE_NOT_FOUND") {
    return { state: "invalid_token" };
  }
  if (resolution.inviteState === "INVITED_UNAUTHENTICATED") {
    return {
      state: "auth_required",
      redirectTo:
        resolution.signUpRedirectUrl ?? buildSignUpRedirectUrl("team", params.inviteId),
    };
  }
  if (resolution.inviteState === "INVITE_ACCEPTED") {
    if (!resolution.actor) return { state: "invalid_token" };
    return {
      state: "already_accepted",
      redirectTo:
        resolution.redirectTo ?? (await resolveJoinNextPath(resolution.actor.profileId)),
    };
  }
  if (!resolution.actor) {
    return { state: "invalid_token" };
  }

  const existingOrg =
    resolution.inviteState === "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED"
      ? resolution.actor.activeOrgMembership
      : null;
  const alreadyInTargetOrg =
    resolution.actor.activeOrgMembership?.orgId === resolution.invite.orgId;
  const existingProfile =
    resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE"
      ? null
      : { username: resolution.actor.username };

  return {
    state: "ready",
    payload: {
      acceptanceState:
        resolution.inviteState === "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED"
          ? "org_mismatch"
          : resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE"
            ? "profile_completion_required"
            : "team_assignment_pending",
      inviteId: resolution.invite.inviteId,
      teamName: resolution.invite.teamName,
      orgName: resolution.invite.orgName,
      alreadyInTargetOrg: Boolean(alreadyInTargetOrg),
      existingProfile,
      existingOrg,
    },
  };
}

async function resolveOrgJoinPageModelLegacy(params: {
  inviteId: string;
  clerkId?: string | null;
}): Promise<OrgJoinPageModel> {
  const resolution = await resolveMembershipInviteResolution({
    kind: "org",
    inviteId: params.inviteId,
    clerkId: params.clerkId ?? null,
  });

  if (!resolution.invite || resolution.invite.kind !== "org") {
    return { state: "invalid_token" };
  }
  if (resolution.inviteState === "INVITE_NOT_FOUND") {
    return { state: "invalid_token" };
  }
  if (resolution.inviteState === "INVITED_UNAUTHENTICATED") {
    return {
      state: "auth_required",
      redirectTo:
        resolution.signUpRedirectUrl ?? buildSignUpRedirectUrl("org", params.inviteId),
    };
  }
  if (resolution.inviteState === "INVITE_ACCEPTED") {
    if (!resolution.actor) return { state: "invalid_token" };
    return {
      state: "already_accepted",
      redirectTo:
        resolution.redirectTo ?? (await resolveJoinNextPath(resolution.actor.profileId)),
    };
  }
  if (!resolution.actor) {
    return { state: "invalid_token" };
  }

  return {
    state: "ready",
    payload: {
      acceptanceState:
        resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE"
          ? "profile_completion_required"
          : "ready",
      inviteId: resolution.invite.inviteId,
      orgName: resolution.invite.orgName,
      existingProfile:
        resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE"
          ? null
          : { username: resolution.actor.username },
    },
  };
}

async function resolveCandidateApplyPageModelLegacy(params: {
  token: string;
}): Promise<CandidateApplyPageModel> {
  const invite = await resolveCandidateInviteContext(params.token);
  if (!invite) return { state: "invalid_token" };

  if (invite.status === "COMPLETED") {
    return { state: "already_accepted", invite };
  }
  if (invite.status === "CANCELED") {
    return { state: "policy_restricted", invite };
  }
  if (invite.expiresAt < new Date()) {
    return { state: "expired_token", invite };
  }

  return { state: "ready", invite };
}

export async function resolveTeamJoinPageModel(params: {
  inviteId: string;
  clerkId?: string | null;
}): Promise<TeamJoinPageModel> {
  if (!isSharedAcceptanceServiceEnabled()) {
    return resolveTeamJoinPageModelLegacy(params);
  }

  const acceptance = await resolveAcceptance({
    token: params.inviteId,
    routeSource: "join.team.page",
    authState: { clerkId: params.clerkId ?? null },
    targetContext: { kind: "team" },
  });
  const resolution = acceptance.membershipResolution;

  if (!resolution || !resolution.invite || resolution.invite.kind !== "team") {
    return { state: "invalid_token" };
  }
  if (acceptance.machineState === "invalid_token") {
    return { state: "invalid_token" };
  }
  if (acceptance.machineState === "auth_required") {
    return {
      state: "auth_required",
      redirectTo: resolution.signUpRedirectUrl ?? buildSignUpRedirectUrl("team", params.inviteId),
    };
  }
  if (acceptance.machineState === "already_accepted") {
    if (!resolution.actor) {
      return { state: "invalid_token" };
    }
    return {
      state: "already_accepted",
      redirectTo: resolution.redirectTo ?? (await resolveJoinNextPath(resolution.actor.profileId)),
    };
  }
  if (acceptance.machineState === "policy_restricted") {
    return {
      state: "policy_restricted",
      redirectTo: resolution.redirectTo ?? "/contact",
    };
  }

  if (!resolution.actor) {
    return { state: "invalid_token" };
  }

  const existingOrg =
    resolution.inviteState === "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED"
      ? resolution.actor.activeOrgMembership
      : null;
  const alreadyInTargetOrg = resolution.actor.activeOrgMembership?.orgId === resolution.invite.orgId;
  const existingProfile =
    resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE"
      ? null
      : { username: resolution.actor.username };

  return {
    state: "ready",
    payload: {
      acceptanceState:
        acceptance.machineState === "org_mismatch"
          ? "org_mismatch"
          : acceptance.machineState === "profile_completion_required"
            ? "profile_completion_required"
            : "team_assignment_pending",
      inviteId: resolution.invite.inviteId,
      teamName: resolution.invite.teamName,
      orgName: resolution.invite.orgName,
      alreadyInTargetOrg: Boolean(alreadyInTargetOrg),
      existingProfile,
      existingOrg,
    },
  };
}

export async function resolveOrgJoinPageModel(params: {
  inviteId: string;
  clerkId?: string | null;
}): Promise<OrgJoinPageModel> {
  if (!isSharedAcceptanceServiceEnabled()) {
    return resolveOrgJoinPageModelLegacy(params);
  }

  const acceptance = await resolveAcceptance({
    token: params.inviteId,
    routeSource: "join.org.page",
    authState: { clerkId: params.clerkId ?? null },
    targetContext: { kind: "org" },
  });
  const resolution = acceptance.membershipResolution;

  if (!resolution || !resolution.invite || resolution.invite.kind !== "org") {
    return { state: "invalid_token" };
  }
  if (acceptance.machineState === "invalid_token") {
    return { state: "invalid_token" };
  }
  if (acceptance.machineState === "auth_required") {
    return {
      state: "auth_required",
      redirectTo: resolution.signUpRedirectUrl ?? buildSignUpRedirectUrl("org", params.inviteId),
    };
  }
  if (acceptance.machineState === "already_accepted") {
    if (!resolution.actor) {
      return { state: "invalid_token" };
    }
    return {
      state: "already_accepted",
      redirectTo: resolution.redirectTo ?? (await resolveJoinNextPath(resolution.actor.profileId)),
    };
  }
  if (acceptance.machineState === "policy_restricted") {
    return {
      state: "policy_restricted",
      redirectTo: resolution.redirectTo ?? "/contact",
    };
  }

  if (!resolution.actor) {
    return { state: "invalid_token" };
  }

  return {
    state: "ready",
    payload: {
      acceptanceState:
        acceptance.machineState === "profile_completion_required"
          ? "profile_completion_required"
          : "ready",
      inviteId: resolution.invite.inviteId,
      orgName: resolution.invite.orgName,
      existingProfile:
        resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE"
          ? null
          : { username: resolution.actor.username },
    },
  };
}

export async function resolveCandidateApplyPageModel(params: {
  token: string;
}): Promise<CandidateApplyPageModel> {
  if (!isSharedAcceptanceServiceEnabled()) {
    return resolveCandidateApplyPageModelLegacy(params);
  }

  const acceptance = await resolveAcceptance({
    token: params.token,
    routeSource: "apply.page",
    targetContext: { kind: "candidate" },
  });
  const invite = acceptance.candidateContext;

  if (!invite || acceptance.machineState === "invalid_token") {
    return { state: "invalid_token" };
  }
  if (acceptance.machineState === "already_accepted") {
    return { state: "already_accepted", invite };
  }
  if (acceptance.machineState === "policy_restricted") {
    return { state: "policy_restricted", invite };
  }
  if (acceptance.machineState === "expired_token") {
    return { state: "expired_token", invite };
  }

  return { state: "ready", invite };
}

function throwMembershipOnboardingErrorFromErrorState(
  errorState: AcceptanceErrorState,
): never {
  throw new MembershipOnboardingError(
    (
      [
        "UNAUTHORIZED",
        "INVALID_INPUT",
        "INVITE_NOT_FOUND",
        "INVITE_EMAIL_MISMATCH",
        "ALREADY_IN_ORG",
        "PROFILE_INCOMPLETE",
      ] as const
    ).includes(errorState.code as MembershipOnboardingErrorCode)
      ? (errorState.code as MembershipOnboardingErrorCode)
      : "INVALID_INPUT",
    errorState.status,
    errorState.details,
  );
}

async function acceptMembershipInviteLegacy(params: {
  clerkId: string;
  kind: MembershipJoinKind;
  inviteId: string;
  forceContextSwitch?: boolean;
}): Promise<{ nextPath: string }> {
  const resolution = await resolveMembershipInviteResolution({
    kind: params.kind,
    inviteId: params.inviteId,
    clerkId: params.clerkId,
  });

  if (resolution.inviteState === "INVITE_NOT_FOUND") {
    throw new MembershipOnboardingError("INVITE_NOT_FOUND", 404);
  }
  if (resolution.inviteState === "INVITED_UNAUTHENTICATED") {
    throw new MembershipOnboardingError("UNAUTHORIZED", 401);
  }
  if (
    !resolution.actor ||
    resolution.inviteState === "INVITED_AUTHENTICATED_PROFILE_INCOMPLETE"
  ) {
    throw new MembershipOnboardingError("PROFILE_INCOMPLETE", 409, {
      missingFields: resolution.actor?.profileStatus.missingFields ?? [],
    });
  }
  if (!resolution.invite) {
    throw new MembershipOnboardingError("INVITE_NOT_FOUND", 404);
  }

  const invite = resolution.invite;
  const isForcedTeamSwitch = Boolean(params.forceContextSwitch);

  if (isForcedTeamSwitch) {
    if (
      invite.kind !== "team" ||
      resolution.inviteState !== "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED"
    ) {
      throw new MembershipOnboardingError("INVALID_INPUT", 400);
    }
  } else if (
    resolution.inviteState === "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED"
  ) {
    throw new MembershipOnboardingError("ALREADY_IN_ORG", 409);
  }

  if (resolution.inviteState === "INVITE_ACCEPTED") {
    return { nextPath: await resolveJoinNextPath(resolution.actor.profileId) };
  }

  if (resolution.inviteState !== "INVITED_READY_TO_JOIN") {
    throw new MembershipOnboardingError("INVALID_INPUT", 400);
  }

  try {
    await runJoinTransaction(resolution.actor, invite, {
      skipOrgMembershipCreate:
        !isForcedTeamSwitch &&
        invite.kind === "team" &&
        resolution.actor.activeOrgMembership?.orgId === invite.orgId,
    });
    return { nextPath: await resolveJoinNextPath(resolution.actor.profileId) };
  } catch (error) {
    const normalized = normalizeJoinError(error);
    throw new MembershipOnboardingError(
      normalized.code,
      normalized.status,
      normalized.details,
    );
  }
}

export async function joinMembershipFromInvite(params: {
  clerkId: string;
  kind: MembershipJoinKind;
  inviteId: string;
}): Promise<MembershipJoinResult> {
  if (!isSharedAcceptanceServiceEnabled()) {
    const legacy = await acceptMembershipInviteLegacy({
      clerkId: params.clerkId,
      kind: params.kind,
      inviteId: params.inviteId,
    });
    return {
      ok: true,
      acceptanceState: "acceptance_success",
      inviteState: "INVITE_ACCEPTED",
      nextPath: legacy.nextPath,
    };
  }

  const result = await acceptInvitation({
    token: params.inviteId,
    routeSource: params.kind === "team" ? "api.team.join" : "api.org.join",
    authState: { clerkId: params.clerkId },
    targetContext: { kind: params.kind },
  });

  if (result.errorState) {
    throwMembershipOnboardingErrorFromErrorState(result.errorState);
  }

  return {
    ok: true,
    acceptanceState: "acceptance_success",
    inviteState: "INVITE_ACCEPTED",
    nextPath: result.handoffContext.nextPath ?? JOURNEY_HOME_HANDOFF_PATH,
  };
}

export async function switchMembershipContextFromInvite(params: {
  clerkId: string;
  inviteId: string;
}): Promise<{ ok: true; nextPath: string }> {
  if (!isSharedAcceptanceServiceEnabled()) {
    const legacy = await acceptMembershipInviteLegacy({
      clerkId: params.clerkId,
      kind: "team",
      inviteId: params.inviteId,
      forceContextSwitch: true,
    });
    return {
      ok: true,
      nextPath: legacy.nextPath,
    };
  }

  const result = await acceptInvitation({
    token: params.inviteId,
    routeSource: "api.org.switch",
    authState: { clerkId: params.clerkId },
    targetContext: { kind: "team" },
    forceContextSwitch: true,
  });

  if (result.errorState) {
    throwMembershipOnboardingErrorFromErrorState(result.errorState);
  }

  return {
    ok: true,
    nextPath: result.handoffContext.nextPath ?? JOURNEY_HOME_HANDOFF_PATH,
  };
}
