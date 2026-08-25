import type { Metadata } from "next";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { buildPageMetadata, clampMetaDescription } from "@/lib/seo";
import { getPrivacyPolicy } from "@/lib/legal/privacy-policy";
import { PrivacyContent } from "./PrivacyContent";

// Statikus metadata a DEFAULT_LOCALE-lal — cookie-olvasás nélkül az oldal
// build-time prerenderelhető; a nyelvváltást a kliens-oldali LocaleProvider
// kezeli. A cím és a leírás a tájékoztató DOKUMENTUMÁBÓL jön (nem külön
// SEO-szövegből), így nem tud elcsúszni attól, ami a lapon látszik; a
// bevezetőt mondathatáron vágjuk a snippet-hosszra.
const doc = getPrivacyPolicy(DEFAULT_LOCALE);

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: "/privacy",
    title: `${doc.title} | trita`,
    description: clampMetaDescription(doc.lead),
    type: "article",
  }),
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
