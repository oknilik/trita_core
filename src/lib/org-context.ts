import "server-only";

import { prisma } from "@/lib/prisma";

export interface ActiveOrgMembership {
  orgId: string;
  role: string;
  joinedAt: Date;
}

function isActiveOrgFieldCompatibilityError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "PrismaClientValidationError" &&
    error.message.includes("activeOrgId")
  );
}

async function readProfileActiveOrgId(
  profileId: string,
): Promise<{ exists: boolean; activeOrgId: string | null }> {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
      select: { activeOrgId: true },
    });
    return { exists: Boolean(profile), activeOrgId: profile?.activeOrgId ?? null };
  } catch (error) {
    if (!isActiveOrgFieldCompatibilityError(error)) throw error;

    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
      select: { id: true },
    });
    return { exists: Boolean(profile), activeOrgId: null };
  }
}

export async function setProfileActiveOrgId(
  profileId: string,
  orgId: string | null,
): Promise<void> {
  try {
    await prisma.userProfile.update({
      where: { id: profileId },
      data: { activeOrgId: orgId },
    });
  } catch (error) {
    if (!isActiveOrgFieldCompatibilityError(error)) throw error;
  }
}

export async function listActiveOrgMemberships(profileId: string): Promise<ActiveOrgMembership[]> {
  return prisma.organizationMember.findMany({
    where: { userId: profileId, leftAt: null },
    orderBy: { joinedAt: "desc" },
    select: { orgId: true, role: true, joinedAt: true },
  });
}

export async function getActiveOrgMembership(profileId: string): Promise<ActiveOrgMembership | null> {
  const { exists, activeOrgId } = await readProfileActiveOrgId(profileId);
  if (!exists) return null;

  if (activeOrgId) {
    const explicitMembership = await prisma.organizationMember.findFirst({
      where: { userId: profileId, orgId: activeOrgId, leftAt: null },
      select: { orgId: true, role: true, joinedAt: true },
    });
    if (explicitMembership) return explicitMembership;
  }

  const fallbackMembership = await prisma.organizationMember.findFirst({
    where: { userId: profileId, leftAt: null },
    orderBy: { joinedAt: "desc" },
    select: { orgId: true, role: true, joinedAt: true },
  });

  if (fallbackMembership && activeOrgId !== fallbackMembership.orgId) {
    await setProfileActiveOrgId(profileId, fallbackMembership.orgId);
  } else if (!fallbackMembership && activeOrgId) {
    await setProfileActiveOrgId(profileId, null);
  }

  return fallbackMembership;
}

export async function setActiveOrgContext(
  profileId: string,
  orgId: string,
): Promise<ActiveOrgMembership | null> {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: profileId, orgId, leftAt: null },
    select: { orgId: true, role: true, joinedAt: true },
  });
  if (!membership) return null;

  await setProfileActiveOrgId(profileId, orgId);

  return membership;
}
