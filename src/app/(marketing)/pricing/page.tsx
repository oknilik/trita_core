import type { Metadata } from "next";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import { PricingContent } from "./PricingContent";

// Statikus metadata a DEFAULT_LOCALE-lal — cookie-olvasás nélkül az oldal
// build-time prerenderelhető; a tartalom nyelvváltását a kliens-oldali
// LocaleProvider kezeli.
export const metadata: Metadata = buildPageMetadata({
  path: "/pricing",
  title: t("pricing.metaTitle", DEFAULT_LOCALE),
  description: t("pricing.metaDescription", DEFAULT_LOCALE),
});

export default function PricingPage() {
  return <PricingContent />;
}
