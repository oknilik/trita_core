import type { Metadata } from "next";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { buildPageMetadata, clampMetaDescription } from "@/lib/seo";
import { PrivacyContent } from "./PrivacyContent";

// Statikus metadata a DEFAULT_LOCALE-lal — cookie-olvasás nélkül az oldal
// build-time prerenderelhető; a nyelvváltást a kliens-oldali LocaleProvider
// kezeli. A description forrása a felületen is látszó bevezető bekezdés,
// ezért mondathatáron vágjuk a snippet-hosszra.
export const metadata: Metadata = buildPageMetadata({
  path: "/privacy",
  title: `${t("privacy.title", DEFAULT_LOCALE)} | trita`,
  description: clampMetaDescription(t("privacy.introBody", DEFAULT_LOCALE)),
  type: "article",
});

export default function PrivacyPage() {
  return <PrivacyContent />;
}
