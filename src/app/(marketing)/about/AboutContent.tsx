"use client";

import { useLocale } from "@/components/LocaleProvider";
import { TritaWordmark } from "@/components/TritaLogo";
import { AboutHorizonArt } from "@/components/marketing/AboutHorizonArt";
import { AboutStatementArt } from "@/components/marketing/AboutStatementArt";
import { MarketingActions } from "@/components/marketing/MarketingActions";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { t } from "@/lib/i18n/public";

export function AboutContent() {
  const { locale } = useLocale();
  const principles = [1, 2, 3].map((number) => ({
    number: `0${number}`,
    title: t(`about.principle${number}Title`, locale),
    description: t(`about.principle${number}Desc`, locale),
  }));

  return (
    <main className="overflow-hidden bg-cream text-ink selection:bg-bronze/20">
      {/* Hero — középre zárt, levél-hangvétel; a CTA az oldal alján él. */}
      <section className="mx-auto flex max-w-[1120px] flex-col items-center px-7 pt-14 text-center md:pt-20">
        <SectionEyebrow className="mb-6">{t("about.heroEyebrow", locale)}</SectionEyebrow>
        <h1 className="max-w-[15ch] font-fraunces text-fluid-display tracking-tight text-ink">
          {t("about.heroTitleBefore", locale)}
          <TritaWordmark className="text-ink" />
          {t("about.heroTitleAfter", locale)}
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-body">{t("about.heroBody", locale)}</p>
      </section>

      {/* „Horizont” — fixen komponált tájkép-sáv; alacsony, nyugodt átkötés
          a hero és az elvek között. */}
      <div className="mx-auto max-w-[900px] px-7 pb-8 pt-9 md:pb-12">
        <AboutHorizonArt />
      </div>

      <section className="border-t border-sand">
        <div className="mx-auto max-w-[1120px] px-7 py-14 md:py-20">
          <div className="flex justify-center">
            <SectionEyebrow>{t("about.principlesEyebrow", locale)}</SectionEyebrow>
          </div>
          <div className="mt-11 grid gap-10 sm:grid-cols-3 sm:gap-12">
            {principles.map((principle) => (
              <div key={principle.number} className="flex flex-col gap-3">
                <span className="text-label text-[var(--color-accent-primary)]">{principle.number}</span>
                <h2 className="font-fraunces text-2xl text-ink">{principle.title}</h2>
                <p className="text-sm leading-relaxed text-ink-body">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-warm">
        <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
            <SectionEyebrow>{t("about.storyEyebrow", locale)}</SectionEyebrow>
            <div>
              <h2 className="max-w-[20ch] font-fraunces text-fluid-title tracking-tight text-ink">{t("about.storyTitle", locale)}</h2>
              <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-ink-body">{t("about.storyBody", locale)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface-inverse)] text-[var(--color-text-on-inverse)]">
        <div className="relative mx-auto flex max-w-[1280px] items-center overflow-hidden px-7 py-16 md:min-h-[360px] md:py-20">
          <blockquote className="relative z-10 max-w-[34ch] font-fraunces text-fluid-title leading-[1.12] tracking-tight">
            <span className="md:block">{t("about.statementLine1", locale)}</span>{" "}
            <span className="md:block">
              {t("about.statementLine2Before", locale)}
              <span className="text-[var(--color-accent-primary)]">{t("about.statementLine2Accent", locale)}</span>
              {t("about.statementLine2After", locale)}
            </span>{" "}
            <span className="md:block">{t("about.statementLine3", locale)}</span>
          </blockquote>
          <AboutStatementArt className="pointer-events-none absolute -bottom-20 -right-24 w-[270px] opacity-25 md:-bottom-24 md:-right-20 md:w-[360px] md:opacity-35 xl:bottom-1/2 xl:-right-5 xl:w-[340px] xl:translate-y-1/2 xl:opacity-90" />
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
        <div className="rounded-[28px] border border-sand bg-surface-card px-7 py-10 shadow-[0_20px_60px_rgba(26,26,46,0.05)] md:px-12 md:py-12">
          <h2 className="font-fraunces text-fluid-title tracking-tight text-ink">{t("about.ctaTitle", locale)}</h2>
          <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-ink-body">{t("about.ctaBody", locale)}</p>
          <MarketingActions
            className="mt-7"
            primary={{ href: "/contact", label: t("about.ctaPrimary", locale) }}
            secondary={{ href: "/how-we-work", label: t("about.ctaSecondary", locale) }}
          />
        </div>
      </section>
    </main>
  );
}
