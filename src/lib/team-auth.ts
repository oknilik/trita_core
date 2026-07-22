import { prisma } from "./prisma";
// A rangsor EGYETLEN forrása az org-roles.ts (függőség-mentes modul, nem
// húz be redirect-kötött auth-helpereket) — a korábbi lokális duplikátum
// egyszer már elcsúszott és bugot okozott.
import { hasOrgRole, isTeamManagerRole } from "./org-roles";

/**
 * Determines whether a user can access a specific team.
 *
 * Rules:
 * - ORG_ADMIN → always can access any team in their org
 * - ORG_MANAGER → can access teams where they are a TeamMember (any role)
 * - ORG_MEMBER → can access teams where they are a TeamMember (any role)
 */
/**
 * Raw (individual/pairwise) team results are consultant-only.
 * Everyone else sees progress during collection and the published,
 * aggregated report after consultant validation (see
 * docs/product/team-report-gating-plan.md).
 */
export function canViewRawTeamResults(orgRole: string | null | undefined): boolean {
  return orgRole === "ORG_CONSULTANT";
}

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
 * Determines whether a user can manage a team (add/remove members, set team
 * roles, see the team's manager report, etc.)
 *
 * Két menedzser-szint (modell-döntés, 2026-07-22):
 * - ORG_ADMIN / ORG_CONSULTANT (admin-paritás) → mindig
 * - egyébként KIZÁRÓLAG a csapat-szerep dönt: team-manager a saját
 *   csapatában, org-szereptől függetlenül — egy ORG_MEMBER is lehet
 *   team-manager az egyik csapatban, miközben a másikban sima tag.
 */
export async function canManageTeam(
  profileId: string,
  teamId: string,
  orgRole: string
): Promise<boolean> {
  if (hasOrgRole(orgRole, "ORG_ADMIN")) return true;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: profileId } },
    select: { role: true },
  });

  return isTeamManagerRole(membership?.role);
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
 * ORG_ADMIN / consultant (admin-paritás): all teams in org.
 * Egyébként: azok a csapatok, ahol team-manager a csapat-szerepe —
 * org-szereptől függetlenül (két menedzser-szint modell, 2026-07-22).
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
