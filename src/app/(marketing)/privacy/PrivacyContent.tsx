"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

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
  // TR360-LEGAL: csapatszintű visszajelzések (csapatszerep-peer, bizalmi kör,
  // pszichológiai biztonság pulzus) adatkezelése.
  {
    id: "team-feedback",
    index: "04",
    title: "privacy.teamFeedbackTitle",
    items: [
      "privacy.teamFeedbackCollected",
      "privacy.teamFeedbackAnonymity",
      "privacy.teamFeedbackAccess",
      "privacy.teamFeedbackRetention",
    ],
  },
  { id: "cookies", index: "05", title: "privacy.cookiesTitle", body: "privacy.cookiesBody" },
  { id: "storage", index: "06", title: "privacy.storageTitle", body: "privacy.storageBody" },
  { id: "analytics", index: "07", title: "privacy.analyticsTitle", body: "privacy.analyticsBody" },
  {
    id: "processors",
    index: "08",
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
    index: "09",
    title: "privacy.rightsTitle",
    items: [
      "privacy.rightsAccess",
      "privacy.rightsDeletion",
      "privacy.rightsWithdraw",
    ],
  },
  { id: "contact", index: "10", title: "privacy.contactTitle", body: "privacy.contactBody" },
] as const;

export function PrivacyContent() {
  const { locale } = useLocale();
  const legalLabel = locale === "hu" ? "jogi" : "legal";
  const tocLabel = locale === "hu" ? "Tartalom" : "Contents";

  return (
    <main className="min-h-dvh bg-cream">
      <section className="border-b border-sand bg-action-primary-bg px-6 py-14 lg:px-16 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow tone="onDark" className="mb-4">
            {legalLabel}
          </SectionEyebrow>
          <h1 className="font-fraunces text-4xl leading-tight text-cream lg:text-[52px]">
            {t("privacy.title", locale)}
          </h1>
          <p className="font-dm-sans mt-4 text-[11px] uppercase tracking-widest text-cream/55">
            {t("privacy.lastUpdated", locale)}
          </p>
        </div>
      </section>

      <section className="px-6 py-10 lg:px-16 lg:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
          <aside className="h-fit rounded border border-sand bg-white p-4 lg:sticky lg:top-28">
            <p className="font-dm-sans mb-3 text-[11px] uppercase tracking-widest text-ink-body">
              {tocLabel}
            </p>
            <nav className="space-y-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-baseline gap-2 rounded px-2 py-1.5 transition-colors hover:bg-[#faf5ef]"
                >
                  <span className="font-dm-sans text-micro text-bronze">
                    {section.index}
                  </span>
                  <span className="text-sm text-ink-body transition-colors group-hover:text-ink">
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
                className="scroll-mt-28 rounded border border-sand bg-white p-5 md:p-7"
              >
                <p className="font-dm-sans mb-3 text-[11px] uppercase tracking-widest text-bronze">
                  {section.index}
                </p>
                <h2 className="font-fraunces mb-3 text-2xl leading-tight text-ink md:text-[30px]">
                  {t(section.title, locale)}
                </h2>
                {"body" in section && section.body ? (
                  <p className="text-body leading-[1.75] text-ink-body">
                    {t(section.body, locale)}
                  </p>
                ) : null}
                {"items" in section && section.items ? (
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="relative pl-5 text-body leading-[1.75] text-ink-body before:absolute before:left-0 before:top-[0.85em] before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-bronze"
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
