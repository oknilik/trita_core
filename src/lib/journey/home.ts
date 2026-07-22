import type {
  ActiveSurface,
  HomeReason,
  JourneyContextSnapshot,
  JourneyHomeResolution,
  JourneyState,
} from "@/lib/journey/types";

export interface JourneyHomeDecision {
  activeSurface: ActiveSurface;
  home: JourneyHomeResolution;
}

function buildHomeResolution(
  destination: string,
  reason: HomeReason,
  primaryAction: JourneyState["recommendedNextAction"],
): JourneyHomeResolution {
  return {
    destination,
    reason,
    primaryAction: primaryAction ?? undefined,
  };
}

function resolvePendingJoinDestination(context: JourneyContextSnapshot): string | null {
  const invite = context.pendingJoinInvite;
  if (!invite) return null;
  if (invite.kind === "org") return `/join/org/${invite.token}`;
  return `/join/${invite.token}`;
}

export function resolveHome(params: {
  context: JourneyContextSnapshot;
  state: JourneyState;
}): JourneyHomeDecision {
  const { context, state } = params;
  const primaryAction = state.recommendedNextAction;

  // 1) Pending join always wins.
  const pendingJoinDestination = resolvePendingJoinDestination(context);
  if (pendingJoinDestination) {
    return {
      activeSurface: "continuation",
      home: buildHomeResolution(pendingJoinDestination, "pending_join", primaryAction),
    };
  }

  // 2) Current obligation: unfinished self assessment.
  if (state.currentStage === "SELF_IN_PROGRESS") {
    return {
      activeSurface: "continuation",
      home: buildHomeResolution("/assessment", "assessment_continuation", primaryAction),
    };
  }

  // 3a) Admin org cockpit — the org page is the cockpit.
  if (context.currentContext === "org-admin") {
    return {
      activeSurface: "org",
      home: buildHomeResolution(
        context.orgId ? `/org/${context.orgId}` : "/profile/results",
        "org_cockpit",
        primaryAction,
      ),
    };
  }

  // 3b) Manager team cockpit.
  if (context.currentContext === "org-manager") {
    return {
      activeSurface: "team",
      home: buildHomeResolution("/manager", "manager_cockpit", primaryAction),
    };
  }

  // 4) Org member without self completion still goes to assessment.
  if (context.currentContext === "org-member" && !context.assessment.completed) {
    return {
      activeSurface: "personal",
      home: buildHomeResolution("/assessment", "assessment_continuation", primaryAction),
    };
  }

  // 5) Org member with completed self can land on team home (if team context exists).
  if (context.currentContext === "org-member" && context.assessment.completed && context.teamId) {
    return {
      activeSurface: "team",
      home: buildHomeResolution(`/team/${context.teamId}`, "team_home", primaryAction),
    };
  }

  // 6) Personal home after completed self.
  if (
    state.currentStage === "SELF_COMPLETED" ||
    state.currentStage === "OBSERVER_PENDING" ||
    state.currentStage === "TEAM_NOT_JOINED"
  ) {
    return {
      activeSurface: "personal",
      home: buildHomeResolution("/profile/results", "personal_home", primaryAction),
    };
  }

  // 7) First entry.
  if (state.currentStage === "SELF_NOT_STARTED") {
    return {
      activeSurface: "personal",
      home: buildHomeResolution("/assessment", "first_assessment", primaryAction),
    };
  }

  // Team/org deeper stages.
  if (
    state.currentStage === "TEAM_PENDING_MEMBERS" ||
    state.currentStage === "TEAM_PARTIAL" ||
    state.currentStage === "TEAM_READY"
  ) {
    return {
      activeSurface: "team",
      home: buildHomeResolution(context.teamId ? `/team/${context.teamId}` : "/team", "team_home", primaryAction),
    };
  }

  if (state.currentStage === "ORG_PARTIAL" || state.currentStage === "ORG_READY") {
    return {
      activeSurface: "org",
      home: buildHomeResolution(
        context.orgId ? `/org/${context.orgId}` : "/profile/results",
        "org_cockpit",
        primaryAction,
      ),
    };
  }

  return {
    activeSurface: "personal",
    home: buildHomeResolution("/assessment", "first_assessment", primaryAction),
  };
}
