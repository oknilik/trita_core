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
import { getMetadataBase } from "@/lib/seo";
import "./globals.css";

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
    title: {
      default: title,
      template: "%s",
    },
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: "trita",
      title: ogTitle,
      description,
      url: "/",
      locale: "hu_HU",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body className={`${playfair.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`}>
        <ClerkProvider
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/onboarding"
        >
          <LocaleProvider>
            <ToastProvider>
              <NavBar />
              <div className="pb-16">{children}</div>
              <Footer />
            </ToastProvider>
          </LocaleProvider>
        </ClerkProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
