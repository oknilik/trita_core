import type { Metadata } from "next";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import { ContactContent } from "./ContactContent";

// Statikus metadata a DEFAULT_LOCALE-lal — cookie-olvasás nélkül az oldal
// build-time prerenderelhető; a nyelvváltást a kliens-oldali LocaleProvider
// kezeli. Az index/follow a gyökér layoutból öröklődik.
export const metadata: Metadata = buildPageMetadata({
  path: "/contact",
  title: t("contact.metaTitle", DEFAULT_LOCALE),
  description: t("contact.metaDescription", DEFAULT_LOCALE),
});

export default function ContactPage() {
  return <ContactContent />;
}
