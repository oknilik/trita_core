import "server-only";

import { InvitationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";

const MIN_MEMBERS_FOR_TEAM_INSIGHTS = 3;
const MIN_MEMBERS_FOR_ORG_INSIGHTS = 3;

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

interface JourneyContextOptions {
  teamId?: string | null;
  orgId?: string | null;
}

interface JourneyComputationContext {
  self: JourneyCompletionSummary["self"];
  team: JourneyCompletionSummary["team"];
  org: JourneyCompletionSummary["org"];
}

function uniqueActions(actions: JourneyAction[]): JourneyAction[] {
  const seen = new Set<JourneyActionId>();
  return actions.filter((action) => {
    if (seen.has(action.id)) return false;
    seen.add(action.id);
    return true;
  });
}

function buildActionMap(ctx: JourneyComputationContext): Record<JourneyActionId, JourneyAction> {
  const teamHref = ctx.team.teamId ? `/team/${ctx.team.teamId}` : "/team";
  const teamMembersHref = ctx.team.teamId ? `/team/${ctx.team.teamId}?tab=members` : "/team";
  const orgHref = ctx.org.orgId ? `/org/${ctx.org.orgId}` : "/org";
  const orgTeamsHref = ctx.org.orgId ? `/org/${ctx.org.orgId}?tab=teams` : "/org";
  const orgMembersHref = ctx.org.orgId ? `/org/${ctx.org.orgId}?tab=members` : "/org";
  const orgCampaignHref = ctx.org.orgId ? `/org/${ctx.org.orgId}/campaigns/new` : "/org";

  return {
    START_SELF_ASSESSMENT: { id: "START_SELF_ASSESSMENT", href: "/assessment", scope: "self" },
    CONTINUE_SELF_ASSESSMENT: { id: "CONTINUE_SELF_ASSESSMENT", href: "/assessment", scope: "self" },
    REVIEW_SELF_RESULTS: { id: "REVIEW_SELF_RESULTS", href: "/profile/results", scope: "self" },
    INVITE_OBSERVERS: {
      id: "INVITE_OBSERVERS",
      href: "/profile/results?tab=invites",
      scope: "self",
    },
    MANAGE_OBSERVER_INVITES: {
      id: "MANAGE_OBSERVER_INVITES",
      href: "/profile/results?tab=invites",
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

function computeStage(ctx: JourneyComputationContext): JourneyStage {
  if (!ctx.self.started) return "SELF_NOT_STARTED";
  if (!ctx.self.completed) return "SELF_IN_PROGRESS";

  if (ctx.org.joined) {
    if (ctx.org.ready) return "ORG_READY";
    return "ORG_PARTIAL";
  }

  if (ctx.team.joined) {
    if (ctx.team.memberCount < MIN_MEMBERS_FOR_TEAM_INSIGHTS || ctx.team.pendingInviteCount > 0) {
      return "TEAM_PENDING_MEMBERS";
    }
    if (!ctx.team.ready) return "TEAM_PARTIAL";
    return "TEAM_READY";
  }

  if (ctx.self.pendingInvites > 0) return "OBSERVER_PENDING";
  if (ctx.self.sentInvites > 0 || ctx.self.completedObservers > 0) return "TEAM_NOT_JOINED";
  return "SELF_COMPLETED";
}

function computeBlockingReasons(
  stage: JourneyStage,
  ctx: JourneyComputationContext,
): JourneyBlockingReason[] {
  const reasons: JourneyBlockingReason[] = [];

  if (stage === "SELF_NOT_STARTED") {
    reasons.push({ code: "SELF_ASSESSMENT_MISSING" });
  }
  if (stage === "SELF_IN_PROGRESS") {
    reasons.push({ code: "SELF_ASSESSMENT_INCOMPLETE" });
  }
  if (stage === "OBSERVER_PENDING" && ctx.self.pendingInvites > 0) {
    reasons.push({
      code: "OBSERVER_RESPONSES_PENDING",
      detail: `${ctx.self.pendingInvites} observer invite(s) are still pending.`,
    });
  }
  if (stage === "TEAM_NOT_JOINED") {
    reasons.push({ code: "TEAM_MEMBERSHIP_MISSING" });
  }
  if (stage === "TEAM_PENDING_MEMBERS") {
    if (ctx.team.memberCount < MIN_MEMBERS_FOR_TEAM_INSIGHTS) {
      reasons.push({
        code: "MIN_TEAM_SIZE_NOT_MET",
        detail: `Need at least ${MIN_MEMBERS_FOR_TEAM_INSIGHTS} team members.`,
      });
    }
    if (ctx.team.pendingInviteCount > 0) {
      reasons.push({
        code: "TEAM_MEMBER_INVITES_PENDING",
        detail: `${ctx.team.pendingInviteCount} invite(s) pending.`,
      });
    }
  }
  if (stage === "TEAM_PARTIAL") {
    reasons.push({
      code: "TEAM_MEMBER_ASSESSMENTS_PENDING",
      detail: `${ctx.team.completedMemberCount}/${MIN_MEMBERS_FOR_TEAM_INSIGHTS} completed for team insight.`,
    });
  }
  if (stage === "ORG_PARTIAL") {
    if (ctx.org.teamCount === 0) {
      reasons.push({ code: "ORG_TEAM_MISSING" });
    }
    if (ctx.org.completedMemberCount < MIN_MEMBERS_FOR_ORG_INSIGHTS) {
      reasons.push({
        code: "ORG_MEMBER_ASSESSMENTS_PENDING",
        detail: `${ctx.org.completedMemberCount}/${MIN_MEMBERS_FOR_ORG_INSIGHTS} completed for org insight.`,
      });
    }
    if (ctx.org.activeCampaignCount === 0) {
      reasons.push({ code: "ORG_CAMPAIGN_MISSING" });
    }
  }

  return reasons;
}

function computeActions(stage: JourneyStage, ctx: JourneyComputationContext): JourneyAction[] {
  const actionMap = buildActionMap(ctx);

  const byStage: Record<JourneyStage, JourneyActionId[]> = {
    SELF_NOT_STARTED: ["START_SELF_ASSESSMENT"],
    SELF_IN_PROGRESS: ["CONTINUE_SELF_ASSESSMENT"],
    SELF_COMPLETED: ["INVITE_OBSERVERS", "CREATE_TEAM", "REVIEW_SELF_RESULTS"],
    OBSERVER_PENDING: ["MANAGE_OBSERVER_INVITES", "CREATE_TEAM", "REVIEW_SELF_RESULTS"],
    TEAM_NOT_JOINED: ["CREATE_TEAM", "JOIN_TEAM", "REVIEW_SELF_RESULTS"],
    TEAM_PENDING_MEMBERS: ["INVITE_TEAM_MEMBERS", "VIEW_TEAM_INSIGHTS", "REVIEW_SELF_RESULTS"],
    TEAM_PARTIAL: ["COMPLETE_TEAM_ASSESSMENTS", "INVITE_TEAM_MEMBERS", "VIEW_TEAM_INSIGHTS"],
    TEAM_READY: ["VIEW_TEAM_INSIGHTS", "LAUNCH_ORG_CAMPAIGN", "INVITE_TEAM_MEMBERS"],
    ORG_PARTIAL: ["INVITE_ORG_MEMBERS", "CREATE_ORG_TEAM", "LAUNCH_ORG_CAMPAIGN", "VIEW_ORG_INSIGHTS"],
    ORG_READY: ["VIEW_ORG_INSIGHTS", "LAUNCH_ORG_CAMPAIGN", "INVITE_ORG_MEMBERS"],
  };

  const ids = byStage[stage];
  return uniqueActions(ids.map((id) => actionMap[id]));
}

function computeJourneyStateFromContext(ctx: JourneyComputationContext): JourneyState {
  const currentStage = computeStage(ctx);
  const availableNextActions = computeActions(currentStage, ctx);

  return {
    currentStage,
    recommendedNextAction: availableNextActions[0] ?? null,
    availableNextActions,
    blockingReasons: computeBlockingReasons(currentStage, ctx),
    completionSummary: {
      self: ctx.self,
      team: ctx.team,
      org: ctx.org,
    },
  };
}

async function buildJourneyContext(
  profileId: string,
  options: JourneyContextOptions = {},
): Promise<JourneyComputationContext> {
  const now = new Date();

  const [profile, selfResult, draft, sentInvites, pendingInvites, completedObservers, orgMembership] =
    await Promise.all([
      prisma.userProfile.findUnique({
        where: { id: profileId },
        select: { id: true, assessmentSkippedAt: true },
      }),
      prisma.assessmentResult.findFirst({
        where: { userProfileId: profileId, isSelfAssessment: true },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.assessmentDraft.findUnique({
        where: { userProfileId: profileId },
        select: { id: true },
      }),
      prisma.observerInvitation.count({
        where: { inviterId: profileId },
      }),
      prisma.observerInvitation.count({
        where: {
          inviterId: profileId,
          status: InvitationStatus.PENDING,
          expiresAt: { gt: now },
        },
      }),
      prisma.observerAssessment.count({
        where: {
          invitation: {
            inviterId: profileId,
            status: InvitationStatus.COMPLETED,
          },
        },
      }),
      options.orgId
        ? prisma.organizationMember.findUnique({
            where: { orgId_userId: { orgId: options.orgId, userId: profileId } },
            select: { orgId: true },
          })
        : getActiveOrgMembership(profileId),
    ]);

  if (!profile) {
    return {
      self: {
        started: false,
        completed: false,
        skipped: false,
        hasDraft: false,
        sentInvites: 0,
        pendingInvites: 0,
        completedObservers: 0,
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

  const teamMembership = options.teamId
    ? await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: options.teamId, userId: profileId } },
        select: { teamId: true },
      })
    : await prisma.teamMember.findFirst({
        where: orgMembership?.orgId
          ? {
              userId: profileId,
              team: { orgId: orgMembership.orgId },
            }
          : { userId: profileId },
        orderBy: { joinedAt: "asc" },
        select: { teamId: true },
      });

  const teamId = teamMembership?.teamId ?? null;
  const orgId = orgMembership?.orgId ?? null;

  let teamSummary: JourneyCompletionSummary["team"] = {
    joined: false,
    teamId: null,
    memberCount: 0,
    completedMemberCount: 0,
    pendingInviteCount: 0,
    ready: false,
  };

  if (teamId) {
    const [teamMemberRows, pendingInviteCount] = await Promise.all([
      prisma.teamMember.findMany({
        where: { teamId },
        select: { userId: true },
      }),
      prisma.teamPendingInvite.count({ where: { teamId } }),
    ]);

    const memberUserIds = teamMemberRows.map((row) => row.userId);
    const teamCompletedRows =
      memberUserIds.length > 0
        ? await prisma.assessmentResult.findMany({
            where: {
              userProfileId: { in: memberUserIds },
              isSelfAssessment: true,
            },
            select: { userProfileId: true },
            distinct: ["userProfileId"],
          })
        : [];

    const completedMemberCount = teamCompletedRows.length;

    teamSummary = {
      joined: true,
      teamId,
      memberCount: memberUserIds.length,
      completedMemberCount,
      pendingInviteCount,
      ready: completedMemberCount >= MIN_MEMBERS_FOR_TEAM_INSIGHTS,
    };
  }

  let orgSummary: JourneyCompletionSummary["org"] = {
    joined: false,
    orgId: null,
    teamCount: 0,
    memberCount: 0,
    completedMemberCount: 0,
    pendingInviteCount: 0,
    activeCampaignCount: 0,
    ready: false,
  };

  if (orgId) {
    const [orgMemberRows, teamCount, pendingInviteCount, activeCampaignCount] = await Promise.all([
      prisma.organizationMember.findMany({
        where: { orgId, leftAt: null },
        select: { userId: true },
      }),
      prisma.team.count({ where: { orgId } }),
      prisma.organizationPendingInvite.count({ where: { orgId } }),
      prisma.campaign.count({ where: { orgId, status: "ACTIVE" } }),
    ]);

    const orgMemberUserIds = orgMemberRows.map((row) => row.userId);
    const orgCompletedRows =
      orgMemberUserIds.length > 0
        ? await prisma.assessmentResult.findMany({
            where: {
              userProfileId: { in: orgMemberUserIds },
              isSelfAssessment: true,
            },
            select: { userProfileId: true },
            distinct: ["userProfileId"],
          })
        : [];

    const completedMemberCount = orgCompletedRows.length;

    orgSummary = {
      joined: true,
      orgId,
      teamCount,
      memberCount: orgMemberUserIds.length,
      completedMemberCount,
      pendingInviteCount,
      activeCampaignCount,
      ready:
        teamCount > 0 &&
        completedMemberCount >= MIN_MEMBERS_FOR_ORG_INSIGHTS &&
        activeCampaignCount > 0,
    };
  }

  return {
    self: {
      started: Boolean(selfResult || draft),
      completed: Boolean(selfResult || profile.assessmentSkippedAt),
      skipped: Boolean(profile.assessmentSkippedAt),
      hasDraft: Boolean(draft),
      sentInvites,
      pendingInvites,
      completedObservers,
    },
    team: teamSummary,
    org: orgSummary,
  };
}

export async function getJourneyStateForProfileId(
  profileId: string,
  options: JourneyContextOptions = {},
): Promise<JourneyState> {
  const context = await buildJourneyContext(profileId, options);
  return computeJourneyStateFromContext(context);
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
