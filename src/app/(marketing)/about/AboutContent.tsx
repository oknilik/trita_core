"use client";

import { useLocale } from "@/components/LocaleProvider";
import { MarketingActions } from "@/components/marketing/MarketingActions";
import { EditorialArt, artKeyFrom } from "@/components/ui/EditorialArt";
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
          <em className="not-italic text-[var(--color-accent-primary-strong)]">{t("about.heroTitleEm", locale)}</em>
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-body">{t("about.heroBody", locale)}</p>
      </section>

      {/* Konstelláció-sáv — egyetlen nagy felület, ezért itt a szabad
          kompozíció a helyes eszköz, nem a SectionTransition. */}
      <div className="mx-auto max-w-[860px] px-7 pb-10 pt-8 md:pb-14">
        <EditorialArt artKey={artKeyFrom("about", "hero")} width={860} height={200} />
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
        <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
          <blockquote className="max-w-[26ch] font-fraunces text-fluid-title tracking-tight">{t("about.statement", locale)}</blockquote>
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
