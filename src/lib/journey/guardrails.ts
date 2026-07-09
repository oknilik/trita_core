import type {
  ActiveSurface,
  HomeReason,
  JourneyActionId,
  JourneyContextSnapshot,
  JourneyRestrictionFlags,
  JourneyState,
} from "@/lib/journey/types";

export interface JourneyGuardrailHomeState {
  activeSurface: ActiveSurface;
  destination: string;
  reason: HomeReason;
}

export interface JourneyInvariantViolation {
  code:
    | "UNFINISHED_ASSESSMENT_NOT_FORCED"
    | "PENDING_JOIN_NOT_PRIORITIZED"
    | "SELF_ONLY_ORG_HOME"
    | "RESTRICTED_WRITE_ACTION_EXPOSED";
  detail: string;
}

interface GuardrailInput {
  context: JourneyContextSnapshot;
  state: JourneyState;
  home: JourneyGuardrailHomeState;
}

interface GuardrailOutput {
  state: JourneyState;
  home: JourneyGuardrailHomeState;
  restrictionFlags: JourneyRestrictionFlags;
}

const WRITE_BLOCKED_ACTION_IDS = new Set<JourneyActionId>([
  "CREATE_TEAM",
  "INVITE_TEAM_MEMBERS",
  "CREATE_ORG_TEAM",
  "INVITE_ORG_MEMBERS",
  "LAUNCH_ORG_CAMPAIGN",
]);

function resolvePendingJoinDestination(context: JourneyContextSnapshot): string | null {
  const invite = context.pendingJoinInvite;
  if (!invite) return null;
  return invite.kind === "org" ? `/join/org/${invite.inviteId}` : `/join/${invite.inviteId}`;
}

function applyWriteRestrictions(
  state: JourneyState,
  restrictionFlags: JourneyRestrictionFlags,
): JourneyState {
  if (!restrictionFlags.disableOrgWriteActions) return state;

  const availableNextActions = state.availableNextActions.filter(
    (action) => !WRITE_BLOCKED_ACTION_IDS.has(action.id),
  );

  return {
    ...state,
    recommendedNextAction: availableNextActions[0] ?? null,
    availableNextActions,
  };
}

function buildRestrictionFlags(context: JourneyContextSnapshot): JourneyRestrictionFlags {
  const subscriptionState = context.subscription.state;
  const hasOrgScope =
    context.currentContext !== "self-only" ||
    Boolean(context.orgMembership) ||
    Boolean(context.orgId);
  const readOnlyOrgViews =
    hasOrgScope &&
    (subscriptionState === "restricted" || subscriptionState === "frozen");

  return {
    subscriptionState,
    missingOrgSubscription: hasOrgScope && subscriptionState === "none",
    readOnlyOrgViews,
    disableOrgWriteActions: readOnlyOrgViews,
    hideDetailedOrgInsights: hasOrgScope && subscriptionState === "frozen",
    requiresSubscriptionAction:
      hasOrgScope &&
      (subscriptionState === "none" ||
        subscriptionState === "restricted" ||
        subscriptionState === "frozen"),
  };
}

function enforceHomePriorityInvariants(
  context: JourneyContextSnapshot,
  home: JourneyGuardrailHomeState,
): JourneyGuardrailHomeState {
  // Pending join acceptance always preempts team/org homes.
  const pendingJoinDestination = resolvePendingJoinDestination(context);
  if (pendingJoinDestination) {
    return {
      activeSurface: "continuation",
      destination: pendingJoinDestination,
      reason: "pending_join",
    };
  }

  // Current obligation: unfinished assessment must go to /assessment.
  if (context.assessment.started && !context.assessment.completed) {
    return {
      activeSurface: "continuation",
      destination: "/assessment",
      reason: "assessment_continuation",
    };
  }

  // Self-only users must not be sent to org home.
  if (
    context.currentContext === "self-only" &&
    (home.activeSurface === "org" || home.reason === "org_cockpit" || home.destination === "/dashboard")
  ) {
    return context.assessment.completed
      ? {
          activeSurface: "personal",
          destination: "/profile/results",
          reason: "personal_home",
        }
      : {
          activeSurface: "personal",
          destination: "/assessment",
          reason: "first_assessment",
        };
  }

  return home;
}

export function enforceJourneyGuardrails(input: GuardrailInput): GuardrailOutput {
  const restrictionFlags = buildRestrictionFlags(input.context);
  const state = applyWriteRestrictions(input.state, restrictionFlags);
  const home = enforceHomePriorityInvariants(input.context, input.home);

  return {
    state,
    home,
    restrictionFlags,
  };
}

export function assertJourneyInvariants(input: {
  context: JourneyContextSnapshot;
  state: JourneyState;
  home: JourneyGuardrailHomeState;
  restrictionFlags: JourneyRestrictionFlags;
}): JourneyInvariantViolation[] {
  const violations: JourneyInvariantViolation[] = [];

  if (
    input.context.assessment.started &&
    !input.context.assessment.completed &&
    input.home.destination !== "/assessment"
  ) {
    violations.push({
      code: "UNFINISHED_ASSESSMENT_NOT_FORCED",
      detail: "Unfinished assessment must resolve to /assessment.",
    });
  }

  if (
    input.context.pendingJoinInvite &&
    !(input.home.reason === "pending_join" && input.home.activeSurface === "continuation")
  ) {
    violations.push({
      code: "PENDING_JOIN_NOT_PRIORITIZED",
      detail: "Pending join acceptance must preempt team/org home destinations.",
    });
  }

  if (
    input.context.currentContext === "self-only" &&
    (input.home.reason === "org_cockpit" || input.home.activeSurface === "org")
  ) {
    violations.push({
      code: "SELF_ONLY_ORG_HOME",
      detail: "Self-only users cannot resolve to org cockpit as home.",
    });
  }

  if (input.restrictionFlags.disableOrgWriteActions) {
    const writeAction = input.state.availableNextActions.find((action) =>
      WRITE_BLOCKED_ACTION_IDS.has(action.id),
    );
    if (writeAction) {
      violations.push({
        code: "RESTRICTED_WRITE_ACTION_EXPOSED",
        detail: `Write capability action remained available: ${writeAction.id}.`,
      });
    }
  }

  return violations;
}

