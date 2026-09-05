"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { CollaborationRhythmArt } from "@/components/marketing/CollaborationRhythmArt";
import { MarketingActions } from "@/components/marketing/MarketingActions";
import { LocalizedPageMeta } from "@/components/marketing/LocalizedPageMeta";
import { PageWidthDivider } from "@/components/marketing/PageWidthDivider";
import { PilotSpotsIndicator } from "@/components/marketing/PilotSpotsIndicator";
import { CheckIcon, ChevronRightIcon } from "@/components/ui/icons";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { track } from "@/lib/analytics/client";
import { t } from "@/lib/i18n/public";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { PRICING_FAQ_INDEXES } from "./faq";

const WORKFLOW_STEPS = [1, 2, 3, 4, 5] as const;
const OFFER_FACTORS = [1, 2, 3] as const;

function CollaborationVisual() {
  return (
    <div className="relative grid min-h-[390px] place-items-center overflow-hidden rounded-[28px] border border-sand bg-[var(--color-layer-team-hero-from)] p-5 shadow-[0_28px_80px_rgba(26,26,46,0.16)] sm:p-7">
      <CollaborationRhythmArt className="block h-auto w-full max-w-[470px]" />
    </div>
  );
}

function Workflow({ locale }: { locale: "hu" | "en" }) {
  return (
    <ol className="relative mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
      <div className="absolute left-[10%] right-[10%] top-7 hidden h-px bg-sand lg:block" />
      {WORKFLOW_STEPS.map((step) => (
        <li key={step} className="relative flex gap-4 rounded-[22px] border border-sand bg-surface-card p-5 shadow-[0_14px_35px_rgba(26,26,46,0.04)] lg:block lg:border-0 lg:bg-transparent lg:px-8 lg:py-0 lg:text-center lg:shadow-none">
          <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full border border-[var(--color-layer-team-accent)]/20 bg-[var(--color-layer-team-soft)] font-fraunces text-xl text-[var(--color-layer-team-accent)] lg:mx-auto">
            {step}
          </span>
          <div>
            <h3 className="font-fraunces text-heading text-ink lg:mt-5">{t(`pricing.workflow${step}Title`, locale)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-body">{t(`pricing.workflow${step}Body`, locale)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PricingContent() {
  const { locale } = useLocale();

  return (
    <main className="overflow-hidden bg-cream text-ink selection:bg-bronze/20">
      <LocalizedPageMeta titleKey="pricing.metaTitle" descriptionKey="pricing.metaDescription" />
      <section className="relative overflow-hidden bg-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[6%] top-[10%] h-[72%] w-[46%] rounded-full bg-[var(--color-layer-team-soft)]/55 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-[1120px] gap-12 px-7 pb-20 pt-12 md:pb-28 md:pt-20 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-center">
          <div>
            <SectionEyebrow tone="team" className="mb-6">{t("pricing.heroEyebrow", locale)}</SectionEyebrow>
            <h1 className="max-w-[14ch] font-fraunces text-fluid-display tracking-tight text-ink">
              {t("pricing.heroHeading", locale)}
              <em className="not-italic text-[var(--color-layer-team-accent)]">{t("pricing.heroHeadingEm", locale)}</em>
            </h1>
            <p className="mt-6 max-w-[610px] text-base leading-relaxed text-ink-body">{t("pricing.heroSub", locale)}</p>
            <MarketingActions
              className="mt-8"
              primary={{ href: "/contact", label: t("pricing.offerCta", locale), onClick: () => track("cta.click", { cta_id: "pricing_hero", surface: "pricing" }) }}
              secondary={{ href: "#workflow", label: t("pricing.heroProcessCta", locale), iconRight: <ChevronRightIcon /> }}
            />
            <div className="mt-7 flex flex-wrap gap-2.5">
              {OFFER_FACTORS.map((factor) => (
                <span key={factor} className="rounded-full border border-sand bg-surface-card/75 px-3 py-1.5 text-caption text-ink-body backdrop-blur-sm">{t(`pricing.offerFactor${factor}`, locale)}</span>
              ))}
            </div>
          </div>
          <CollaborationVisual />
        </div>
      </section>

      <PageWidthDivider />

      <section id="workflow" className="scroll-mt-24 bg-cream">
        <div className="mx-auto max-w-[1120px] px-7 pb-10 pt-16 md:pb-14 md:pt-24">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>{t("pricing.workflowEyebrow", locale)}</SectionEyebrow>
            <h2 className="mt-4 font-fraunces text-fluid-title tracking-tight text-ink">
              {locale === "hu" ? "A helyzetképtől a mérhető változásig." : "From understanding the situation to measurable change."}
            </h2>
          </div>
          <Workflow locale={locale} />
        </div>
      </section>

      <section className="bg-warm">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-16 md:py-24 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <SectionEyebrow>{t("pricing.offerEyebrow", locale)}</SectionEyebrow>
            <p className="mt-4 hidden max-w-[24ch] text-sm leading-relaxed text-ink-body lg:block">
              {t("pricing.offerAside", locale)}
            </p>
          </div>
          <div>
            <h2 className="max-w-[17ch] font-fraunces text-fluid-title tracking-tight text-ink">{t("pricing.offerTitle", locale)}</h2>
            <p className="mt-5 max-w-[64ch] text-base leading-relaxed text-ink-body">{t("pricing.offerBody", locale)}</p>
            <div className="mt-9 grid gap-5 md:grid-cols-2">
              <article className="flex flex-col rounded-[24px] border border-sage/15 bg-sage-soft p-6 md:p-7">
                <SectionEyebrow tone="self">{t("pricing.selfEyebrow", locale)}</SectionEyebrow>
                <h3 className="mt-4 font-fraunces text-2xl text-ink">{t("pricing.selfTitle", locale)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-body">{t("pricing.selfBody", locale)}</p>
                <ul className="mt-5 flex-1 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <li key={item} className="flex gap-2.5 text-caption leading-relaxed text-ink-body">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-sage" />{t(`pricing.selfCheck${item}`, locale)}
                    </li>
                  ))}
                </ul>
                <Link href="/try" className={`mt-6 inline-flex min-h-11 items-center self-start font-semibold text-sage-dark transition-colors hover:text-sage ${FOCUS_RING_CLASS}`}>
                  {t("pricing.selfCta", locale)}<ChevronRightIcon className="ml-1 h-4 w-4 shrink-0" />
                </Link>
              </article>

              <article className="relative flex flex-col overflow-hidden rounded-[24px] bg-[var(--color-layer-team-hero-from)] p-6 text-[var(--color-text-on-inverse)] shadow-[0_20px_50px_rgba(26,26,46,0.12)] md:p-7">
                <div className="absolute -right-12 -top-12 size-40 rounded-full border border-white/10" />
                <SectionEyebrow tone="onDark">{t("pricing.teamEyebrow", locale)}</SectionEyebrow>
                <h3 className="relative mt-4 font-fraunces text-2xl">{t("pricing.teamTitle", locale)}</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-[var(--color-text-on-inverse-muted)]">{t("pricing.teamBody", locale)}</p>
                <ul className="relative mt-5 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <li key={item} className="flex gap-2.5 text-caption leading-relaxed text-[var(--color-text-on-inverse-muted)]">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-layer-team-badge)]" />{t(`pricing.teamHow${item}`, locale)}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" onClick={() => track("cta.click", { cta_id: "pricing_team", surface: "pricing" })} className={`relative mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-layer-team-badge)] px-5 text-center text-caption font-semibold text-[var(--color-layer-team-hero-to)] transition hover:-translate-y-0.5 hover:brightness-105 ${FOCUS_RING_CLASS}`}>
                  {t("pricing.teamCta", locale)}
                </Link>
              </article>
            </div>
            <div className="mt-5 rounded-[20px] border border-sand bg-warm px-5 py-5 md:px-6">
              <p className="text-sm leading-relaxed text-ink-body">{t("pricing.teamPriceNote", locale)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream px-7 py-16 md:py-24">
        <div className="mx-auto max-w-[760px]">
          <div className="text-center">
            <SectionEyebrow tone="team">{t("pricing.pilotEyebrow", locale)}</SectionEyebrow>
            <h2 className="mt-4 font-fraunces text-fluid-title text-ink">
              {t("pricing.pilotSectionTitle", locale)}
            </h2>
          </div>
          <PilotSpotsIndicator
            locale={locale}
            href="/pilot"
            ctaId="pricing_pilot"
            surface="pricing"
            className="mx-auto mt-8"
          />
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-3xl px-7 pb-16 md:pb-24">
          <div className="text-center">
            <SectionEyebrow>{locale === "hu" ? "Mielőtt belevágunk" : "Before we begin"}</SectionEyebrow>
            <h2 className="mt-4 font-fraunces text-fluid-title text-ink">{t("pricing.faqHeading", locale)}</h2>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {PRICING_FAQ_INDEXES.map((i) => (
              <details key={i} onToggle={(event) => event.currentTarget.open && track("faq.open", { faq_id: `pricing_q${i}`, surface: "pricing" })} className="group rounded-[18px] border border-sand bg-surface-card open:shadow-[0_12px_30px_rgba(26,26,46,0.04)]">
                <summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-[18px] px-5 py-4 text-sm font-semibold text-ink ${FOCUS_RING_CLASS}`}>
                  {t(`pricing.faqQ${i}`, locale)}<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warm text-lg font-normal text-ink-body transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 pr-14 text-sm leading-relaxed text-ink-body">{t(`pricing.faqA${i}`, locale)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-8 lg:px-14">
        <div className="mx-auto max-w-[1060px] rounded-[28px] bg-gradient-to-br from-[var(--color-surface-inverse)] to-[var(--color-surface-inverse-soft)] px-6 py-12 text-center lg:px-10 lg:py-14">
          <SectionEyebrow tone="onDark">{t("pricing.quickAskEyebrow", locale)}</SectionEyebrow>
          <h2 className="mx-auto mt-4 max-w-[18ch] font-fraunces text-fluid-title text-[var(--color-text-on-inverse)]">
            {t("pricing.bottomHeading", locale)}
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-relaxed text-[var(--color-text-on-inverse-muted)]">
            {t("pricing.bottomSub", locale)}
          </p>
          <Link
            href="/contact"
            onClick={() => track("cta.click", { cta_id: "pricing_bottom", surface: "pricing" })}
            className={`mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-action-primary-bg)] px-6 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:-translate-y-0.5 hover:brightness-105 ${FOCUS_RING_CLASS}`}
          >
            {t("pricing.bottomCta", locale)}
          </Link>
        </div>
      </section>
    </main>
  );
}
