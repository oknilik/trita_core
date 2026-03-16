import { auth } from "@clerk/nextjs/server";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Playfair_Display, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
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
import { getMetadataBase } from "@/lib/seo";
import "./globals.css";

export const dynamic = "force-dynamic";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
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
  const locale = await getServerLocale();

  try {
    const { userId } = await auth();
    if (userId) {
      const profile = await prisma.userProfile.findUnique({
        where: { clerkId: userId },
        select: { id: true, username: true, email: true },
      });
      if (profile) {
        const membership = await prisma.organizationMember.findUnique({
          where: { userId: profile.id },
          select: { role: true, orgId: true },
        });
        if (membership) {
          const [org, teamMember, activeCampaignCount] = await Promise.all([
            prisma.organization.findUnique({
              where: { id: membership.orgId },
              select: { id: true, name: true },
            }),
            prisma.teamMember.findFirst({
              where: { userId: profile.id },
              select: { team: { select: { id: true, name: true } } },
            }),
            prisma.campaign.count({
              where: { orgId: membership.orgId, status: "ACTIVE" },
            }),
          ]);
          const team = teamMember?.team ?? null;
          const isManager = hasOrgRole(membership.role, "ORG_MANAGER");
          navData = {
            user: {
              username: profile.username ?? null,
              email: profile.email ?? null,
            },
            org: org ?? null,
            team: team ?? null,
            role: membership.role,
            activeCampaignCount,
            isManager,
          };
        }
      }
    }
  } catch {
    navData = null;
  }

  const bodyClasses = `${playfair.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`;

  return (
    <html lang={DEFAULT_LOCALE}>
      <body className={bodyClasses}>
        <ClerkProvider
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/onboarding"
        >
          <LocaleProvider initialLocale={locale}>
            <ToastProvider>
              {navData ? (
                <div className="flex min-h-screen flex-col">
                  <NavHeaderUI {...navData} />
                  <main className="mx-auto w-full max-w-5xl px-4 py-8">
                    {children}
                  </main>
                </div>
              ) : (
                <>
                  <NavBar />
                  <div className="pb-16">{children}</div>
                  <Footer />
                </>
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
