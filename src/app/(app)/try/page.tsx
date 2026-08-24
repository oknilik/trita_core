import { auth } from "@clerk/nextjs/server";
import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { AssessmentClient } from "@/app/(app)/assessment/AssessmentClient";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildAssessmentAppJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/structured-data";

// SEO 2. kör: a /try a sitemapben 0.9 prioritással szerepel (lead magnet) —
// az addigi robots:{index:false} ezzel ellentmondott; feloldás az indexelés
// irányába, teljes metadatával. A tartalom nyelve a szerver-locale-t követi.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("meta.tryTitle", locale),
    description: t("meta.tryDescription", locale),
    alternates: { canonical: "/try" },
    // EXPLICIT index: az (app) layout alapból `noindex`-et ad az egész
    // bejelentkezés mögötti zónának — a /try az EGYETLEN publikus, indexelendő
    // lap ebben a fában (lead magnet, a sitemapben 0.9 prioritással). A
    // metadata-mezők szegmensenként felülíródnak, így ez pontosan a layout
    // robots-értékét váltja ki.
    robots: { index: true, follow: true },
    openGraph: {
      title: t("meta.tryTitle", locale),
      description: t("meta.tryDescription", locale),
      url: "/try",
      type: "website",
      siteName: "trita",
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.tryTitle", locale),
      description: t("meta.tryDescription", locale),
    },
  };
}

export default async function TryPage() {
  // If already logged in, use the normal assessment flow
  const { userId } = await auth();
  if (userId) redirect(JOURNEY_HOME_HANDOFF_PATH);

  const locale = await getServerLocale();
  const config = getTestConfig("TRITAN", locale, DEFAULT_ASSESSMENT_FORM);
  const questions = config.questions.map((q) => ({ id: q.id, text: q.text }));

  // Az „ingyenes személyiségteszt magyarul" típusú keresésekre (és az ilyen
  // kérdésre adott AI-válaszokra) a döntő tények: ingyenes, regisztráció
  // nélkül indul, hány kérdés, mennyi idő, mit mér. Ezeket a WebApplication
  // séma mondja ki gépi formában — a `price: 0` itt IGAZ állítás.
  return (
    <>
      <JsonLd
        data={[
          buildAssessmentAppJsonLd({
            name: "trita személyiségteszt (TSFI)",
            description:
              "Ingyenes online személyiségteszt magyarul: 60 kérdés, kb. 10 perc, azonnali visszajelzés hat személyiségdimenzió mentén. Regisztráció nélkül indítható.",
            path: "/try",
            featureList: [
              "60 kérdéses rövid forma (TSFI-S)",
              "Kitöltés kb. 10 perc",
              "Regisztráció nélkül indítható",
              "Hat személyiségdimenzió: Becsületesség-Alázat, Emocionalitás, Extraverzió, Barátságosság, Lelkiismeretesség, Nyitottság",
              "Azonnali, dimenziószintű visszajelzés",
              "Szabadon felhasználható, kutatásban használt kérdésbank (IPIP)",
            ],
          }),
          buildBreadcrumbJsonLd([
            { name: "Főoldal", path: "/" },
            { name: "Ingyenes személyiségteszt", path: "/try" },
          ]),
        ]}
      />
      <AssessmentClient
        testType="TRITAN"
        testName={config.name}
        totalQuestions={config.questions.length}
        questions={questions}
        guestMode
      />
    </>
  );
}
