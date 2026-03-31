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
import { hasOrgRole } from "@/lib/auth";
import { getOrgSubscription, hasAccess } from "@/lib/subscription";
import { getAccessibleTeamIds } from "@/lib/team-auth";
import { getActiveOrgMembership } from "@/lib/org-context";
import { resolveJourney } from "@/lib/journey/engine";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { getMetadataBase } from "@/lib/seo";
import type { JourneyExperienceHints } from "@/lib/journey/types";
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
  let navData: NavData | null = null;
  let signedInHomeHref: string = JOURNEY_HOME_HANDOFF_PATH;
  let signedInExperienceHints: JourneyExperienceHints | null = null;
  const locale = await getServerLocale();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isNoShell = pathname.startsWith("/founding");

  try {
    const { userId } = await auth();
    if (userId) {
      const profile = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
        select: { id: true, username: true, email: true },
      });
      if (profile) {
        const journey = await resolveJourney(profile.id, { locale });
        signedInHomeHref = journey.home.destination;
        signedInExperienceHints = journey.experienceHints;

        const membership = await getActiveOrgMembership(profile.id);
        if (membership) {
          const isAdmin = hasOrgRole(membership.role, "ORG_ADMIN");
          const isManager = hasOrgRole(membership.role, "ORG_MANAGER");

          const [org, accessibleTeamIds, activeCampaignCount, sub] = await Promise.all([
            prisma.organization.findUnique({
              where: { id: membership.orgId },
              select: { id: true, name: true },
            }),
            getAccessibleTeamIds(profile.id, membership.orgId, membership.role),
            prisma.campaign.count({
              where: { orgId: membership.orgId, status: "ACTIVE" },
            }),
            getOrgSubscription(membership.orgId),
          ]);

          const teams = accessibleTeamIds.length > 0
            ? await prisma.team.findMany({
                where: { id: { in: accessibleTeamIds } },
                select: { id: true, name: true },
                orderBy: { name: "asc" },
              })
            : [];

          const hasHiringAccess = isManager && hasAccess(sub);
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
            isAdmin,
            isManager,
            hasHiringAccess,
          };
        }
      }
    }
  } catch {
    navData = null;
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
              ) : navData ? (
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
