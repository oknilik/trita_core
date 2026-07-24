"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { PricingQuickAsk } from "@/components/pricing/PricingQuickAsk";

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

export function PricingContent() {
  const { locale } = useLocale();

  return (
    <main className="min-h-dvh bg-[var(--color-surface-canvas)]">
      {/* ── Hero ── */}
      <section className="px-6 pb-10 pt-14 text-center lg:px-16 lg:pt-20">
        <p className="font-dm-sans text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
          {t("pricing.heroEyebrow", locale)}
        </p>
        <h1 className="mx-auto mt-3 max-w-2xl font-fraunces text-[clamp(30px,5vw,44px)] leading-[1.15] tracking-tight text-[var(--color-text-primary)]">
          {t("pricing.heroHeading", locale)}
          <em className="text-[var(--color-action-primary-bg)]">{t("pricing.heroHeadingEm", locale)}</em>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-body leading-relaxed text-[var(--color-text-muted)]">
          {t("pricing.heroSub", locale)}
        </p>
      </section>

      {/* ── Egyéni: ingyenes ── */}
      <section className="px-6 lg:px-16">
        <div className="mx-auto max-w-5xl rounded-2xl border border-[var(--color-border-soft)] bg-white p-7 lg:p-9">
          <Eyebrow>{t("pricing.selfEyebrow", locale)}</Eyebrow>
          <h2 className="font-fraunces text-2xl text-[var(--color-text-primary)]">
            {t("pricing.selfTitle", locale)}
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--color-text-muted)]">
            {t("pricing.selfBody", locale)}
          </p>
          <Link
            href="/try"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-lg border border-[var(--color-border-default)] bg-white px-5 text-caption font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-subtle)]"
          >
            {t("pricing.selfCta", locale)}
          </Link>
        </div>
      </section>

      {/* ── Csapat & szervezet: program ── */}
      <section className="mt-6 px-6 lg:px-16">
        <div className="mx-auto max-w-5xl rounded-2xl border border-[var(--color-border-soft)] bg-white p-7 lg:p-9">
          <Eyebrow>{t("pricing.teamEyebrow", locale)}</Eyebrow>
          <h2 className="font-fraunces text-2xl text-[var(--color-text-primary)]">
            {t("pricing.teamTitle", locale)}
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--color-text-muted)]">
            {t("pricing.teamBody", locale)}
          </p>

          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {(["teamHow1", "teamHow2", "teamHow3"] as const).map((key, i) => (
              <li
                key={key}
                className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-3.5"
              >
                <span className="font-fraunces text-lg text-[var(--color-action-primary-bg)]">{i + 1}</span>
                <p className="mt-1 text-caption leading-snug text-[var(--color-text-secondary)]">
                  {t(`pricing.${key}`, locale)}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-6 rounded-xl bg-[var(--color-surface-self-accent-soft)]/60 px-4 py-3.5 text-caption leading-relaxed text-[var(--color-accent-self-deep)]">
            {t("pricing.teamPriceNote", locale)}
          </p>

          <Link
            href="/contact"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-lg bg-[var(--color-action-primary-bg)] px-6 text-caption font-semibold text-white shadow-sm shadow-[var(--color-action-primary-bg)]/15 transition hover:brightness-[1.06]"
          >
            {t("pricing.teamCta", locale)}
          </Link>
          <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">
            {t("pricing.ctaTrust", locale)}
          </p>
        </div>
      </section>

      {/* ── Pilot kiemelés ── */}
      <section className="mt-6 px-6 lg:px-16">
        <div className="mx-auto max-w-5xl rounded-2xl border border-[var(--color-accent-primary)]/40 bg-[var(--color-surface-highlight-warm)] p-7 lg:p-9">
          <Eyebrow>{t("pricing.pilotEyebrow", locale)}</Eyebrow>
          <h2 className="font-fraunces text-2xl text-[var(--color-text-primary)]">
            {t("pricing.pilotTitle", locale)}
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--color-text-muted)]">
            {t("pricing.pilotBody", locale)}
          </p>
          <Link
            href="/pilot"
            className="mt-5 inline-flex min-h-[44px] items-center rounded-lg border border-[var(--color-accent-primary)]/50 bg-white px-5 text-caption font-semibold text-[var(--color-accent-primary-strong)] transition hover:bg-[var(--color-surface-highlight-warm)]"
          >
            {t("pricing.pilotCta", locale)}
          </Link>
        </div>
      </section>

      {/* ── GYIK ── */}
      <section className="mx-auto mt-14 max-w-3xl px-6 lg:px-0">
        <h2 className="text-center font-fraunces text-2xl text-[var(--color-text-primary)]">
          {t("pricing.faqHeading", locale)}
        </h2>
        <div className="mt-6 space-y-3">
          {([1, 2, 3, 4] as const).map((i) => (
            <details
              key={i}
              className="group rounded-xl border border-[var(--color-border-soft)] bg-white px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-[14px] font-semibold text-[var(--color-text-primary)]">
                {t(`pricing.faqQ${i}`, locale)}
              </summary>
              <p className="mt-2 text-caption leading-relaxed text-[var(--color-text-muted)]">
                {t(`pricing.faqA${i}`, locale)}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Villámkérdés — súrlódásmentes kapcsolatfelvétel ── */}
      <section className="mx-5 mb-8 mt-14 lg:mx-14">
        <div className="mx-auto max-w-5xl rounded-2xl bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-text-strong-deep)] px-6 py-10 lg:px-10 lg:py-12">
          <PricingQuickAsk locale={locale} />
        </div>
      </section>
    </main>
  );
}
