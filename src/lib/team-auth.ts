import { cache } from "react";
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

/**
 * A hívó csapat-szerepe egy csapatban (null = nem tag) — KÉRÉS-SZINTEN
 * memoizálva.
 *
 * Miért: a /team/[id] render háromszor kérdezte ugyanezt (canAccessTeam,
 * canManageTeam, resolveTeamPolicySnapshot). A kulcs (profileId, teamId)
 * párost tartalmaz, tehát felhasználók és csapatok között nem keveredhet;
 * a cache hatóköre egy kérés.
 *
 * A jogosultság-DÖNTÉS továbbra is minden hívónál külön fut le — itt csak a
 * nyers adatlekérés memoizálódik, kapu-logika nem kerül megkerülésre.
 */
export const getTeamMembershipRole = cache(async function getTeamMembershipRole(
  profileId: string,
  teamId: string,
): Promise<string | null> {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: profileId } },
    select: { role: true },
  });
  return membership?.role ?? null;
});

export async function canAccessTeam(
  profileId: string,
  teamId: string,
  orgRole: string
): Promise<boolean> {
  if (hasOrgRole(orgRole, "ORG_ADMIN")) return true;
  return (await getTeamMembershipRole(profileId, teamId)) !== null;
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
  return isTeamManagerRole(await getTeamMembershipRole(profileId, teamId));
}

/**
 * Returns the list of team IDs the user can access.
 * ORG_ADMIN: all teams in org.
 * Others: only their team memberships.
 */
export const getAccessibleTeamIds = cache(async function getAccessibleTeamIds(
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
});

/**
 * Ugyanaz a hozzáférés-szabály, mint a getAccessibleTeamIds-nél, de MINDJÁRT
 * a csapat nevével — EGY lekérdezésben.
 *
 * Miért: a nav-fejléc korábban előbb az id-listát kérte le, majd egy MÁSODIK
 * körben a neveket (`team.findMany({ id: { in: … } })`). Két egymás utáni
 * körfordulás egy helyett, minden belépett oldalon.
 */
export const getAccessibleTeams = cache(async function getAccessibleTeams(
  profileId: string,
  orgId: string,
  orgRole: string,
): Promise<Array<{ id: string; name: string }>> {
  if (hasOrgRole(orgRole, "ORG_ADMIN")) {
    return prisma.team.findMany({
      where: { orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  const memberships = await prisma.teamMember.findMany({
    where: { userId: profileId, team: { orgId } },
    select: { team: { select: { id: true, name: true } } },
    orderBy: { team: { name: "asc" } },
  });
  return memberships.map((m) => m.team);
});

/**
 * Returns the list of team IDs the user can manage (hiring, invites, etc.)
 * ORG_ADMIN / consultant (admin-paritás): all teams in org.
 * Egyébként: azok a csapatok, ahol team-manager a csapat-szerepe —
 * org-szereptől függetlenül (két menedzser-szint modell, 2026-07-22).
 */
export const getManageableTeamIds = cache(async function getManageableTeamIds(
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
});
