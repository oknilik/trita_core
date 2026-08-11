import "server-only";

import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface RemainingOrganizationMembership {
  orgId: string;
  role: string;
  joinedAt: Date;
}

export interface OrganizationExitProfileState {
  activeOrgId: string | null;
  role: UserRole;
}

/**
 * A profil platform-szerepe legacy/gyorsítótár jellegű mező; a tényleges
 * jogosultságot az aktív OrganizationMember sorok adják. Kilépéskor mégis
 * szinkronban kell tartani, különben a journey továbbra is team-intentnek
 * értelmezi a már self-only felhasználót.
 */
export function resolveOrganizationExitProfileState(params: {
  currentActiveOrgId: string | null;
  remainingMemberships: RemainingOrganizationMembership[];
}): OrganizationExitProfileState {
  const { currentActiveOrgId, remainingMemberships } = params;
  const activeMembership =
    remainingMemberships.find((membership) => membership.orgId === currentActiveOrgId) ??
    remainingMemberships[0] ??
    null;

  const realMemberships = remainingMemberships.filter(
    (membership) => membership.role !== "ORG_CONSULTANT",
  );
  const role = realMemberships.some((membership) => membership.role === "ORG_ADMIN")
    ? UserRole.ORG_ADMIN
    : realMemberships.length > 0
      ? UserRole.ORG_MEMBER
      : UserRole.INDIVIDUAL;

  return { activeOrgId: activeMembership?.orgId ?? null, role };
}

export interface OrganizationMemberExitResult {
  leftAt: Date;
  retainedSelfResult: boolean;
  removedTeamMemberships: number;
  activeOrgId: string | null;
  activeTeamId: string | null;
  role: UserRole;
}

/**
 * Egy felhasználó teljes szervezeti kiléptetése, egyetlen tranzakcióban.
 *
 * A személyes profil és az AssessmentResult sorok szándékosan érintetlenek.
 * A szervezeti tagság soft-exit (`leftAt`), hogy a történeti riportok megőrizzék
 * a kilépés tényét; a jelenlegi csapattagság és az aktív navigációs kontextus
 * viszont azonnal megszűnik.
 */
export async function exitOrganizationMember(params: {
  orgId: string;
  userId: string;
  now?: Date;
}): Promise<OrganizationMemberExitResult | null> {
  const { orgId, userId, now = new Date() } = params;

  return prisma.$transaction(async (tx) => {
    const [membership, profile, remainingMemberships, selfResult] = await Promise.all([
      tx.organizationMember.findFirst({
        where: { orgId, userId, leftAt: null },
        select: { id: true },
      }),
      tx.userProfile.findUnique({
        where: { id: userId },
        select: {
          activeOrgId: true,
          activeTeamId: true,
          activeTeam: { select: { orgId: true } },
        },
      }),
      tx.organizationMember.findMany({
        where: { userId, orgId: { not: orgId }, leftAt: null },
        orderBy: { joinedAt: "desc" },
        select: { orgId: true, role: true, joinedAt: true },
      }),
      tx.assessmentResult.findFirst({
        where: { userProfileId: userId, isSelfAssessment: true },
        select: { id: true },
      }),
    ]);

    if (!membership || !profile) return null;

    const profileState = resolveOrganizationExitProfileState({
      currentActiveOrgId: profile.activeOrgId,
      remainingMemberships,
    });
    const activeTeamBelongsToNextOrg =
      Boolean(profile.activeTeamId) &&
      Boolean(profileState.activeOrgId) &&
      profile.activeTeam?.orgId === profileState.activeOrgId;
    const activeTeamId = activeTeamBelongsToNextOrg ? profile.activeTeamId : null;

    const [, removedTeams] = await Promise.all([
      tx.organizationMember.update({
        where: { id: membership.id },
        data: { leftAt: now },
      }),
      tx.teamMember.deleteMany({
        where: { userId, team: { orgId } },
      }),
    ]);

    await tx.userProfile.update({
      where: { id: userId },
      data: {
        activeOrgId: profileState.activeOrgId,
        activeTeamId,
        role: profileState.role,
      },
    });

    return {
      leftAt: now,
      retainedSelfResult: Boolean(selfResult),
      removedTeamMemberships: removedTeams.count,
      activeOrgId: profileState.activeOrgId,
      activeTeamId,
      role: profileState.role,
    };
  });
}
