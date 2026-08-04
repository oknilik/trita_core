import type { Metadata } from "next";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { ContactContent } from "./ContactContent";

// Statikus metadata a DEFAULT_LOCALE-lal — cookie-olvasás nélkül az oldal
// build-time prerenderelhető; a nyelvváltást a kliens-oldali LocaleProvider
// kezeli.
export const metadata: Metadata = {
  title: t("contact.metaTitle", DEFAULT_LOCALE),
  description: t("contact.metaDescription", DEFAULT_LOCALE),
  alternates: { canonical: "/contact" },
  openGraph: {
    title: t("contact.metaTitle", DEFAULT_LOCALE),
    description: t("contact.metaDescription", DEFAULT_LOCALE),
    url: "/contact",
    type: "website",
    siteName: "trita",
  },
  twitter: {
    card: "summary_large_image",
    title: t("contact.metaTitle", DEFAULT_LOCALE),
    description: t("contact.metaDescription", DEFAULT_LOCALE),
  },
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return <ContactContent />;
}
