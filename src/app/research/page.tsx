import type { Metadata } from "next";
import Link from "next/link";
import { TritaLogo } from "@/components/TritaLogo";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { getLanguageAlternates, getSiteUrl } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const title = t("meta.researchTitle", locale);
  const description = t("research.subtitle", locale);
  return {
    title,
    description,
    alternates: {
      canonical: "/research",
      languages: getLanguageAlternates("/research"),
    },
    openGraph: {
      title,
      description,
      url: "/research",
      type: "article",
      siteName: "Trita",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ResearchPage() {
  const locale = await getServerLocale();
  const siteUrl = getSiteUrl();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t("research.title", locale),
    description: t("research.subtitle", locale),
    inLanguage: locale,
    url: `${siteUrl}/research`,
    author: {
      "@type": "Organization",
      name: "Trita",
    },
  };

  const sections = [
    { title: "research.introTitle", body: "research.introBody" },
    { title: "research.designTitle", body: "research.designBody" },
    { title: "research.flowTitle", items: "research.flowItems" },
    { title: "research.instrumentsTitle", items: "research.instrumentsItems" },
    { title: "research.dataTitle", items: "research.dataItems" },
    { title: "research.contactTitle", body: "research.contactBody" },
  ] as const;

  const splitItems = (key: string) =>
    t(key, locale).split("|").map((item) => item.trim()).filter(Boolean);

  return (
    <div className="relative min-h-dvh bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/3 bg-gradient-to-b from-transparent to-white" aria-hidden="true" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/">
            <TritaLogo size={56} showText={false} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("research.title", locale)}
          </h1>
          <p className="text-sm text-gray-500">
            {t("research.subtitle", locale)}
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
                    {splitItems(section.items).map((item) => (
                      <li key={item}>{item}</li>
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
