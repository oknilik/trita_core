import { prisma } from "./prisma";
import { hasOrgRole } from "./auth";

/**
 * Determines whether a user can access a specific team.
 *
 * Rules:
 * - ORG_ADMIN → always can access any team in their org
 * - ORG_MANAGER → can access teams where they are a TeamMember (any role)
 * - ORG_MEMBER → can access teams where they are a TeamMember (any role)
 */
export async function canAccessTeam(
  profileId: string,
  teamId: string,
  orgRole: string
): Promise<boolean> {
  if (hasOrgRole(orgRole, "ORG_ADMIN")) return true;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: profileId } },
    select: { role: true },
  });

  return !!membership;
}

/**
 * Determines whether a user can manage a team (add/remove members, invite candidates, etc.)
 *
 * Rules:
 * - ORG_ADMIN → always
 * - ORG_MANAGER → only if they are a TeamMember with role "manager" or "admin" in this team
 * - ORG_MEMBER → never
 */
export async function canManageTeam(
  profileId: string,
  teamId: string,
  orgRole: string
): Promise<boolean> {
  if (hasOrgRole(orgRole, "ORG_ADMIN")) return true;

  if (orgRole !== "ORG_MANAGER") return false;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: profileId } },
    select: { role: true },
  });

  return membership?.role === "manager" || membership?.role === "admin";
}

/**
 * Returns the list of team IDs the user can access.
 * ORG_ADMIN: all teams in org.
 * Others: only their team memberships.
 */
export async function getAccessibleTeamIds(
  profileId: string,
  orgId: string,
  orgRole: string
): Promise<string[]> {
  if (hasOrgRole(orgRole, "ORG_ADMIN")) {
    const teams = await prisma.team.findMany({
      where: { orgId },
      select: { id: true },
    });
    return teams.map((t) => t.id);
  }

  const memberships = await prisma.teamMember.findMany({
    where: { userId: profileId, team: { orgId } },
    select: { teamId: true },
  });
  return memberships.map((m) => m.teamId);
}

/**
 * Returns the list of team IDs the user can manage (hiring, invites, etc.)
 * ORG_ADMIN: all teams in org.
 * ORG_MANAGER: teams where they have "manager" or "admin" role.
 * Others: none.
 */
export async function getManageableTeamIds(
  profileId: string,
  orgId: string,
  orgRole: string
): Promise<string[]> {
  if (hasOrgRole(orgRole, "ORG_ADMIN")) {
    const teams = await prisma.team.findMany({
      where: { orgId },
      select: { id: true },
    });
    return teams.map((t) => t.id);
  }

  if (orgRole !== "ORG_MANAGER") return [];

  const memberships = await prisma.teamMember.findMany({
    where: {
      userId: profileId,
      team: { orgId },
      role: { in: ["manager", "admin"] },
    },
    select: { teamId: true },
  });
  return memberships.map((m) => m.teamId);
}
