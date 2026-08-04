import type { Metadata } from "next";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { PricingContent } from "./PricingContent";

// Statikus metadata a DEFAULT_LOCALE-lal — cookie-olvasás nélkül az oldal
// build-time prerenderelhető; a tartalom nyelvváltását a kliens-oldali
// LocaleProvider kezeli.
export const metadata: Metadata = {
  title: t("pricing.metaTitle", DEFAULT_LOCALE),
  description: t("pricing.metaDescription", DEFAULT_LOCALE),
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: t("pricing.metaTitle", DEFAULT_LOCALE),
    description: t("pricing.metaDescription", DEFAULT_LOCALE),
    url: "/pricing",
    type: "website",
    siteName: "trita",
  },
  twitter: {
    card: "summary_large_image",
    title: t("pricing.metaTitle", DEFAULT_LOCALE),
    description: t("pricing.metaDescription", DEFAULT_LOCALE),
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
