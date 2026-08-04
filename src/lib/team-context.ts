import "server-only";

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────
// Aktív (kijelölt) csapat — az org-kontextus mintája csapat-szinten.
// A sima tag Vezérlője a KIJELÖLT csapat oldalára visz; a csapat-váltó
// (hero + nav-dropdown) ezt a mezőt állítja. Ha nincs kijelölés vagy a
// kijelölt csapat már nem elérhető, a legrégebbi tagság a fallback —
// így a viselkedés determinisztikus marad.
// ─────────────────────────────────────────────────────────────────────

export interface ActiveTeamMembership {
  teamId: string;
  teamName: string;
  orgId: string | null;
  role: string;
}

/** A user csapat-tagságai (aktív org-ra szűrve, ha van megadva). */
export async function listTeamMemberships(
  profileId: string,
  orgId?: string | null,
): Promise<ActiveTeamMembership[]> {
  const memberships = await prisma.teamMember.findMany({
    where: {
      userId: profileId,
      ...(orgId ? { team: { orgId } } : {}),
    },
    orderBy: { joinedAt: "asc" },
    select: {
      role: true,
      team: { select: { id: true, name: true, orgId: true } },
    },
  });
  return memberships.map((m) => ({
    teamId: m.team.id,
    teamName: m.team.name,
    orgId: m.team.orgId,
    role: m.role,
  }));
}

/**
 * A kijelölt csapat — validálva a tényleges tagsággal. Nincs kijelölés
 * (vagy már nem tag): a legrégebbi tagság. Egyik sincs: null.
 */
export async function getActiveTeamMembership(
  profileId: string,
  orgId?: string | null,
): Promise<ActiveTeamMembership | null> {
  const [profile, memberships] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: profileId },
      select: { activeTeamId: true },
    }),
    listTeamMemberships(profileId, orgId),
  ]);
  if (memberships.length === 0) return null;
  const selected = profile?.activeTeamId
    ? memberships.find((m) => m.teamId === profile.activeTeamId)
    : null;
  return selected ?? memberships[0];
}

/** Aktív csapat beállítása — csak olyan csapatra, aminek a user tagja. */
export async function setActiveTeamContext(
  profileId: string,
  teamId: string,
): Promise<ActiveTeamMembership | null> {
  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: profileId } },
    select: {
      role: true,
      team: { select: { id: true, name: true, orgId: true } },
    },
  });
  if (!membership) return null;

  await prisma.userProfile.update({
    where: { id: profileId },
    data: { activeTeamId: teamId },
  });
  return {
    teamId: membership.team.id,
    teamName: membership.team.name,
    orgId: membership.team.orgId,
    role: membership.role,
  };
}
