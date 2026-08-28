import type { Metadata } from "next";
import { DEFAULT_LOCALE, t } from "@/lib/i18n";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";
import { buildWebPageJsonLd } from "@/lib/structured-data";
import { PilotContent } from "./PilotContent";

// Statikus metadata a DEFAULT_LOCALE-lal — a tartalom nyelvváltását a
// kliens-oldali LocaleProvider kezeli (PilotContent), a fej-elemeket a
// LocalizedPageMeta szinkronizálja ugyanezekből a kulcsokból.
export const metadata: Metadata = buildPageMetadata({
  path: "/pilot",
  title: t("pilot.metaTitle", DEFAULT_LOCALE),
  description: t("pilot.metaDescription", DEFAULT_LOCALE),
  ogTitle: "Pilotprogram – az első partnercsapatainknak",
  ogDescription:
    "90 napos, személyesen kísért csapatprogram az első partnercsapatoknak.",
});

export default function PilotPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageJsonLd({
          path: "/pilot",
          title: "Pilotprogram – az első partnercsapatainknak",
          description:
            "90 nap teljes hozzáférés, személyes bevezetés és kiemelt figyelem az első partnercsapatoknak, egyedi feltételekkel.",
          about: ["Csapatdiagnosztika", "Pilotprogram"],
          breadcrumb: [
            { name: "Főoldal", path: "/" },
            { name: "Pilotprogram", path: "/pilot" },
          ],
        })}
      />
      <PilotContent />
    </>
  );
}
