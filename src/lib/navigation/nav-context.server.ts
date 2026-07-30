import "server-only";

import type { NavHeaderUI } from "@/components/layout/nav-header-ui";
import { prisma } from "@/lib/prisma";
import { getOrgActiveCampaignCount } from "@/lib/org-counts.server";
import { getProfileCoreByClerkId } from "@/lib/profile.server";
import { getAccessibleTeams } from "@/lib/team-auth";
import { getActiveOrgMembership } from "@/lib/org-context";
import { resolveJourney } from "@/lib/journey/engine";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import type { JourneyExperienceHints } from "@/lib/journey/types";
import { isAdminEmail } from "@/lib/auth";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { resolveWorkspaceNavRole } from "@/lib/navigation/roles";
import { getCampaignSteps, isStepGateOpen } from "@/lib/campaign-steps-core";
import type { HelpAudience } from "@/lib/help/topics";
import type { Locale } from "@/lib/i18n";

export type NavData = React.ComponentProps<typeof NavHeaderUI>;

export interface WorkspaceNavContext {
  navData: NavData | null;
  signedInHomeHref: string;
  signedInExperienceHints: JourneyExperienceHints | null;
  helpAudience: HelpAudience;
}

const NAV_ROLE_TO_HELP_AUDIENCE = {
  org_admin: "admin",
  org_manager: "manager",
  self: "member",
} as const satisfies Record<string, HelpAudience>;

/**
 * A belépett munkaterület-fejléc (NavHeaderUI) teljes adatcsomagja: auth +
 * journey + org-kontextus. Egy helyen, hogy a (app) layout ÉS a marketing
 * zóna belépett fejléce (/api/nav/context) UGYANAZT a headert kapja —
 * a felhasználó a nem védett oldalakon (blog stb.) is a megszokott app-
 * fejlécet lássa.
 */
export async function resolveWorkspaceNavContext(
  userId: string | null,
  locale: Locale,
): Promise<WorkspaceNavContext> {
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

  try {
    if (userId) {
      const profile = await getProfileCoreByClerkId(userId);
      if (profile) {
        // Az org-tagságot ELŐRE feloldjuk, hogy az org-függő fejléc-adatok a
        // journey-vel PÁRHUZAMOSAN tölthessenek. Korábban a journey teljes
        // lefutása UTÁN indultak — két-három felesleges körfordulás-hullám
        // minden belépett oldalon. A hívás memoizált, és a journey úgyis
        // ugyanezt kéri, tehát nem jelent plusz lekérdezést.
        const membership = await getActiveOrgMembership(profile.id);

        // Kezdő értesítés-számláló a fejlécnek — a harang így mountkor nem
        // indít API-hívást (indexelt count: @@index([userId, read])).
        const [
          journey,
          unreadNotificationCount,
          taskParticipations,
          feedbackRequestCount,
          orgBits,
        ] = await Promise.all([
            resolveJourney(profile.id, {
              locale,
              entryPoint: "root_layout_nav",
            }),
            prisma.notification.count({
              where: { userId: profile.id, read: false, dismissed: false },
            }),
            // „Feladataim" badge: nyitott (nem ütemezett) kampány-lépések…
            prisma.campaignParticipant.findMany({
              where: { userId: profile.id, campaign: { status: "ACTIVE" } },
              select: {
                currentStep: true,
                nextStepOpensAt: true,
                campaign: { select: { type: true, steps: true } },
              },
            }),
            // …plusz a rám váró (belsős/külsős) visszajelzés-kérések.
            prisma.observerInvitation.count({
              where: {
                observerProfileId: profile.id,
                status: "PENDING",
                expiresAt: { gt: new Date() },
              },
            }),
            // Org-függő fejléc-adatok — ugyanabban a hullámban.
            membership
              ? Promise.all([
                  prisma.organization.findUnique({
                    where: { id: membership.orgId },
                    select: { id: true, name: true },
                  }),
                  // Csapatok NÉVVEL, egy körben (ld. getAccessibleTeams).
                  getAccessibleTeams(profile.id, membership.orgId, membership.role),
                  // Közös, memoizált számláló — a journey completionSummary
                  // ugyanezt kéri, így egyszer megy ki.
                  getOrgActiveCampaignCount(membership.orgId),
                ])
              : null,
          ]);
        const openStepCount = taskParticipations.filter(
          (p) =>
            p.currentStep < getCampaignSteps(p.campaign).length && isStepGateOpen(p),
        ).length;
        const openTaskCount = openStepCount + feedbackRequestCount;
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
          openTaskCount,
        };

        if (membership && orgBits) {
          const [org, teams, activeCampaignCount] = orgBits;

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
            openTaskCount,
          };
        }
      }
    }
  } catch {
    // Signed-in users keep the lightweight NavHeader fallback config.
  }

  const helpAudience: HelpAudience = userId
    ? NAV_ROLE_TO_HELP_AUDIENCE[resolveWorkspaceNavRole(navData?.role ?? "SELF")]
    : "public";

  return { navData, signedInHomeHref, signedInExperienceHints, helpAudience };
}
