import type {
  JourneyCompletionSummary,
  JourneyContextSnapshot,
  JourneyResolution,
  JourneyStage,
  JourneyState,
} from "@/lib/journey/types";
import { createJourneySubscriptionSnapshot } from "./subscription-factory";

export type JourneyCompletionSummaryOverrides = {
  self?: Partial<JourneyCompletionSummary["self"]>;
  team?: Partial<JourneyCompletionSummary["team"]>;
  org?: Partial<JourneyCompletionSummary["org"]>;
};

export type JourneyContextOverrides = Omit<
  Partial<JourneyContextSnapshot>,
  "assessment" | "pendingInviteCounts" | "subscription" | "completionSummary"
> & {
  assessment?: Partial<JourneyContextSnapshot["assessment"]>;
  pendingInviteCounts?: Partial<JourneyContextSnapshot["pendingInviteCounts"]>;
  subscription?: Partial<JourneyContextSnapshot["subscription"]>;
  completionSummary?: JourneyCompletionSummaryOverrides;
};

export type JourneyStateOverrides = Omit<
  Partial<JourneyState>,
  "completionSummary"
> & {
  completionSummary?: JourneyCompletionSummaryOverrides;
};

export type JourneyResolutionOverrides = Omit<
  Partial<JourneyResolution>,
  "home" | "stageDisplay" | "scopeProgress" | "state"
> & {
  home?: Partial<JourneyResolution["home"]>;
  stageDisplay?: Partial<JourneyResolution["stageDisplay"]>;
  scopeProgress?: Partial<JourneyResolution["scopeProgress"]>;
  state?: JourneyStateOverrides;
};

function createBaseCompletionSummary(): JourneyCompletionSummary {
  return {
    self: {
      started: false,
      completed: false,
      skipped: false,
      hasDraft: false,
      sentInvites: 0,
      pendingInvites: 0,
      completedObservers: 0,
      pendingTeamInvites: 0,
      pendingOrgInvites: 0,
      explicitTeamIntent: false,
      orgGoverned: false,
    },
    team: {
      joined: false,
      teamId: null,
      memberCount: 0,
      completedMemberCount: 0,
      pendingInviteCount: 0,
      ready: false,
    },
    org: {
      joined: false,
      orgId: null,
      teamCount: 0,
      memberCount: 0,
      completedMemberCount: 0,
      pendingInviteCount: 0,
      activeCampaignCount: 0,
      ready: false,
    },
  };
}

function mergeCompletionSummary(
  base: JourneyCompletionSummary,
  overrides?: JourneyCompletionSummaryOverrides,
): JourneyCompletionSummary {
  return {
    self: { ...base.self, ...(overrides?.self ?? {}) },
    team: { ...base.team, ...(overrides?.team ?? {}) },
    org: { ...base.org, ...(overrides?.org ?? {}) },
  };
}

function createBaseJourneyContext(): JourneyContextSnapshot {
  return {
    profileId: "profile_test_1",
    canManageMeasurements: false,
    entryIntent: "explore",
    currentContext: "self-only",
    activeSurface: "personal",
    teamId: null,
    orgId: null,
    hasPendingJoinInvite: false,
    explicitTeamIntent: false,
    assessment: {
      started: false,
      completed: false,
      skipped: false,
      hasDraft: false,
      hasResult: false,
    },
    orgMembership: null,
    teamMembership: null,
    pendingJoinInvite: null,
    pendingInviteCounts: { team: 0, org: 0 },
    subscription: createJourneySubscriptionSnapshot(),
    completionSummary: createBaseCompletionSummary(),
  };
}

export function buildJourneyContext(
  overrides: JourneyContextOverrides = {},
): JourneyContextSnapshot {
  const base = createBaseJourneyContext();
  return {
    ...base,
    ...overrides,
    assessment: { ...base.assessment, ...(overrides.assessment ?? {}) },
    pendingInviteCounts: {
      ...base.pendingInviteCounts,
      ...(overrides.pendingInviteCounts ?? {}),
    },
    subscription: { ...base.subscription, ...(overrides.subscription ?? {}) },
    completionSummary: mergeCompletionSummary(
      base.completionSummary,
      overrides.completionSummary,
    ),
  };
}

export function buildJourneyState(
  stage: JourneyStage = "SELF_NOT_STARTED",
  overrides: JourneyStateOverrides = {},
): JourneyState {
  const baseCompletion = createBaseCompletionSummary();
  return {
    currentStage: stage,
    recommendedNextAction: null,
    availableNextActions: [],
    blockingReasons: [],
    ...overrides,
    completionSummary: mergeCompletionSummary(
      baseCompletion,
      overrides.completionSummary,
    ),
  };
}

export function buildJourneyResolution(
  destination = "/profile/results",
  overrides: JourneyResolutionOverrides = {},
): JourneyResolution {
  const stage = overrides.stage ?? "SELF_COMPLETED";
  const baseState = buildJourneyState(stage);
  const base: JourneyResolution = {
    activeSurface: "personal",
    entryIntent: "explore",
    currentContext: "self-only",
    stage,
    stageDisplay: {
      label: { hu: "Kesz", en: "Done" },
      scopeProgress: 100,
    },
    destination,
    reason: "personal_home",
    home: {
      destination,
      reason: "personal_home",
    },
    nextBestAction: {
      stage,
      primary: {
        id: "REVIEW_SELF_RESULTS",
        label: "View results",
        href: "/profile/results",
      },
      secondary: null,
      explanation: "Continue personal journey.",
    },
    scopeProgress: {
      scope: "personal",
      label: { hu: "Kesz", en: "Done" },
      scopeProgress: 100,
    },
    experienceHints: {
      showOrgExpansionPrompt: false,
      showTeamCreationBanner: false,
      showAssessmentContinuation: false,
    },
    restrictionFlags: {
      subscriptionState: "active",
      missingOrgSubscription: false,
      readOnlyOrgViews: false,
      disableOrgWriteActions: false,
      hideDetailedOrgInsights: false,
      requiresSubscriptionAction: false,
    },
    state: baseState,
  };

  const mergedHome = { ...base.home, ...(overrides.home ?? {}) };
  const mergedDestination = overrides.destination ?? mergedHome.destination;
  const mergedReason = overrides.reason ?? mergedHome.reason;
  const mergedState = buildJourneyState(stage, overrides.state);

  return {
    ...base,
    ...overrides,
    stage,
    destination: mergedDestination,
    reason: mergedReason,
    home: {
      ...mergedHome,
      destination: mergedDestination,
      reason: mergedReason,
    },
    stageDisplay: { ...base.stageDisplay, ...(overrides.stageDisplay ?? {}) },
    scopeProgress: { ...base.scopeProgress, ...(overrides.scopeProgress ?? {}) },
    state: mergedState,
  };
}
