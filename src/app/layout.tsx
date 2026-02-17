import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LocaleProvider } from "@/components/LocaleProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { getMetadataBase } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Show fallback font immediately
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Show fallback font immediately
  preload: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = DEFAULT_LOCALE;
  const title = "trita";
  const description = t("meta.description", locale);
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
      siteName: "Trita",
      title,
      description,
      url: "/",
      locale: "hu_HU",
    },
    twitter: {
      card: "summary_large_image",
      title,
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
      apple: [
        { url: "/apple-icon" },
      ],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/onboarding"
        >
          <LocaleProvider>
            <ToastProvider>
              <NavBar />
              {children}
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
