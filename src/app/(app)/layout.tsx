import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { NavHeaderUI } from "@/components/layout/nav-header-ui";
import { prisma } from "@/lib/prisma";
import { getAccessibleTeamIds } from "@/lib/team-auth";
import { getActiveOrgMembership } from "@/lib/org-context";
import { resolveJourney } from "@/lib/journey/engine";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import type { JourneyExperienceHints } from "@/lib/journey/types";
import { resolveOrgPolicySnapshot } from "@/lib/policy-service";
import { getServerAuth } from "@/lib/auth-server";
import { isAdminEmail } from "@/lib/auth";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { resolveWorkspaceNavRole } from "@/lib/navigation/roles";
import { getServerLocale } from "@/lib/i18n-server";
import { HelpWidget } from "@/components/help/HelpWidget";
import type { HelpAudience } from "@/lib/help/topics";

// A bejelentkezett app-felület shellje: auth + journey + org-kontextus
// requestenként — szándékosan dinamikus. A marketing-oldalak a (marketing)
// group statikus shelljét kapják.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  type NavData = React.ComponentProps<typeof NavHeaderUI>;
  const { userId } = await getServerAuth();

  let signedInHomeHref: string = JOURNEY_HOME_HANDOFF_PATH;
  let signedInExperienceHints: JourneyExperienceHints | null = null;
  let navData: NavData | null = userId
    ? {
        user: { username: null, email: null },
        org: null,
        teams: [],
        homeHref: signedInHomeHref,
        role: "SELF",
        activeCampaignCount: 0,
        hasHiringAccess: false,
      }
    : null;
  const locale = await getServerLocale();

  try {
    if (userId) {
      const profile = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
        select: { id: true, username: true, email: true, isConsultant: true },
      });
      if (profile) {
        // Kezdő értesítés-számláló a fejlécnek — a harang így mountkor nem
        // indít API-hívást (indexelt count: @@index([userId, read])).
        const [journey, unreadNotificationCount] = await Promise.all([
          resolveJourney(profile.id, {
            locale,
            entryPoint: "root_layout_nav",
          }),
          prisma.notification.count({
            where: { userId: profile.id, read: false, dismissed: false },
          }),
        ]);
        signedInHomeHref = journey.destination;
        signedInExperienceHints = journey.experienceHints;
        const isPlatformAdmin = isAdminEmail(profile.email);
        navData = {
          ...(navData ?? {
            user: { username: null, email: null },
            org: null,
            teams: [],
            role: "SELF",
            activeCampaignCount: 0,
            hasHiringAccess: false,
          }),
          homeHref: signedInHomeHref,
          isPlatformAdmin,
          unreadNotificationCount,
        };

        const membership = await getActiveOrgMembership(profile.id);
        if (membership) {
          const [org, accessibleTeamIds, activeCampaignCount, policySnapshot] = await Promise.all([
            prisma.organization.findUnique({
              where: { id: membership.orgId },
              select: { id: true, name: true },
            }),
            getAccessibleTeamIds(profile.id, membership.orgId, membership.role),
            prisma.campaign.count({
              where: { orgId: membership.orgId, status: "ACTIVE" },
            }),
            resolveOrgPolicySnapshot({
              orgId: membership.orgId,
              orgRole: membership.role,
            }),
          ]);

          const teams = accessibleTeamIds.length > 0
            ? await prisma.team.findMany({
                where: { id: { in: accessibleTeamIds } },
                select: { id: true, name: true },
                orderBy: { name: "asc" },
              })
            : [];

          // Jelölt-felület (2026-07-23): a tanácsadói kör kapja — nem
          // előfizetés-capability (a gating az operating-mode kapcsolón).
          const hasHiringAccess = isConsultantSurface(
            membership.role,
            profile.email,
            profile.isConsultant,
          );
          navData = {
            user: {
              username: profile.username ?? null,
              email: profile.email ?? null,
            },
            org: org ?? null,
            teams,
            homeHref: signedInHomeHref,
            role: membership.role,
            activeCampaignCount,
            hasHiringAccess,
            isPlatformAdmin,
            unreadNotificationCount,
          };
        }
      }
    }
  } catch {
    // Signed-in users keep the lightweight NavHeader fallback config.
  }

  const NAV_ROLE_TO_HELP_AUDIENCE = {
    org_admin: "admin",
    org_manager: "manager",
    self: "member",
  } as const satisfies Record<string, HelpAudience>;
  const helpAudience: HelpAudience = userId
    ? NAV_ROLE_TO_HELP_AUDIENCE[resolveWorkspaceNavRole(navData?.role ?? "SELF")]
    : "public";

  return (
    <>
      {userId && navData ? (
        <>
          <NavHeaderUI {...navData} />
          <div className="pb-16">{children}</div>
          <Footer />
        </>
      ) : (
        <Suspense>
          <NavBar
            signedInHomeHref={signedInHomeHref}
            initialIsSignedIn={Boolean(userId)}
            signedInExperienceHints={signedInExperienceHints}
          />
          <div className="pb-16">{children}</div>
          <Footer />
        </Suspense>
      )}
      <Suspense>
        <HelpWidget audience={helpAudience} />
      </Suspense>
    </>
  );
}
