import type { Metadata } from "next";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildBreadcrumbJsonLd, buildContactPageJsonLd } from "@/lib/structured-data";
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
  return (
    <>
      <JsonLd
        data={[
          buildContactPageJsonLd({
            path: "/contact",
            title: t("contact.metaTitle", DEFAULT_LOCALE),
            description: t("contact.metaDescription", DEFAULT_LOCALE),
          }),
          buildBreadcrumbJsonLd([
            { name: "Főoldal", path: "/" },
            { name: "Kapcsolat", path: "/contact" },
          ]),
        ]}
      />
      <ContactContent />
    </>
  );
}
