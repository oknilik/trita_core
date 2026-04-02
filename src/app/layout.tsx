import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LocaleProvider } from "@/components/LocaleProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { NavHeaderUI } from "@/components/layout/nav-header-ui";
import { prisma } from "@/lib/prisma";
import { getAccessibleTeamIds } from "@/lib/team-auth";
import { getActiveOrgMembership } from "@/lib/org-context";
import { resolveJourney } from "@/lib/journey/engine";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { getMetadataBase } from "@/lib/seo";
import type { JourneyExperienceHints } from "@/lib/journey/types";
import { resolveOrgPolicySnapshot } from "@/lib/policy-service";
import "./globals.css";

export const dynamic = "force-dynamic";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  weight: "variable",
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  weight: "variable",
  style: ["normal", "italic"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const title = "trita";
  const description = t("meta.description", locale);
  const ogTitle = t("landing.heroTitle", locale);
  return {
    metadataBase: getMetadataBase(),
    title: { default: title, template: "%s" },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: "trita",
      title: ogTitle,
      description,
      url: "/",
      locale: "hu_HU",
    },
    twitter: { card: "summary_large_image", title: ogTitle, description },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: "/icon", type: "image/png" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      shortcut: ["/favicon.svg"],
      apple: [{ url: "/apple-icon" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  type NavData = React.ComponentProps<typeof NavHeaderUI>;
  const { userId } = await auth();

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
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isNoShell = pathname.startsWith("/founding");

  try {
    if (userId) {
      const profile = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
        select: { id: true, username: true, email: true },
      });
      if (profile) {
        const journey = await resolveJourney(profile.id, {
          locale,
          entryPoint: "root_layout_nav",
        });
        signedInHomeHref = journey.destination;
        signedInExperienceHints = journey.experienceHints;
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

          const hasHiringAccess = policySnapshot.policy.capabilities.has("candidateEvaluate");
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
          };
        }
      }
    }
  } catch {
    // Signed-in users keep the lightweight NavHeader fallback config.
  }

  const bodyClasses = `${fraunces.variable} ${dmSans.variable} antialiased`;

  return (
    <html lang={DEFAULT_LOCALE}>
      <body className={bodyClasses}>
        <ClerkProvider
          signInFallbackRedirectUrl={JOURNEY_HOME_HANDOFF_PATH}
          signUpFallbackRedirectUrl="/onboarding"
        >
          <LocaleProvider initialLocale={locale}>
            <ToastProvider>
              {isNoShell ? (
                <Suspense>
                  <NavBar
                    signedInHomeHref={signedInHomeHref}
                    signedInExperienceHints={signedInExperienceHints}
                  />
                  <div className="pb-16">{children}</div>
                  <Footer />
                </Suspense>
              ) : userId && navData ? (
                <>
                  <NavHeaderUI {...navData} />
                  <div className="pb-16">{children}</div>
                  <Footer />
                </>
              ) : (
                <Suspense>
                  <NavBar
                    signedInHomeHref={signedInHomeHref}
                    signedInExperienceHints={signedInExperienceHints}
                  />
                  <div className="pb-16">{children}</div>
                  <Footer />
                </Suspense>
              )}
            </ToastProvider>
          </LocaleProvider>
        </ClerkProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
