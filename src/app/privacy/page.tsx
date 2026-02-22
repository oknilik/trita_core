import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { TritaLogo } from "@/components/TritaLogo";
import Link from "next/link";
import { getLanguageAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const title = `${t("privacy.title", locale)} | Trita`;
  const description = t("privacy.introBody", locale);
  return {
    title,
    description,
    alternates: {
      canonical: "/privacy",
      languages: getLanguageAlternates("/privacy"),
    },
    openGraph: {
      title,
      description,
      url: "/privacy",
      type: "article",
      siteName: "Trita",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PrivacyPage() {
  const locale = await getServerLocale();

  const sections = [
    { title: "privacy.introTitle", body: "privacy.introBody" },
    {
      title: "privacy.dataCollectedTitle",
      items: [
        "privacy.dataAuth",
        "privacy.dataDemographic",
        "privacy.dataAssessment",
        "privacy.dataTechnical",
      ],
    },
    {
      title: "privacy.purposeTitle",
      items: ["privacy.purposeResearch", "privacy.purposeService"],
    },
    { title: "privacy.cookiesTitle", body: "privacy.cookiesBody" },
    { title: "privacy.storageTitle", body: "privacy.storageBody" },
    { title: "privacy.analyticsTitle", body: "privacy.analyticsBody" },
    {
      title: "privacy.processorsTitle",
      items: [
        "privacy.processorsClerk",
        "privacy.processorsNeon",
        "privacy.processorsVercel",
        "privacy.processorsResend",
      ],
    },
    {
      title: "privacy.rightsTitle",
      items: [
        "privacy.rightsAccess",
        "privacy.rightsDeletion",
        "privacy.rightsWithdraw",
      ],
    },
    { title: "privacy.contactTitle", body: "privacy.contactBody" },
  ] as const;

  return (
    <div className="relative min-h-dvh bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/3 bg-gradient-to-b from-transparent to-white" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/">
            <TritaLogo size={56} showText={false} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("privacy.title", locale)}
          </h1>
          <p className="text-sm text-gray-500">
            {t("privacy.lastUpdated", locale)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
          <div className="flex flex-col gap-6">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="mb-2 text-lg font-semibold text-gray-900">
                  {t(section.title, locale)}
                </h2>
                {"body" in section && section.body && (
                  <p className="text-sm leading-relaxed text-gray-600">
                    {t(section.body, locale)}
                  </p>
                )}
                {"items" in section && section.items && (
                  <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-gray-600">
                    {section.items.map((item) => (
                      <li key={item}>{t(item, locale)}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
