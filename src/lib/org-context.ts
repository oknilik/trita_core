import "server-only";

import { prisma } from "@/lib/prisma";

export interface ActiveOrgMembership {
  orgId: string;
  role: string;
  joinedAt: Date;
}

type ColumnExistsRow = { exists: boolean };
let activeOrgIdColumnState: "unknown" | "present" | "absent" = "unknown";

function isActiveOrgFieldCompatibilityError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const maybePrismaError = error as Error & { code?: string };
  return (
    // Client schema expects `activeOrgId`, but runtime DB may not have the column yet.
    ((error.name === "PrismaClientValidationError" &&
      error.message.includes("activeOrgId")) ||
      (error.name === "PrismaClientKnownRequestError" &&
        maybePrismaError.code === "P2022" &&
        error.message.includes("activeOrgId")))
  );
}

async function hasActiveOrgIdColumn(): Promise<boolean> {
  if (activeOrgIdColumnState === "present") return true;
  if (activeOrgIdColumnState === "absent") return false;

  const rows = await prisma.$queryRaw<ColumnExistsRow[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'UserProfile'
        AND column_name = 'activeOrgId'
    ) AS "exists"
  `;

  const exists = rows[0]?.exists === true;
  activeOrgIdColumnState = exists ? "present" : "absent";
  return exists;
}

async function readProfileActiveOrgId(
  profileId: string,
): Promise<{ exists: boolean; activeOrgId: string | null }> {
  if (!(await hasActiveOrgIdColumn())) {
    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
      select: { id: true },
    });
    return { exists: Boolean(profile), activeOrgId: null };
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: profileId },
      select: { activeOrgId: true },
    });
    return { exists: Boolean(profile), activeOrgId: profile?.activeOrgId ?? null };
  } catch (error) {
    if (!isActiveOrgFieldCompatibilityError(error)) throw error;
    activeOrgIdColumnState = "absent";

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
  if (!(await hasActiveOrgIdColumn())) return;

  try {
    await prisma.userProfile.update({
      where: { id: profileId },
      data: { activeOrgId: orgId },
    });
  } catch (error) {
    if (!isActiveOrgFieldCompatibilityError(error)) throw error;
    activeOrgIdColumnState = "absent";
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
