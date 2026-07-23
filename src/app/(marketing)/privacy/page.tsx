import type { Metadata } from "next";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { PrivacyContent } from "./PrivacyContent";

// Statikus metadata a DEFAULT_LOCALE-lal — cookie-olvasás nélkül az oldal
// build-time prerenderelhető; a nyelvváltást a kliens-oldali LocaleProvider
// kezeli.
export const metadata: Metadata = {
  title: `${t("privacy.title", DEFAULT_LOCALE)} | trita`,
  description: t("privacy.introBody", DEFAULT_LOCALE),
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `${t("privacy.title", DEFAULT_LOCALE)} | trita`,
    description: t("privacy.introBody", DEFAULT_LOCALE),
    url: "/privacy",
    type: "article",
    siteName: "trita",
  },
  twitter: {
    card: "summary_large_image",
    title: `${t("privacy.title", DEFAULT_LOCALE)} | trita`,
    description: t("privacy.introBody", DEFAULT_LOCALE),
  },
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
