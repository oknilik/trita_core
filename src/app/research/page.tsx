import type { Metadata } from "next";
import Link from "next/link";
import { TritaLogo } from "@/components/TritaLogo";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return { title: t("meta.researchTitle", locale) };
}

export default async function ResearchPage() {
  const locale = await getServerLocale();

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
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
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
