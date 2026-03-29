"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import {
  type BillingMode,
  getPricingAddOns,
  getPricingComparisonRows,
  getPricingDisplayPlans,
  getPricingFaqs,
} from "@/lib/pricing";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function PricingClient({ locale, isLoggedIn = false }: { locale: Locale; isLoggedIn?: boolean }) {
  const [billing, setBilling] = useState<BillingMode>("annual");
  const [showComparison, setShowComparison] = useState(false);

  const trustedLabels = useMemo(
    () => t("pricing.oldTrustedLabels", locale).split("|"),
    [locale],
  );
  const rawDisplayPlans = getPricingDisplayPlans(locale);
  const displayPlans = isLoggedIn
    ? rawDisplayPlans.map((plan) => {
        if (plan.id === "team" || plan.id === "org") {
          return { ...plan, ctaHref: `/billing/checkout?plan=${plan.id}_${billing}` };
        }
        return plan;
      })
    : rawDisplayPlans;
  const addOns = getPricingAddOns(locale);
  const comparisonRows = getPricingComparisonRows(locale);
  const faqs = getPricingFaqs(locale);

  const [heroLine1, heroLine2] = t("pricing.oldHeroHeading", locale).split("\n");

  return (
    <main className="min-h-dvh bg-cream">
      <section className="relative overflow-hidden border-b border-sand bg-ink px-6 py-14 lg:px-16 lg:py-16">
        <div
          className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-sage/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-6xl">
          <p className="font-dm-sans mb-4 text-[11px] uppercase tracking-[2px] text-bronze">
            // pricing
          </p>
          <h1 className="font-fraunces text-4xl leading-tight text-cream lg:text-[56px]">
            {heroLine1}
            <br />
            {heroLine2}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-[1.75] text-cream/75">
            {t("pricing.oldHeroSub", locale)}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex min-h-[48px] items-center justify-center rounded bg-sage px-6 text-sm font-semibold text-white transition-colors hover:bg-sage-dark"
            >
              {t("pricing.oldCtaTryFree", locale)}
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center rounded border border-cream/30 px-6 text-sm font-semibold text-cream transition-colors hover:border-cream/50 hover:bg-white/5"
            >
              {t("pricing.oldCtaDemo", locale)}
            </Link>
          </div>
          <p className="mt-4 text-sm text-cream/55">
            {t("pricing.oldTrialNote", locale)}
          </p>
        </div>
      </section>

      <section className="border-b border-sand px-6 py-7 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2">
          {trustedLabels.map((label) => (
            <span
              key={label}
              className="font-dm-sans rounded-full border border-sand bg-white px-3 py-1 text-[10px] uppercase tracking-[1px] text-ink-body"
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="px-6 py-12 lg:px-16 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-dm-sans text-[11px] uppercase tracking-[2px] text-ink-body">
                Billing
              </p>
              <h2 className="font-fraunces mt-2 text-3xl leading-tight text-ink md:text-[44px]">
                {t("pricing.oldBillingLabel", locale)}
              </h2>
            </div>
            <div className="inline-flex rounded border border-sand bg-white p-1">
              <button
                type="button"
                onClick={() => startTransition(() => setBilling("annual"))}
                className={`min-h-[40px] rounded px-4 text-sm font-semibold transition-colors ${
                  billing === "annual"
                    ? "bg-ink text-white"
                    : "text-ink-body hover:bg-[#f5efe6]"
                }`}
              >
                {t("pricing.oldAnnualBilling", locale)}
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => setBilling("monthly"))}
                className={`min-h-[40px] rounded px-4 text-sm font-semibold transition-colors ${
                  billing === "monthly"
                    ? "bg-ink text-white"
                    : "text-ink-body hover:bg-[#f5efe6]"
                }`}
              >
                {t("pricing.oldMonthlyBilling", locale)}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {displayPlans.map((plan) => {
              const displayPrice = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
              return (
                <article
                  key={plan.id}
                  className={`relative flex flex-col rounded border p-6 ${
                    plan.badge ? "border-sage bg-sage-soft" : "border-sand bg-white"
                  }`}
                >
                  {plan.badge ? (
                    <span className="font-dm-sans absolute -top-3 left-5 rounded-full bg-sage px-3 py-0.5 text-[10px] uppercase tracking-[1px] text-white">
                      {plan.badge}
                    </span>
                  ) : null}

                  <div className="flex-1">
                    <p className="font-dm-sans text-[11px] uppercase tracking-[1px] text-ink-body">
                      {plan.seatLabel}
                    </p>
                    <h3 className="font-fraunces mt-2 text-3xl text-ink">{plan.name}</h3>
                    <p className="mt-2 text-sm text-ink-body">{plan.description}</p>
                    <p className="mt-3 rounded bg-warm px-3 py-2 text-sm leading-[1.55] text-[#5b4a3c]">
                      {plan.valuePromise}
                    </p>

                    <div className="mt-5 border-t border-sand pt-4">
                      <p className="font-fraunces text-[38px] leading-none tracking-[-1px] text-ink">
                        {displayPrice}
                        <span className="font-dm-sans ml-1 text-base font-normal text-ink-body">
                          {plan.cadence}
                        </span>
                      </p>
                    </div>

                    <ul className="mt-5 space-y-2">
                      {plan.highlights.map((feature) => (
                        <li
                          key={feature}
                          className="relative pl-5 text-sm leading-[1.65] text-ink-body before:absolute before:left-0 before:top-[0.8em] before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-bronze"
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.ctaVariant === "primary" ? (
                    <Link
                      href={plan.ctaHref}
                      className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center rounded bg-sage px-5 text-sm font-semibold text-white transition-colors hover:bg-sage-dark"
                    >
                      {plan.ctaLabel}
                    </Link>
                  ) : (
                    <Link
                      href={plan.ctaHref}
                      className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center rounded border border-sage bg-transparent px-5 text-sm font-semibold text-bronze transition-colors hover:bg-sage-soft"
                    >
                      {plan.ctaLabel}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded border border-sand bg-white p-5 md:p-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-dm-sans text-[11px] uppercase tracking-[1px] text-bronze">
                  {t("pricing.oldComparisonEyebrow", locale)}
                </p>
                <p className="mt-1 text-sm text-ink-body">
                  {t("pricing.oldComparisonSub", locale)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startTransition(() => setShowComparison((prev) => !prev))}
                className="inline-flex min-h-[44px] items-center justify-center rounded border border-sage px-4 text-sm font-semibold text-bronze transition-colors hover:bg-sage-soft"
              >
                {showComparison ? t("pricing.oldCloseComparison", locale) : t("pricing.oldShowComparison", locale)}
              </button>
            </div>

            {showComparison ? (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-[640px] w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-sand text-left">
                      <th className="py-2 pr-4 font-medium text-ink-body">{t("pricing.oldFeatureHeader", locale)}</th>
                      <th className="py-2 pr-4 font-medium text-ink">Team</th>
                      <th className="py-2 pr-4 font-medium text-ink">Org</th>
                      <th className="py-2 font-medium text-ink">Scale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.label} className="border-b border-[#f1eee7]">
                        <td className="py-3 pr-4 text-ink-body">{row.label}</td>
                        <td className="py-3 pr-4 text-ink">{row.team}</td>
                        <td className="py-3 pr-4 text-ink">{row.org}</td>
                        <td className="py-3 text-ink">{row.scale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded border border-sand bg-white p-5 md:p-7">
            <p className="font-dm-sans mb-3 text-[11px] uppercase tracking-[1px] text-bronze">
              {t("pricing.oldAddOnsLabel", locale)}
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {addOns.map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="font-dm-sans text-[10px] uppercase tracking-[1px] text-muted-warm">
                    {item.label}
                  </span>
                  <span className="text-sm font-medium text-ink">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-sand bg-warm px-6 py-12 lg:px-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-dm-sans text-[11px] uppercase tracking-[2px] text-ink-body">
              Scale rollout
            </p>
            <h2 className="font-fraunces mt-2 text-3xl leading-tight text-ink md:text-[42px]">
              {t("pricing.oldScaleHeading", locale)}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-[1.7] text-ink-body">
              {t("pricing.oldScaleDesc", locale)}
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] items-center justify-center rounded bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2a2722]"
          >
            {t("pricing.oldGetInTouch", locale)}
          </Link>
        </div>
      </section>

      <section className="px-6 py-12 lg:px-16 lg:py-14">
        <div className="mx-auto max-w-4xl">
          <p className="font-dm-sans text-[11px] uppercase tracking-[2px] text-ink-body">
            FAQ
          </p>
          <h2 className="font-fraunces mt-2 text-3xl text-ink md:text-[42px]">
            {t("pricing.oldFaqHeading", locale)}
          </h2>

          <div className="mt-6 space-y-3">
            {faqs.map((item) => (
              <details key={item.question} className="group rounded border border-sand bg-white p-4">
                <summary className="cursor-pointer list-none pr-6 text-[15px] font-semibold text-ink marker:content-none">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm leading-[1.65] text-ink-body">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="-mb-16 bg-sage px-6 py-16 md:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <h2 className="font-fraunces text-4xl leading-tight text-white md:text-[48px]">
            {t("pricing.oldBottomHeading", locale)}
          </h2>
          <Link
            href="/sign-up"
            className="inline-flex min-h-[52px] items-center justify-center rounded bg-white px-8 text-sm font-semibold text-bronze transition-colors hover:bg-[#f7eee8]"
          >
            {t("pricing.oldTryNow", locale)}
          </Link>
        </div>
      </section>
    </main>
  );
}
