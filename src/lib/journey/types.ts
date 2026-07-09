export const JOURNEY_STAGES = [
  "SELF_NOT_STARTED",
  "SELF_IN_PROGRESS",
  "SELF_COMPLETED",
  "OBSERVER_PENDING",
  "TEAM_NOT_JOINED",
  "TEAM_PENDING_MEMBERS",
  "TEAM_PARTIAL",
  "TEAM_READY",
  "ORG_PARTIAL",
  "ORG_READY",
] as const;

export type JourneyStage = (typeof JOURNEY_STAGES)[number];

export type JourneyActionId =
  | "START_SELF_ASSESSMENT"
  | "CONTINUE_SELF_ASSESSMENT"
  | "REVIEW_SELF_RESULTS"
  | "INVITE_OBSERVERS"
  | "MANAGE_OBSERVER_INVITES"
  | "CREATE_TEAM"
  | "JOIN_TEAM"
  | "INVITE_TEAM_MEMBERS"
  | "COMPLETE_TEAM_ASSESSMENTS"
  | "VIEW_TEAM_INSIGHTS"
  | "CREATE_ORG_TEAM"
  | "INVITE_ORG_MEMBERS"
  | "LAUNCH_ORG_CAMPAIGN"
  | "VIEW_ORG_INSIGHTS";

export type JourneyBlockingReasonCode =
  | "SELF_ASSESSMENT_MISSING"
  | "SELF_ASSESSMENT_INCOMPLETE"
  | "OBSERVER_RESPONSES_PENDING"
  | "TEAM_MEMBERSHIP_MISSING"
  | "MIN_TEAM_SIZE_NOT_MET"
  | "TEAM_MEMBER_INVITES_PENDING"
  | "TEAM_MEMBER_ASSESSMENTS_PENDING"
  | "ORG_TEAM_MISSING"
  | "ORG_MEMBER_ASSESSMENTS_PENDING"
  | "ORG_CAMPAIGN_MISSING";

export interface JourneyAction {
  id: JourneyActionId;
  href: string;
  scope: "self" | "team" | "org";
}

export interface JourneyBlockingReason {
  code: JourneyBlockingReasonCode;
  detail?: string;
}

export interface JourneyCompletionSummary {
  self: {
    started: boolean;
    completed: boolean;
    skipped: boolean;
    hasDraft: boolean;
    sentInvites: number;
    pendingInvites: number;
    completedObservers: number;
    pendingTeamInvites: number;
    pendingOrgInvites: number;
    explicitTeamIntent: boolean;
  };
  team: {
    joined: boolean;
    teamId: string | null;
    memberCount: number;
    completedMemberCount: number;
    pendingInviteCount: number;
    ready: boolean;
  };
  org: {
    joined: boolean;
    orgId: string | null;
    teamCount: number;
    memberCount: number;
    completedMemberCount: number;
    pendingInviteCount: number;
    activeCampaignCount: number;
    ready: boolean;
  };
}

export interface JourneyState {
  currentStage: JourneyStage;
  recommendedNextAction: JourneyAction | null;
  availableNextActions: JourneyAction[];
  blockingReasons: JourneyBlockingReason[];
  completionSummary: JourneyCompletionSummary;
}

type StringLiteralUnion<LiteralType extends string> =
  | LiteralType
  | (string & Record<never, never>);

export type KnownJourneyEntryIntent = "explore" | "team";
export type JourneyEntryIntent = StringLiteralUnion<KnownJourneyEntryIntent>;

export type ActiveSurface = "personal" | "team" | "org" | "continuation";
export type JourneyCurrentContext =
  | "self-only"
  | "org-member"
  | "org-manager"
  | "org-admin";

export type HomeReason =
  | "pending_join"
  | "assessment_continuation"
  | "org_cockpit"
  | "manager_cockpit"
  | "team_home"
  | "personal_home"
  | "first_assessment";

export interface ScopeProgressStep {
  labelKey: string;
  done: boolean;
}

export interface ScopeProgress {
  scope: "self" | "team" | "org";
  scopeProgress: number;
  labelKey: string;
  substeps?: ScopeProgressStep[];
}

export interface JourneyStageDisplay {
  label: JourneyProgressLabel;
  scopeProgress: number;
  substeps?: JourneyProgressStep[];
}

export type JourneyProgressScope = "personal" | "team" | "org";

export interface JourneyProgressLabel {
  hu: string;
  en: string;
}

export interface JourneyProgressStep {
  id: string;
  label: JourneyProgressLabel;
  done: boolean;
}

export interface JourneyScopeProgress {
  scope: JourneyProgressScope;
  label: JourneyProgressLabel;
  scopeProgress: number;
  substeps?: JourneyProgressStep[];
}

export interface JourneyResolvedCta {
  id: JourneyActionId;
  label: string;
  href: string;
}

export interface JourneyNextBestAction {
  stage: JourneyStage;
  primary: JourneyResolvedCta;
  secondary: JourneyResolvedCta | null;
  explanation: string;
}

export interface JourneyHomeResolution {
  destination: string;
  reason: HomeReason;
  primaryAction?: JourneyAction;
}

export interface JourneyExperienceHints {
  showOrgExpansionPrompt: boolean;
  showTeamCreationBanner: boolean;
  showAssessmentContinuation: boolean;
}

export interface JourneyRestrictionFlags {
  subscriptionState: JourneySubscriptionState;
  missingOrgSubscription: boolean;
  readOnlyOrgViews: boolean;
  disableOrgWriteActions: boolean;
  hideDetailedOrgInsights: boolean;
  requiresSubscriptionAction: boolean;
}

export type JourneySubscriptionState = "none" | "active" | "restricted" | "frozen";

export interface JourneyAssessmentSnapshot {
  started: boolean;
  completed: boolean;
  skipped: boolean;
  hasDraft: boolean;
  hasResult: boolean;
}

export interface JourneyOrgMembershipSnapshot {
  orgId: string;
  role: string;
  joinedAt: Date;
}

export interface JourneyTeamMembershipSnapshot {
  teamId: string;
  role: string;
  joinedAt: Date;
  orgId: string | null;
}

export interface JourneyPendingJoinInviteSnapshot {
  kind: "team" | "org";
  inviteId: string;
  email: string;
  teamId: string | null;
  orgId: string | null;
  role: string | null;
  createdAt: Date;
}

export interface JourneySubscriptionSnapshot {
  state: JourneySubscriptionState;
  orgId: string | null;
  status: string;
  hasAccess: boolean;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface JourneyContextSnapshot {
  profileId: string;
  entryIntent: JourneyEntryIntent;
  currentContext: JourneyCurrentContext;
  activeSurface: ActiveSurface;
  teamId: string | null;
  orgId: string | null;
  hasPendingJoinInvite: boolean;
  explicitTeamIntent: boolean;
  assessment: JourneyAssessmentSnapshot;
  orgMembership: JourneyOrgMembershipSnapshot | null;
  teamMembership: JourneyTeamMembershipSnapshot | null;
  pendingJoinInvite: JourneyPendingJoinInviteSnapshot | null;
  pendingInviteCounts: {
    team: number;
    org: number;
  };
  subscription: JourneySubscriptionSnapshot;
  completionSummary: JourneyCompletionSummary;
}

/**
 * Stable route-agnostic handoff contract for any entrypoint.
 * Entry surfaces (auth, onboarding, join, billing return, deep links) can use this
 * without re-implementing page-level journey decision logic.
 */
export interface JourneyHandoffContract {
  activeSurface: ActiveSurface;
  stage: JourneyStage;
  destination: string;
  reason: HomeReason;
  nextBestAction: JourneyNextBestAction;
  scopeProgress: JourneyScopeProgress;
  experienceHints: JourneyExperienceHints;
  restrictionFlags: JourneyRestrictionFlags;
}

export interface JourneyResolution extends JourneyHandoffContract {
  entryIntent: JourneyEntryIntent;
  currentContext: JourneyCurrentContext;
  stageDisplay: JourneyStageDisplay;
  home: JourneyHomeResolution;
  state: JourneyState;
}
