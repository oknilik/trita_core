"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { MarketingActions } from "@/components/marketing/MarketingActions";
import { PricingQuickAsk } from "@/components/pricing/PricingQuickAsk";
import { CheckIcon, ChevronRightIcon } from "@/components/ui/icons";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { track } from "@/lib/analytics/client";
import { t } from "@/lib/i18n/public";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { PRICING_FAQ_INDEXES } from "./faq";

const WORKFLOW_STEPS = [1, 2, 3] as const;
const OFFER_FACTORS = [1, 2, 3] as const;

function CollaborationVisual({ locale }: { locale: "hu" | "en" }) {
  return (
    <div
      aria-hidden="true"
      className="relative min-h-[390px] overflow-hidden rounded-[28px] border border-sand bg-[var(--color-layer-team-hero-from)] p-5 shadow-[0_28px_80px_rgba(26,26,46,0.16)] sm:p-7"
    >
      <div className="absolute -right-20 -top-24 size-72 rounded-full border border-white/10" />
      <div className="absolute -right-8 -top-12 size-48 rounded-full border border-white/10" />
      <div className="absolute bottom-7 left-8 size-2 rounded-full bg-[var(--color-layer-team-glow)]" />
      <div className="absolute bottom-16 right-12 size-1.5 rounded-full bg-[var(--color-text-on-inverse)]/40" />

      <div className="relative flex h-full min-h-[334px] flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-label uppercase text-[var(--color-text-on-inverse-muted)]">
            {t("pricing.workflowEyebrow", locale)}
          </p>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-note text-[var(--color-text-on-inverse-muted)]">
            01—03
          </span>
        </div>

        <div className="relative mx-auto my-6 w-full max-w-[330px]">
          <div className="absolute bottom-7 left-8 top-7 w-px bg-gradient-to-b from-white/15 via-[var(--color-layer-team-glow)] to-white/15" />
          {WORKFLOW_STEPS.map((step, index) => (
            <div
              key={step}
              className={`relative mb-3 flex items-center gap-4 rounded-2xl border px-4 py-4 backdrop-blur-sm ${
                index === 1
                  ? "ml-6 border-[var(--color-layer-team-glow)]/50 bg-white/15 shadow-lg"
                  : "border-white/15 bg-white/[0.08]"
              }`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-layer-team-badge)] font-fraunces text-sm text-[var(--color-layer-team-hero-to)]">
                {step}
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-on-inverse)]">
                  {t(`pricing.workflow${step}Title`, locale)}
                </p>
                <p className="mt-0.5 text-note text-[var(--color-text-on-inverse-muted)]">
                  {t(`pricing.offerFactor${step}`, locale)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-white/10 pt-4">
          <div className="flex -space-x-2">
            {["bg-sage", "bg-[var(--color-layer-team-bright)]", "bg-[var(--color-layer-team-glow)]"].map(
              (color, index) => (
                <span key={index} className={`size-7 rounded-full border-2 border-[var(--color-layer-team-hero-from)] ${color}`} />
              ),
            )}
          </div>
          <p className="text-note text-[var(--color-text-on-inverse-muted)]">
            {locale === "hu" ? "Közös kép, közös következő lépés" : "A shared picture and a shared next step"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Workflow({ locale }: { locale: "hu" | "en" }) {
  return (
    <ol className="relative mt-9 grid gap-4 lg:grid-cols-3 lg:gap-0">
      <div className="absolute left-[16.66%] right-[16.66%] top-7 hidden h-px bg-sand lg:block" />
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
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-[var(--color-layer-team-soft)]/65 to-transparent" />
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
              secondary={{ href: "/pilot", label: t("pricing.offerPilotCta", locale), iconRight: <ChevronRightIcon /> }}
            />
            <div className="mt-7 flex flex-wrap gap-2.5">
              {OFFER_FACTORS.map((factor) => (
                <span key={factor} className="rounded-full border border-sand bg-surface-card/75 px-3 py-1.5 text-caption text-ink-body backdrop-blur-sm">{t(`pricing.offerFactor${factor}`, locale)}</span>
              ))}
            </div>
          </div>
          <CollaborationVisual locale={locale} />
        </div>
      </section>

      <section className="border-y border-sand bg-warm">
        <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>{t("pricing.workflowEyebrow", locale)}</SectionEyebrow>
            <h2 className="mt-4 font-fraunces text-fluid-title tracking-tight text-ink">
              {locale === "hu" ? "Egy beszélgetéstől a használható csapatképig." : "From one conversation to an actionable team picture."}
            </h2>
          </div>
          <Workflow locale={locale} />
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div><SectionEyebrow>{t("pricing.offerEyebrow", locale)}</SectionEyebrow></div>
          <div>
            <h2 className="max-w-[17ch] font-fraunces text-fluid-title tracking-tight text-ink">{t("pricing.offerTitle", locale)}</h2>
            <p className="mt-5 max-w-[64ch] text-base leading-relaxed text-ink-body">{t("pricing.offerBody", locale)}</p>
            <div className="mt-9 grid gap-5 md:grid-cols-2">
              <article className="flex flex-col rounded-[24px] border border-sage/15 bg-sage-soft p-6 md:p-7">
                <SectionEyebrow tone="self">{t("pricing.selfEyebrow", locale)}</SectionEyebrow>
                <h3 className="mt-4 font-fraunces text-2xl text-ink">{t("pricing.selfTitle", locale)}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-body">{t("pricing.selfBody", locale)}</p>
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

      <section className="px-7 pb-16 md:pb-24">
        <div className="mx-auto grid max-w-[1060px] overflow-hidden rounded-[28px] border border-sand bg-surface-card shadow-[0_24px_70px_rgba(26,26,46,0.07)] md:grid-cols-[0.72fr_1.28fr]">
          <div className="relative min-h-52 overflow-hidden bg-[var(--color-layer-team-soft)] p-7">
            <div className="absolute -bottom-20 -left-14 size-56 rounded-full border border-[var(--color-layer-team-accent)]/15" />
            <div className="absolute -bottom-8 -left-2 size-36 rounded-full border border-[var(--color-layer-team-accent)]/20" />
            <div className="relative flex h-full items-end"><span className="font-fraunces text-7xl text-[var(--color-layer-team-accent)]/20">90</span><span className="mb-2 ml-2 text-label uppercase text-[var(--color-layer-team-accent)]">{locale === "hu" ? "nap" : "days"}</span></div>
          </div>
          <div className="p-7 md:p-10">
            <SectionEyebrow tone="team">{t("pricing.pilotEyebrow", locale)}</SectionEyebrow>
            <h2 className="mt-4 font-fraunces text-3xl text-ink">{t("pricing.pilotTitle", locale)}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-body">{t("pricing.pilotBody", locale)}</p>
            <Link href="/pilot" onClick={() => track("cta.click", { cta_id: "pricing_pilot", surface: "pricing" })} className={`mt-5 inline-flex min-h-11 items-center font-semibold text-[var(--color-layer-team-accent)] transition-colors hover:text-[var(--color-layer-team-bright)] ${FOCUS_RING_CLASS}`}>
              {t("pricing.pilotCta", locale)}<ChevronRightIcon className="ml-1 h-4 w-4 shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-sand bg-warm px-7 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <SectionEyebrow>{locale === "hu" ? "Mielőtt belevágunk" : "Before we begin"}</SectionEyebrow>
            <h2 className="mt-4 font-fraunces text-fluid-title text-ink">{t("pricing.faqHeading", locale)}</h2>
          </div>
          <div className="mt-8 space-y-3">
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

      <section className="px-5 py-8 lg:px-14">
        <div className="mx-auto max-w-[1060px] rounded-[28px] bg-gradient-to-br from-[var(--color-surface-inverse)] to-[var(--color-surface-inverse-soft)] px-6 py-12 lg:px-10 lg:py-14">
          <PricingQuickAsk locale={locale} />
        </div>
      </section>
    </main>
  );
}
