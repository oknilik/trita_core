"use client";

import { useLocale } from "@/components/LocaleProvider";
import { MarketingActions } from "@/components/marketing/MarketingActions";
import { PageWidthDivider } from "@/components/marketing/PageWidthDivider";
import { ChevronRightIcon } from "@/components/ui/icons";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { t } from "@/lib/i18n/public";

export function AboutContent() {
  const { locale } = useLocale();
  const principles = [1, 2, 3].map((number) => ({
    number: `0${number}`,
    title: t(`about.principle${number}Title`, locale),
    description: t(`about.principle${number}Desc`, locale),
  }));
  const steps = [1, 2, 3, 4].map((number) => ({
    number: `0${number}`,
    title: t(`about.step${number}Title`, locale),
    description: t(`about.step${number}Desc`, locale),
  }));

  return (
    <main className="overflow-hidden bg-cream text-ink selection:bg-bronze/20">
      <section className="relative">
        <div aria-hidden className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-bronze/5 blur-3xl" />
        <div className="relative mx-auto max-w-[1120px] px-7 pb-16 pt-12 md:pb-24 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div>
              <SectionEyebrow className="mb-6">{t("about.heroEyebrow", locale)}</SectionEyebrow>
              <h1 className="max-w-[14ch] font-fraunces text-fluid-display tracking-tight text-ink">
                {t("about.heroTitleBefore", locale)}
                <em className="not-italic text-[var(--color-accent-primary-strong)]">{t("about.heroTitleEm", locale)}</em>
              </h1>
              <p className="mt-6 max-w-[620px] text-lg leading-relaxed text-ink-body">{t("about.heroBody", locale)}</p>
              <MarketingActions
                className="mt-8"
                primary={{ href: "/contact", label: t("about.heroCtaPrimary", locale) }}
                secondary={{ href: "/how-we-work", label: t("about.heroCtaSecondary", locale), iconRight: <ChevronRightIcon className="h-4 w-4" /> }}
              />
            </div>

            <aside className="rounded-[28px] bg-[var(--color-surface-inverse)] px-7 py-8 text-[var(--color-text-on-inverse)] shadow-[0_28px_80px_rgba(26,26,46,0.16)]">
              <SectionEyebrow tone="onDark">{t("about.principlesEyebrow", locale)}</SectionEyebrow>
              <div className="mt-7 divide-y divide-white/10">
                {principles.map((principle) => (
                  <div key={principle.number} className="grid grid-cols-[34px_1fr] gap-3 py-5 first:pt-0 last:pb-0">
                    <span className="text-label text-[var(--color-accent-primary)]">{principle.number}</span>
                    <div>
                      <h2 className="font-fraunces text-xl">{principle.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-on-inverse-muted)]">{principle.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <PageWidthDivider />

      <section className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <SectionEyebrow>{t("about.storyEyebrow", locale)}</SectionEyebrow>
          <div>
            <h2 className="max-w-[18ch] font-fraunces text-fluid-title tracking-tight text-ink">{t("about.storyTitle", locale)}</h2>
            <p className="mt-6 max-w-[66ch] text-lg leading-relaxed text-ink-body">{t("about.storyBody", locale)}</p>
          </div>
        </div>
      </section>

      <section className="bg-warm">
        <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
            <SectionEyebrow>{t("about.stepsEyebrow", locale)}</SectionEyebrow>
            <div>
              <h2 className="max-w-[18ch] font-fraunces text-fluid-title tracking-tight text-ink">{t("about.stepsTitle", locale)}</h2>
              <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-ink-body">{t("about.stepsLead", locale)}</p>
              <ol className="mt-9 divide-y divide-sand border-y border-sand">
                {steps.map((step) => (
                  <li key={step.number} className="grid gap-3 py-6 sm:grid-cols-[52px_190px_1fr] sm:items-baseline sm:gap-5">
                    <span className="text-label text-[var(--color-accent-primary-strong)]">{step.number}</span>
                    <h3 className="font-fraunces text-xl text-ink">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-body">{step.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface-inverse)] text-[var(--color-text-on-inverse)]">
        <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
          <blockquote className="max-w-[25ch] font-fraunces text-fluid-title tracking-tight">{t("about.statement", locale)}</blockquote>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
        <div className="rounded-[28px] border border-sand bg-surface-card px-7 py-10 shadow-[0_20px_60px_rgba(26,26,46,0.05)] md:px-12 md:py-12">
          <h2 className="font-fraunces text-fluid-title tracking-tight text-ink">{t("about.ctaTitle", locale)}</h2>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-ink-body">{t("about.ctaBody", locale)}</p>
          <MarketingActions
            className="mt-7"
            primary={{ href: "/pilot", label: t("about.ctaPrimary", locale) }}
            secondary={{ href: "/contact", label: t("about.ctaSecondary", locale) }}
          />
        </div>
      </section>
    </main>
  );
}
