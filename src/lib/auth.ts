import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { getActiveOrgMembership } from "@/lib/org-context";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";
import { getServerAuth } from "@/lib/auth-server";
import { getProfileCoreByClerkId } from "@/lib/profile.server";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";

export type { UserRole };

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Platform-admin email-e? (ADMIN_EMAILS env alapján) */
export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

/** A platform-admin emailek listája (pl. admin-értesítések címzettjeihez). */
export function getAdminEmails(): string[] {
  return ADMIN_EMAILS;
}

export async function requireAdmin() {
  const { userId } = await getServerAuth();
  if (!userId) return redirectToSignIn();

  // Közös, kérés-szinten memoizált profil-lekérő (ld. profile.server.ts) —
  // a kapu-logika változatlan, csak a lekérés esik össze a többi hívóéval.
  const profile = await getProfileCoreByClerkId(userId);
  const userEmail = profile?.email;
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
    redirect(JOURNEY_HOME_HANDOFF_PATH);
  }

  return { userId };
}

// Requires the user to have a specific role. Redirects to journey home handoff if not.
export async function requireRole(role: UserRole) {
  const { userId } = await getServerAuth();
  if (!userId) return redirectToSignIn();

  const profile = await getProfileCoreByClerkId(userId);

  if (!profile || profile.role !== role) {
    redirect(JOURNEY_HOME_HANDOFF_PATH);
  }

  return { userId, role: profile.role };
}

// Returns the current user's role from DB, or null if not found.
export async function getUserRole(): Promise<UserRole | null> {
  const { userId } = await getServerAuth();
  if (!userId) return null;

  const profile = await getProfileCoreByClerkId(userId);

  return profile?.role ?? null;
}

// Role hierarchy for org members: ORG_ADMIN > ORG_MANAGER > ORG_MEMBER.
// ORG_CONSULTANT is an externally assigned advisor (trita admin assigns it);
// it carries admin-level visibility but is excluded from last-admin
// safeguards and cannot be granted through the org invite flows.
// A rangsor EGYETLEN forrása az org-roles.ts — innen csak re-exportáljuk.
import { hasOrgRole } from "@/lib/org-roles";
export { hasOrgRole, ORG_ROLE_RANK } from "@/lib/org-roles";

// Checks if current user is a member of the given org.
// Redirects to /sign-in if unauthenticated, /org if not a member, /org/suspended if org is INACTIVE.
export async function requireOrgContext(orgId: string): Promise<{
  profileId: string;
  role: string;
  org: { id: string; name: string; status: string };
}> {
  const { userId } = await getServerAuth();
  if (!userId) return redirectToSignIn();

  const profile = await getProfileCoreByClerkId(userId);
  if (!profile) redirect(JOURNEY_HOME_HANDOFF_PATH);

  const membershipRow = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: {
      role: true,
      leftAt: true,
      org: { select: { id: true, name: true, status: true } },
    },
  });

  // Kilépett tag nem kap org-kontextust (motor-audit v9): a testvér-lekérdezések
  // (org-context, module-visibility, journey) mind `leftAt: null`-t szűrnek — itt
  // a findUnique összetett kulcsa miatt a szűrés a lekérdezés UTÁN történik.
  const membership = membershipRow?.leftAt ? null : membershipRow;

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
