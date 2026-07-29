import "server-only";

import { InvitationStatus, UserRole } from "@prisma/client";
import { getActiveOrgMembership } from "@/lib/org-context";
import { isConsultingLed } from "@/lib/operating-mode";
import { prisma } from "@/lib/prisma";
import { getOrgSubscription, getSubscriptionState } from "@/lib/subscription";
import { JOURNEY_TEAM_INTENT_FEATURE_KEY } from "@/lib/journey/intent";
import type {
  ActiveSurface,
  JourneyCompletionSummary,
  JourneyContextSnapshot,
  JourneyCurrentContext,
  JourneyEntryIntent,
  JourneyOrgMembershipSnapshot,
  JourneyPendingJoinInviteSnapshot,
  JourneyTeamMembershipSnapshot,
} from "@/lib/journey/types";

const MIN_MEMBERS_FOR_TEAM_INSIGHTS = 3;
const MIN_MEMBERS_FOR_ORG_INSIGHTS = 3;
export interface ResolveJourneyContextOptions {
  teamId?: string | null;
  orgId?: string | null;
  entryIntent?: JourneyEntryIntent | null;
  now?: Date;
}

function createEmptyCompletionSummary(): JourneyCompletionSummary {
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

export function deriveJourneyCurrentContext(orgRole: string | null): JourneyCurrentContext {
  if (orgRole === "ORG_ADMIN" || orgRole === "ORG_CONSULTANT") return "org-admin";
  if (orgRole === "ORG_MANAGER") return "org-manager";
  if (orgRole === "ORG_MEMBER") return "org-member";
  return "self-only";
}

export function deriveJourneyEntryIntent(
  overrideIntent: JourneyEntryIntent | null | undefined,
  explicitTeamIntent: boolean,
): JourneyEntryIntent {
  if (overrideIntent) return overrideIntent;
  return explicitTeamIntent ? "team" : "explore";
}

export function deriveJourneyActiveSurface(params: {
  hasPendingJoinInvite: boolean;
  currentContext: JourneyCurrentContext;
  teamMembership: JourneyTeamMembershipSnapshot | null;
  assessmentStarted: boolean;
  assessmentCompleted: boolean;
}): ActiveSurface {
  if (params.hasPendingJoinInvite) return "continuation";
  if (params.assessmentStarted && !params.assessmentCompleted) return "continuation";
  if (params.currentContext === "org-admin" || params.currentContext === "org-manager") {
    return "org";
  }
  if (params.teamMembership) return "team";
  return "personal";
}

function pickPendingJoinInvite(
  teamInvite: JourneyPendingJoinInviteSnapshot | null,
  orgInvite: JourneyPendingJoinInviteSnapshot | null,
): JourneyPendingJoinInviteSnapshot | null {
  if (!teamInvite) return orgInvite;
  if (!orgInvite) return teamInvite;
  return teamInvite.createdAt >= orgInvite.createdAt ? teamInvite : orgInvite;
}

export async function resolveJourneyContext(
  profileId: string,
  options: ResolveJourneyContextOptions = {},
): Promise<JourneyContextSnapshot> {
  const now = options.now ?? new Date();

  const [profile, selfResult, draft, sentInvites, pendingInvites, completedObservers, orgMembership, teamIntentFlag, anyOrgMembershipCount] =
    await Promise.all([
      prisma.userProfile.findUnique({
        where: { id: profileId },
        select: { id: true, assessmentSkippedAt: true, email: true, role: true },
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
        ? prisma.organizationMember.findFirst({
            where: { orgId: options.orgId, userId: profileId, leftAt: null },
            select: { orgId: true, role: true, joinedAt: true },
          })
        : getActiveOrgMembership(profileId),
      prisma.feedback.findUnique({
        where: {
          userProfileId_kind_targetKey: {
            userProfileId: profileId,
            kind: "feature_interest",
            targetKey: JOURNEY_TEAM_INTENT_FEATURE_KEY,
          },
        },
        select: { userProfileId: true },
      }),
      // BÁRMELY aktív org-tagság (nem csak az options.orgId szerinti) — az
      // orgGoverned flaghez: consulting-led módban az org-tag observer-útja
      // kampány-vezérelt. A tanácsadói tagság nem számít (ő self-serve).
      prisma.organizationMember.count({
        where: { userId: profileId, leftAt: null, role: { not: "ORG_CONSULTANT" } },
      }),
    ]);

  const explicitTeamIntent =
    Boolean(teamIntentFlag) || (profile ? profile.role !== UserRole.INDIVIDUAL : false);
  const entryIntent = deriveJourneyEntryIntent(options.entryIntent, explicitTeamIntent);

  if (!profile) {
    const completionSummary = createEmptyCompletionSummary();
    return {
      profileId,
      entryIntent,
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
      subscription: {
        state: "none",
        orgId: null,
        status: "none",
        hasAccess: false,
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
      completionSummary,
    };
  }

  let pendingTeamInvites = 0;
  let pendingOrgInvites = 0;
  let pendingTeamInvite: JourneyPendingJoinInviteSnapshot | null = null;
  let pendingOrgInvite: JourneyPendingJoinInviteSnapshot | null = null;

  if (profile.email?.trim()) {
    const normalizedEmail = profile.email.trim();
    // FONTOS: a már-tagsághoz tartozó függő meghívó NEM számít pending
    // join-nak — különben a journey örökre a /join oldalra irányít, a
    // join-oldal pedig (already accepted) vissza a journey-hoz: redirect-
    // hurok. A lógva maradt sort az acceptance-réteg takarítja el.
    const notAlreadyTeamMember = {
      team: { is: { members: { none: { userId: profile.id } } } },
    };
    const notAlreadyOrgMember = {
      org: { is: { members: { none: { userId: profile.id, leftAt: null } } } },
    };
    [pendingTeamInvites, pendingOrgInvites, pendingTeamInvite, pendingOrgInvite] = await Promise.all([
      prisma.teamPendingInvite.count({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" },
          ...notAlreadyTeamMember,
        },
      }),
      prisma.organizationPendingInvite.count({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" },
          ...notAlreadyOrgMember,
        },
      }),
      prisma.teamPendingInvite
        .findFirst({
          where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
            ...notAlreadyTeamMember,
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            token: true,
            email: true,
            teamId: true,
            createdAt: true,
            team: { select: { orgId: true } },
          },
        })
        .then<JourneyPendingJoinInviteSnapshot | null>((invite) =>
          invite
            ? {
                kind: "team",
                inviteId: invite.id,
                token: invite.token,
                email: invite.email,
                teamId: invite.teamId,
                orgId: invite.team.orgId,
                role: null,
                createdAt: invite.createdAt,
              }
            : null,
        ),
      prisma.organizationPendingInvite
        .findFirst({
          where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
            ...notAlreadyOrgMember,
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            token: true,
            email: true,
            orgId: true,
            role: true,
            createdAt: true,
          },
        })
        .then<JourneyPendingJoinInviteSnapshot | null>((invite) =>
          invite
            ? {
                kind: "org",
                inviteId: invite.id,
                token: invite.token,
                email: invite.email,
                teamId: null,
                orgId: invite.orgId,
                role: invite.role,
                createdAt: invite.createdAt,
              }
            : null,
        ),
    ]);
  }

  const teamMembership = options.teamId
    ? await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: options.teamId, userId: profileId } },
        select: {
          teamId: true,
          role: true,
          joinedAt: true,
          team: { select: { orgId: true } },
        },
      })
    : await (async () => {
        // Kijelölt (aktív) csapat elsőbbsége — a Vezérlő és a journey a
        // csapat-váltóban választott csapatra épül; fallback a legrégebbi
        // tagság (determinisztikus, ha nincs vagy érvénytelen a kijelölés).
        const scope = orgMembership?.orgId
          ? { userId: profileId, team: { orgId: orgMembership.orgId } }
          : { userId: profileId };
        const select = {
          teamId: true,
          role: true,
          joinedAt: true,
          team: { select: { orgId: true } },
        } as const;
        const profileRow = await prisma.userProfile.findUnique({
          where: { id: profileId },
          select: { activeTeamId: true },
        });
        if (profileRow?.activeTeamId) {
          const active = await prisma.teamMember.findFirst({
            where: { ...scope, teamId: profileRow.activeTeamId },
            select,
          });
          if (active) return active;
        }
        return prisma.teamMember.findFirst({
          where: scope,
          orderBy: { joinedAt: "asc" },
          select,
        });
      })();

  const normalizedTeamMembership: JourneyTeamMembershipSnapshot | null = teamMembership
    ? {
        teamId: teamMembership.teamId,
        role: teamMembership.role,
        joinedAt: teamMembership.joinedAt,
        orgId: teamMembership.team.orgId,
      }
    : null;

  const normalizedOrgMembership: JourneyOrgMembershipSnapshot | null = orgMembership
    ? {
        orgId: orgMembership.orgId,
        role: orgMembership.role,
        joinedAt: orgMembership.joinedAt,
      }
    : null;

  const teamId = normalizedTeamMembership?.teamId ?? null;
  const orgId = normalizedOrgMembership?.orgId ?? null;

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

  const hasResult = Boolean(selfResult);
  const hasDraft = Boolean(draft);
  const skipped = Boolean(profile.assessmentSkippedAt);
  const assessmentStarted = Boolean(hasResult || hasDraft);
  const assessmentCompleted = Boolean(hasResult || skipped);

  const completionSummary: JourneyCompletionSummary = {
    self: {
      started: assessmentStarted,
      completed: assessmentCompleted,
      skipped,
      hasDraft,
      sentInvites,
      pendingInvites,
      completedObservers,
      pendingTeamInvites,
      pendingOrgInvites,
      explicitTeamIntent,
      orgGoverned: isConsultingLed() && anyOrgMembershipCount > 0,
    },
    team: teamSummary,
    org: orgSummary,
  };

  const subscriptionRecord = orgId ? await getOrgSubscription(orgId) : null;
  const subscriptionState = getSubscriptionState(subscriptionRecord, now);
  const subscriptionHasAccess = subscriptionState === "active";

  const pendingJoinInvite = pickPendingJoinInvite(pendingTeamInvite, pendingOrgInvite);
  const currentContext = deriveJourneyCurrentContext(normalizedOrgMembership?.role ?? null);
  const activeSurface = deriveJourneyActiveSurface({
    hasPendingJoinInvite: Boolean(pendingJoinInvite),
    currentContext,
    teamMembership: normalizedTeamMembership,
    assessmentStarted,
    assessmentCompleted,
  });

  return {
    profileId,
    entryIntent,
    currentContext,
    activeSurface,
    teamId,
    orgId,
    hasPendingJoinInvite: Boolean(pendingJoinInvite),
    explicitTeamIntent,
    assessment: {
      started: assessmentStarted,
      completed: assessmentCompleted,
      skipped,
      hasDraft,
      hasResult,
    },
    orgMembership: normalizedOrgMembership,
    teamMembership: normalizedTeamMembership,
    pendingJoinInvite,
    pendingInviteCounts: {
      team: pendingTeamInvites,
      org: pendingOrgInvites,
    },
    subscription: {
      state: subscriptionState,
      orgId,
      status: subscriptionRecord?.status ?? "none",
      hasAccess: subscriptionHasAccess,
      trialEndsAt: subscriptionRecord?.trialEndsAt ?? null,
      currentPeriodEnd: subscriptionRecord?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscriptionRecord?.cancelAtPeriodEnd ?? false,
    },
    completionSummary,
  };
}
