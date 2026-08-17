"use client";

import Link from "next/link";
import { PricingQuickAsk } from "@/components/pricing/PricingQuickAsk";
import { useLocale } from "@/components/LocaleProvider";
import { track } from "@/lib/analytics/client";
import { t } from "@/lib/i18n/public";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { PRICING_FAQ_INDEXES } from "./faq";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-[1.5px] w-5 bg-[var(--color-accent-primary)]" />
      <span className="font-dm-sans text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
        {children}
      </span>
    </div>
  );
}

const WORKFLOW_STEPS = [1, 2, 3] as const;
const OFFER_FACTORS = [1, 2, 3] as const;

export function PricingContent() {
  const { locale } = useLocale();

  return (
    <main className="min-h-dvh bg-[var(--color-surface-canvas)]">
      <section className="px-6 pb-10 pt-14 lg:px-16 lg:pb-14 lg:pt-20">
        <div className="mx-auto max-w-5xl">
          <p className="font-dm-sans text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
            {t("pricing.heroEyebrow", locale)}
          </p>
          <h1 className="mt-3 max-w-3xl font-fraunces text-fluid-title tracking-tight text-[var(--color-text-primary)]">
            {t("pricing.heroHeading", locale)}
            <em className="text-[var(--color-action-primary-bg)]">
              {t("pricing.heroHeadingEm", locale)}
            </em>
          </h1>
          <p className="mt-5 max-w-2xl text-body leading-relaxed text-[var(--color-text-muted)]">
            {t("pricing.heroSub", locale)}
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-16">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)] lg:items-start">
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-surface-card p-6 sm:p-8">
            <Eyebrow>{t("pricing.workflowEyebrow", locale)}</Eyebrow>
            <ol className="mt-6 space-y-3">
              {WORKFLOW_STEPS.map((step) => (
                <li
                  key={step}
                  className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-11 items-center justify-center rounded-full bg-[var(--color-surface-self-accent-soft)] font-fraunces text-lg text-[var(--color-accent-self-deep)]"
                  >
                    {step}
                  </span>
                  <div>
                    <h2 className="font-dm-sans text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {t(`pricing.workflow${step}Title`, locale)}
                    </h2>
                    <p className="mt-1 text-caption leading-relaxed text-[var(--color-text-muted)]">
                      {t(`pricing.workflow${step}Body`, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="rounded-2xl border border-[var(--color-accent-primary)]/40 bg-[var(--color-surface-highlight-warm)] p-6 sm:p-8 lg:sticky lg:top-28">
            <Eyebrow>{t("pricing.offerEyebrow", locale)}</Eyebrow>
            <h2 className="font-fraunces text-2xl text-[var(--color-text-primary)]">
              {t("pricing.offerTitle", locale)}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-muted)]">
              {t("pricing.offerBody", locale)}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {OFFER_FACTORS.map((factor) => (
                <li
                  key={factor}
                  className="rounded-full border border-[var(--color-border-default)] bg-surface-card px-3 py-2 text-[12px] font-medium text-[var(--color-text-secondary)]"
                >
                  {t(`pricing.offerFactor${factor}`, locale)}
                </li>
              ))}
            </ul>
            <Link
              href="/contact"
              className={`mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--color-action-primary-bg)] px-5 text-caption font-semibold text-[var(--color-action-primary-fg)] shadow-sm shadow-[var(--color-action-primary-bg)]/15 transition hover:brightness-[1.06] ${FOCUS_RING_CLASS}`}
            >
              {t("pricing.offerCta", locale)}
            </Link>
            <Link
              href="/pilot"
              className={`mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-surface-card px-5 text-caption font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
            >
              {t("pricing.offerPilotCta", locale)}
            </Link>
          </aside>
        </div>
      </section>

      <section className="mt-6 px-6 lg:px-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-[var(--color-border-soft)] bg-surface-card p-6 sm:p-8">
            <Eyebrow>{t("pricing.selfEyebrow", locale)}</Eyebrow>
            <h2 className="font-fraunces text-2xl text-[var(--color-text-primary)]">
              {t("pricing.selfTitle", locale)}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-muted)]">
              {t("pricing.selfBody", locale)}
            </p>
            <Link
              href="/try"
              className={`mt-5 inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border-default)] bg-surface-card px-5 text-caption font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
            >
              {t("pricing.selfCta", locale)}
            </Link>
          </article>

          <article className="rounded-2xl border border-[var(--color-accent-primary)]/40 bg-[var(--color-surface-highlight-warm)] p-6 sm:p-8">
            <Eyebrow>{t("pricing.pilotEyebrow", locale)}</Eyebrow>
            <h2 className="font-fraunces text-2xl text-[var(--color-text-primary)]">
              {t("pricing.pilotTitle", locale)}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-muted)]">
              {t("pricing.pilotBody", locale)}
            </p>
            <Link
              href="/pilot"
              className={`mt-5 inline-flex min-h-11 items-center rounded-xl border border-[var(--color-accent-primary)]/50 bg-surface-card px-5 text-caption font-semibold text-[var(--color-accent-primary-strong)] transition hover:bg-[var(--color-surface-highlight-warm)] ${FOCUS_RING_CLASS}`}
            >
              {t("pricing.pilotCta", locale)}
            </Link>
          </article>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-3xl px-6 lg:px-0">
        <h2 className="text-center font-fraunces text-2xl text-[var(--color-text-primary)]">
          {t("pricing.faqHeading", locale)}
        </h2>
        <div className="mt-6 space-y-3">
          {PRICING_FAQ_INDEXES.map((i) => (
            <details
              key={i}
              onToggle={(event) => {
                if (event.currentTarget.open) {
                  track("faq.open", { faq_id: `pricing_q${i}`, surface: "pricing" });
                }
              }}
              className="group rounded-xl border border-[var(--color-border-soft)] bg-surface-card"
            >
              <summary
                className={`flex min-h-11 cursor-pointer list-none items-center rounded-xl px-5 py-4 text-[14px] font-semibold text-[var(--color-text-primary)] ${FOCUS_RING_CLASS}`}
              >
                {t(`pricing.faqQ${i}`, locale)}
              </summary>
              <p className="px-5 pb-4 text-caption leading-relaxed text-[var(--color-text-muted)]">
                {t(`pricing.faqA${i}`, locale)}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-5 mb-8 mt-14 lg:mx-14">
        <div className="mx-auto max-w-5xl rounded-2xl bg-gradient-to-br from-[var(--color-surface-inverse)] to-[var(--color-surface-inverse-soft)] px-6 py-10 lg:px-10 lg:py-12">
          <PricingQuickAsk locale={locale} />
        </div>
      </section>
    </main>
  );
}
