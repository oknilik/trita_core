import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { getActiveOrgMembership } from "@/lib/org-context";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";
import { getServerAuth } from "@/lib/auth-server";

export type { UserRole };

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin() {
  const { userId } = await getServerAuth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { email: true },
  });
  const userEmail = profile?.email;
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
    redirect(JOURNEY_HOME_HANDOFF_PATH);
  }

  return { userId };
}

// Requires the user to have a specific role. Redirects to journey home handoff if not.
export async function requireRole(role: UserRole) {
  const { userId } = await getServerAuth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!profile || profile.role !== role) {
    redirect(JOURNEY_HOME_HANDOFF_PATH);
  }

  return { userId, role: profile.role };
}

// Returns the current user's role from DB, or null if not found.
export async function getUserRole(): Promise<UserRole | null> {
  const { userId } = await getServerAuth();
  if (!userId) return null;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  return profile?.role ?? null;
}

// Role hierarchy for org members: ORG_ADMIN > ORG_MANAGER > ORG_MEMBER.
// ORG_CONSULTANT is an externally assigned advisor (trita admin assigns it);
// it carries admin-level visibility but is excluded from last-admin
// safeguards and cannot be granted through the org invite flows.
const ORG_ROLE_RANK: Record<string, number> = {
  ORG_ADMIN: 3,
  ORG_CONSULTANT: 3,
  ORG_MANAGER: 2,
  ORG_MEMBER: 1,
};

export function hasOrgRole(actual: string, minimum: string): boolean {
  return (ORG_ROLE_RANK[actual] ?? 0) >= (ORG_ROLE_RANK[minimum] ?? 999);
}

// Checks if current user is a member of the given org.
// Redirects to /sign-in if unauthenticated, /org if not a member, /org/suspended if org is INACTIVE.
export async function requireOrgContext(orgId: string): Promise<{
  profileId: string;
  role: string;
  org: { id: string; name: string; status: string };
}> {
  const { userId } = await getServerAuth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect(JOURNEY_HOME_HANDOFF_PATH);

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: {
      role: true,
      org: { select: { id: true, name: true, status: true } },
    },
  });

  if (!membership) {
    const fallback = await resolveJourneyFallbackForProfileId(profile.id);
    redirect(fallback);
  }
  if (membership.org.status === "INACTIVE") redirect("/org/suspended");

  return { profileId: profile.id, role: membership.role, org: membership.org };
}

// Checks org membership and requires at least the given role level.
// Redirects to /org/[id] if the user's role is below the minimum.
export async function requireOrgRole(
  orgId: string,
  minRole: "ORG_MEMBER" | "ORG_MANAGER" | "ORG_ADMIN"
): Promise<{
  profileId: string;
  role: string;
  org: { id: string; name: string; status: string };
}> {
  const ctx = await requireOrgContext(orgId);
  if (!hasOrgRole(ctx.role, minRole)) {
    const fallback = await resolveJourneyFallbackForProfileId(ctx.profileId);
    redirect(fallback);
  }
  return ctx;
}

// Returns the current user's org membership (null if not in any org).
export async function getUserOrgMembership(profileId: string): Promise<{
  orgId: string;
  role: string;
} | null> {
  const membership = await getActiveOrgMembership(profileId);
  if (!membership) return null;
  return { orgId: membership.orgId, role: membership.role };
}
