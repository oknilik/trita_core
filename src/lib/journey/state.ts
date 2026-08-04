import "server-only";

import { prisma } from "@/lib/prisma";
import { resolveJourneyContext } from "@/lib/journey/context";
import { isConsultingLed } from "@/lib/operating-mode";
import type {
  JourneyAction,
  JourneyActionId,
  JourneyBlockingReason,
  JourneyContextSnapshot,
  JourneyStage,
  JourneyState,
} from "@/lib/journey/types";
export { JOURNEY_STAGES } from "@/lib/journey/types";
export type {
  JourneyAction,
  JourneyActionId,
  JourneyBlockingReason,
  JourneyBlockingReasonCode,
  JourneyCompletionSummary,
  JourneyStage,
  JourneyState,
} from "@/lib/journey/types";

const MIN_MEMBERS_FOR_TEAM_INSIGHTS = 3;
const MIN_MEMBERS_FOR_ORG_INSIGHTS = 3;

interface JourneyContextOptions {
  teamId?: string | null;
  orgId?: string | null;
}

function uniqueActions(actions: JourneyAction[]): JourneyAction[] {
  const seen = new Set<JourneyActionId>();
  return actions.filter((action) => {
    if (seen.has(action.id)) return false;
    seen.add(action.id);
    return true;
  });
}

function buildActionMap(context: JourneyContextSnapshot): Record<JourneyActionId, JourneyAction> {
  const teamHref = context.teamId ? `/team/${context.teamId}` : "/team";
  const teamMembersHref = context.teamId ? `/team/${context.teamId}?tab=members` : "/team";
  const orgHref = context.orgId ? `/org/${context.orgId}` : "/org";
  const orgTeamsHref = context.orgId ? `/org/${context.orgId}?tab=teams` : "/org";
  const orgMembersHref = context.orgId ? `/org/${context.orgId}?tab=members` : "/org";
  const orgCampaignHref = context.orgId ? `/org/${context.orgId}/campaigns/new` : "/org";

  return {
    START_SELF_ASSESSMENT: { id: "START_SELF_ASSESSMENT", href: "/assessment", scope: "self" },
    CONTINUE_SELF_ASSESSMENT: { id: "CONTINUE_SELF_ASSESSMENT", href: "/assessment", scope: "self" },
    REVIEW_SELF_RESULTS: { id: "REVIEW_SELF_RESULTS", href: "/profile/results", scope: "self" },
    INVITE_OBSERVERS: {
      id: "INVITE_OBSERVERS",
      href: "/profile/results?tab=comparison#invitations",
      scope: "self",
    },
    MANAGE_OBSERVER_INVITES: {
      id: "MANAGE_OBSERVER_INVITES",
      href: "/profile/results?tab=comparison#invitations",
      scope: "self",
    },
    CREATE_TEAM: { id: "CREATE_TEAM", href: "/onboarding?intent=team", scope: "team" },
    JOIN_TEAM: { id: "JOIN_TEAM", href: "/join", scope: "team" },
    INVITE_TEAM_MEMBERS: { id: "INVITE_TEAM_MEMBERS", href: teamMembersHref, scope: "team" },
    COMPLETE_TEAM_ASSESSMENTS: {
      id: "COMPLETE_TEAM_ASSESSMENTS",
      href: teamHref,
      scope: "team",
    },
    VIEW_TEAM_INSIGHTS: { id: "VIEW_TEAM_INSIGHTS", href: teamHref, scope: "team" },
    CREATE_ORG_TEAM: { id: "CREATE_ORG_TEAM", href: orgTeamsHref, scope: "org" },
    INVITE_ORG_MEMBERS: { id: "INVITE_ORG_MEMBERS", href: orgMembersHref, scope: "org" },
    LAUNCH_ORG_CAMPAIGN: { id: "LAUNCH_ORG_CAMPAIGN", href: orgCampaignHref, scope: "org" },
    VIEW_ORG_INSIGHTS: { id: "VIEW_ORG_INSIGHTS", href: orgHref, scope: "org" },
  };
}

function computeStage(context: JourneyContextSnapshot): JourneyStage {
  const { self, team, org } = context.completionSummary;
  const hasTeamRelevantContext =
    context.explicitTeamIntent ||
    context.pendingInviteCounts.team > 0 ||
    context.pendingInviteCounts.org > 0 ||
    team.joined ||
    org.joined;

  // Current obligation first: assessment progress always wins over later scopes.
  if (!context.assessment.started) return "SELF_NOT_STARTED";
  if (!context.assessment.completed) return "SELF_IN_PROGRESS";

  if (org.joined) {
    if (org.ready) return "ORG_READY";
    return "ORG_PARTIAL";
  }

  if (team.joined) {
    if (team.memberCount < MIN_MEMBERS_FOR_TEAM_INSIGHTS || team.pendingInviteCount > 0) {
      return "TEAM_PENDING_MEMBERS";
    }
    if (!team.ready) return "TEAM_PARTIAL";
    return "TEAM_READY";
  }

  if (self.pendingInvites > 0) return "OBSERVER_PENDING";
  if (hasTeamRelevantContext) return "TEAM_NOT_JOINED";
  return "SELF_COMPLETED";
}

function computeBlockingReasons(
  stage: JourneyStage,
  context: JourneyContextSnapshot,
): JourneyBlockingReason[] {
  const { self, team, org } = context.completionSummary;
  const reasons: JourneyBlockingReason[] = [];

  if (stage === "SELF_NOT_STARTED") {
    reasons.push({ code: "SELF_ASSESSMENT_MISSING" });
  }
  if (stage === "SELF_IN_PROGRESS") {
    reasons.push({ code: "SELF_ASSESSMENT_INCOMPLETE" });
  }
  if (stage === "OBSERVER_PENDING" && self.pendingInvites > 0) {
    reasons.push({
      code: "OBSERVER_RESPONSES_PENDING",
      detail: `${self.pendingInvites} observer invite(s) are still pending.`,
    });
  }
  if (stage === "TEAM_NOT_JOINED") {
    const pendingMembershipInvites = self.pendingTeamInvites + self.pendingOrgInvites;
    reasons.push({
      code: "TEAM_MEMBERSHIP_MISSING",
      detail:
        pendingMembershipInvites > 0
          ? `${pendingMembershipInvites} membership invite(s) are waiting for acceptance.`
          : self.explicitTeamIntent
            ? "Team workspace is not set up yet."
            : undefined,
    });
  }
  if (stage === "TEAM_PENDING_MEMBERS") {
    if (team.memberCount < MIN_MEMBERS_FOR_TEAM_INSIGHTS) {
      reasons.push({
        code: "MIN_TEAM_SIZE_NOT_MET",
        detail: `Need at least ${MIN_MEMBERS_FOR_TEAM_INSIGHTS} team members.`,
      });
    }
    if (team.pendingInviteCount > 0) {
      reasons.push({
        code: "TEAM_MEMBER_INVITES_PENDING",
        detail: `${team.pendingInviteCount} invite(s) pending.`,
      });
    }
  }
  if (stage === "TEAM_PARTIAL") {
    reasons.push({
      code: "TEAM_MEMBER_ASSESSMENTS_PENDING",
      detail: `${team.completedMemberCount}/${MIN_MEMBERS_FOR_TEAM_INSIGHTS} completed for team insight.`,
    });
  }
  if (stage === "ORG_PARTIAL") {
    if (org.teamCount === 0) {
      reasons.push({ code: "ORG_TEAM_MISSING" });
    }
    if (org.completedMemberCount < MIN_MEMBERS_FOR_ORG_INSIGHTS) {
      reasons.push({
        code: "ORG_MEMBER_ASSESSMENTS_PENDING",
        detail: `${org.completedMemberCount}/${MIN_MEMBERS_FOR_ORG_INSIGHTS} completed for org insight.`,
      });
    }
    if (org.activeCampaignCount === 0) {
      reasons.push({ code: "ORG_CAMPAIGN_MISSING" });
    }
  }

  return reasons;
}

function computeActions(stage: JourneyStage, context: JourneyContextSnapshot): JourneyAction[] {
  const { self, team, org } = context.completionSummary;
  const actionMap = buildActionMap(context);
  const hasPendingMembershipInvite = self.pendingTeamInvites > 0 || self.pendingOrgInvites > 0;
  const hasTeamRelevantContext =
    self.explicitTeamIntent || hasPendingMembershipInvite || team.joined || org.joined;
  const teamBridgeActions: JourneyActionId[] = [];
  if (hasPendingMembershipInvite) {
    teamBridgeActions.push("JOIN_TEAM");
  }
  // Consulting-led módban a self-serve csapat-létrehozás nem elérhető út —
  // a team-irányú terelést az érdeklődés-banner (TeamInterestBanner) végzi.
  if (!isConsultingLed() && (self.explicitTeamIntent || !hasPendingMembershipInvite)) {
    teamBridgeActions.push("CREATE_TEAM");
  }

  const byStage: Record<JourneyStage, JourneyActionId[]> = {
    SELF_NOT_STARTED: ["START_SELF_ASSESSMENT"],
    SELF_IN_PROGRESS: ["CONTINUE_SELF_ASSESSMENT"],
    SELF_COMPLETED: hasTeamRelevantContext
      ? ["INVITE_OBSERVERS", "REVIEW_SELF_RESULTS", ...teamBridgeActions]
      : ["INVITE_OBSERVERS", "REVIEW_SELF_RESULTS"],
    OBSERVER_PENDING: hasTeamRelevantContext
      ? ["MANAGE_OBSERVER_INVITES", "REVIEW_SELF_RESULTS", ...teamBridgeActions]
      : ["MANAGE_OBSERVER_INVITES", "REVIEW_SELF_RESULTS"],
    TEAM_NOT_JOINED: hasTeamRelevantContext
      ? [...teamBridgeActions, "REVIEW_SELF_RESULTS", "INVITE_OBSERVERS"]
      : ["INVITE_OBSERVERS", "REVIEW_SELF_RESULTS"],
    TEAM_PENDING_MEMBERS: ["INVITE_TEAM_MEMBERS", "VIEW_TEAM_INSIGHTS", "REVIEW_SELF_RESULTS"],
    TEAM_PARTIAL: ["COMPLETE_TEAM_ASSESSMENTS", "INVITE_TEAM_MEMBERS", "VIEW_TEAM_INSIGHTS"],
    TEAM_READY: ["VIEW_TEAM_INSIGHTS", "LAUNCH_ORG_CAMPAIGN", "INVITE_TEAM_MEMBERS"],
    ORG_PARTIAL: ["INVITE_ORG_MEMBERS", "CREATE_ORG_TEAM", "LAUNCH_ORG_CAMPAIGN", "VIEW_ORG_INSIGHTS"],
    ORG_READY: ["VIEW_ORG_INSIGHTS", "LAUNCH_ORG_CAMPAIGN", "INVITE_ORG_MEMBERS"],
  };

  const ids = byStage[stage];
  return uniqueActions(ids.map((id) => actionMap[id]));
}

export function computeJourneyState(context: JourneyContextSnapshot): JourneyState {
  const currentStage = computeStage(context);
  const availableNextActions = computeActions(currentStage, context);

  return {
    currentStage,
    recommendedNextAction: availableNextActions[0] ?? null,
    availableNextActions,
    blockingReasons: computeBlockingReasons(currentStage, context),
    completionSummary: context.completionSummary,
  };
}

export async function getJourneyStateForProfileId(
  profileId: string,
  options: JourneyContextOptions = {},
): Promise<JourneyState> {
  const context = await resolveJourneyContext(profileId, options);
  return computeJourneyState(context);
}

export async function getJourneyStateForClerkId(
  clerkId: string,
  options: JourneyContextOptions = {},
): Promise<JourneyState | null> {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!profile) return null;
  return getJourneyStateForProfileId(profile.id, options);
}
