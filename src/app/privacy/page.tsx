import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { getLanguageAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const title = `${t("privacy.title", locale)} | trita`;
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
      siteName: "trita",
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
  const legalLabel = locale === "hu" ? "// jogi" : "// legal";
  const tocLabel = locale === "hu" ? "Tartalom" : "Contents";

  const sections = [
    { id: "intro", index: "01", title: "privacy.introTitle", body: "privacy.introBody" },
    {
      id: "data-collected",
      index: "02",
      title: "privacy.dataCollectedTitle",
      items: [
        "privacy.dataAuth",
        "privacy.dataDemographic",
        "privacy.dataAssessment",
        "privacy.dataTechnical",
      ],
    },
    {
      id: "purpose",
      index: "03",
      title: "privacy.purposeTitle",
      items: ["privacy.purposeResearch", "privacy.purposeService"],
    },
    { id: "cookies", index: "04", title: "privacy.cookiesTitle", body: "privacy.cookiesBody" },
    { id: "storage", index: "05", title: "privacy.storageTitle", body: "privacy.storageBody" },
    { id: "analytics", index: "06", title: "privacy.analyticsTitle", body: "privacy.analyticsBody" },
    {
      id: "processors",
      index: "07",
      title: "privacy.processorsTitle",
      items: [
        "privacy.processorsClerk",
        "privacy.processorsNeon",
        "privacy.processorsVercel",
        "privacy.processorsResend",
      ],
    },
    {
      id: "rights",
      index: "08",
      title: "privacy.rightsTitle",
      items: [
        "privacy.rightsAccess",
        "privacy.rightsDeletion",
        "privacy.rightsWithdraw",
      ],
    },
    { id: "contact", index: "09", title: "privacy.contactTitle", body: "privacy.contactBody" },
  ] as const;

  return (
    <main className="min-h-dvh bg-[#faf9f6]">
      <section className="border-b border-[#e8e4dc] bg-[#1a1814] px-6 py-14 lg:px-16 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-ibm-plex-mono mb-4 text-[11px] uppercase tracking-[2px] text-[#c8410a]">
            {legalLabel}
          </p>
          <h1 className="font-playfair text-4xl leading-tight text-[#faf9f6] lg:text-[52px]">
            {t("privacy.title", locale)}
          </h1>
          <p className="font-ibm-plex-mono mt-4 text-[11px] uppercase tracking-[1px] text-[#faf9f6]/55">
            {t("privacy.lastUpdated", locale)}
          </p>
        </div>
      </section>

      <section className="px-6 py-10 lg:px-16 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
          <aside className="h-fit rounded border border-[#e8e4dc] bg-white p-4 lg:sticky lg:top-28">
            <p className="font-ibm-plex-mono mb-3 text-[11px] uppercase tracking-[1px] text-[#5a5650]">
              {tocLabel}
            </p>
            <nav className="space-y-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-baseline gap-2 rounded px-2 py-1.5 transition-colors hover:bg-[#faf5ef]"
                >
                  <span className="font-ibm-plex-mono text-[10px] text-[#c8410a]">
                    {section.index}
                  </span>
                  <span className="text-sm text-[#3d3a35] transition-colors group-hover:text-[#1a1814]">
                    {t(section.title, locale)}
                  </span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-4">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28 rounded border border-[#e8e4dc] bg-white p-5 md:p-7"
              >
                <p className="font-ibm-plex-mono mb-3 text-[11px] uppercase tracking-[1px] text-[#c8410a]">
                  {section.index}
                </p>
                <h2 className="font-playfair mb-3 text-2xl leading-tight text-[#1a1814] md:text-[30px]">
                  {t(section.title, locale)}
                </h2>
                {"body" in section && section.body ? (
                  <p className="text-[15px] leading-[1.75] text-[#3d3a35]">
                    {t(section.body, locale)}
                  </p>
                ) : null}
                {"items" in section && section.items ? (
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="relative pl-5 text-[15px] leading-[1.75] text-[#3d3a35] before:absolute before:left-0 before:top-[0.85em] before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-[#c8410a]"
                      >
                        {t(item, locale)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
