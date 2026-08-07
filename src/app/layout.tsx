import type { Metadata } from "next";
import { Fraunces, DM_Sans, DM_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LocaleProvider } from "@/components/LocaleProvider";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { getMetadataBase } from "@/lib/seo";
import "./globals.css";

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

// Valódi mono a „// szekció" dev-esztétikához — a --font-mono eddig a
// DM Sans-ra volt aliasolva, így a font-mono osztály nem monóval
// renderelt (tipográfiai audit #1).
const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

// Statikus metadata a DEFAULT_LOCALE-lal — a root layout nem olvashat
// cookie-t/headert, különben az egész app dinamikusra kényszerül. A
// lokalizált metadata oldal-szinten felülírható.
export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: { default: "trita", template: "%s" },
  description: t("meta.description", DEFAULT_LOCALE),
  // Canonical NINCS itt: a root layoutból minden aloldal örökölné a "/"-t,
  // amitől a kereső duplikátumnak látná őket — oldal-szinten kell megadni.
  openGraph: {
    type: "website",
    siteName: "trita",
    title: t("landing.heroTitle", DEFAULT_LOCALE),
    description: t("meta.description", DEFAULT_LOCALE),
    url: "/",
    // A marketing-fa minden lapja EGY URL-en szolgálja ki a HU és az EN
    // tartalmat (LocaleProvider) — a második nyelvet OG-oldalon az
    // alternateLocale közli; hreflang-párt ezért nem képzünk (ld. seo.ts).
    locale: "hu_HU",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: t("landing.heroTitle", DEFAULT_LOCALE),
    description: t("meta.description", DEFAULT_LOCALE),
  },
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <head>
        {/* Színséma a festés ELŐTT — enélkül minden oldalbetöltésnél
            felvillanna a világos téma. Szerver-oldalon szándékosan NEM
            olvasunk sütit: az az egész marketing-fát dinamikussá tenné.
            A marketing-oldalakon nincs hatása (nincs ott .theme-scope). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={`${fraunces.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}
      >
        {/* ClerkProvider NEM itt van: a marketing-fa (landing/blog/…) így nem
            szállít clerk-js bundle-t. A Clerk a (app) és (auth) zóna
            layoutjában él; a publikus nav auth-állapotát a nav-context adja. */}
        <ThemeProvider>
          <LocaleProvider>
            <ToastProvider>{children}</ToastProvider>
          </LocaleProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
