import { auth } from "@clerk/nextjs/server";
import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTestConfig } from "@/lib/questions";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { AssessmentClient } from "@/app/(app)/assessment/AssessmentClient";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

// SEO 2. kör: a /try a sitemapben 0.9 prioritással szerepel (lead magnet) —
// az addigi robots:{index:false} ezzel ellentmondott; feloldás az indexelés
// irányába, teljes metadatával. A tartalom nyelve a szerver-locale-t követi.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("meta.tryTitle", locale),
    description: t("meta.tryDescription", locale),
    alternates: { canonical: "/try" },
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

  return (
    <AssessmentClient
      testType="TRITAN"
      testName={config.name}
      totalQuestions={config.questions.length}
      questions={questions}
      guestMode
    />
  );
}
