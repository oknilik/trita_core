import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export type { UserRole };

// Hardcoded admin email list - update this to add/remove admins
const ADMIN_EMAILS = [
  "kilinkod@gmail.com", // Replace with actual admin email(s)
];

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    redirect("/dashboard");
  }

  return { user };
}

// Requires the user to have a specific role. Redirects to /dashboard if not.
export async function requireRole(role: UserRole) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    select: { role: true },
  });

  if (!profile || profile.role !== role) {
    redirect("/dashboard");
  }

  return { user, role: profile.role };
}

// Returns the current user's role from DB, or null if not found.
export async function getUserRole(): Promise<UserRole | null> {
  const user = await currentUser();
  if (!user) return null;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    select: { role: true },
  });

  return profile?.role ?? null;
}

// Role hierarchy for org members: ORG_ADMIN > ORG_MANAGER > ORG_MEMBER
const ORG_ROLE_RANK: Record<string, number> = {
  ORG_ADMIN: 3,
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
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    select: { id: true },
  });
  if (!profile) redirect("/dashboard");

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: {
      role: true,
      org: { select: { id: true, name: true, status: true } },
    },
  });

  if (!membership) redirect("/org");
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
  if (!hasOrgRole(ctx.role, minRole)) redirect(`/org/${orgId}`);
  return ctx;
}

// Returns the current user's org membership (null if not in any org).
export async function getUserOrgMembership(profileId: string): Promise<{
  orgId: string;
  role: string;
} | null> {
  return prisma.organizationMember.findUnique({
    where: { userId: profileId },
    select: { orgId: true, role: true },
  });
}

// @deprecated — use requireOrgContext or requireOrgRole instead
export async function requireOrgAccess(
  orgId: string,
  adminOnly = false
): Promise<{ profileId: string; memberRole: string }> {
  if (adminOnly) {
    const ctx = await requireOrgRole(orgId, "ORG_ADMIN");
    return { profileId: ctx.profileId, memberRole: ctx.role };
  }
  const ctx = await requireOrgContext(orgId);
  return { profileId: ctx.profileId, memberRole: ctx.role };
}
