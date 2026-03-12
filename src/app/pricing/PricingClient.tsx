"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import {
  type BillingMode,
  getPricingAddOns,
  getPricingComparisonRows,
  getPricingDisplayPlans,
  getPricingFaqs,
} from "@/lib/pricing";
import type { Locale } from "@/lib/i18n";

const trustedLabelsData: Record<Locale, string[]> = {
  hu: ["KKV csapatok", "Agency vezetők", "Scaleup menedzsment", "People ops"],
  en: ["SMB teams", "Agency leads", "Scaleup management", "People ops"],
};

const copy: Record<
  Locale,
  {
    heroHeading: string;
    heroSub: string;
    ctaTryFree: string;
    ctaDemo: string;
    trialNote: string;
    billingLabel: string;
    annualBilling: string;
    monthlyBilling: string;
    comparisonEyebrow: string;
    comparisonSub: string;
    closeComparison: string;
    showComparison: string;
    featureHeader: string;
    addOnsLabel: string;
    scaleHeading: string;
    scaleDesc: string;
    getInTouch: string;
    faqHeading: string;
    bottomHeading: string;
    tryNow: string;
  }
> = {
  hu: {
    heroHeading: "Világos árazás.\nTiszta döntési helyzet.",
    heroSub:
      "Úgy van felépítve, hogy ne csak egy új tool legyen, hanem gyorsabban lásd, hol éri meg beavatkozni a csapatműködésben.",
    ctaTryFree: "Kipróbálom ingyen",
    ctaDemo: "Demo egyeztetés",
    trialNote: "14 napos próbaidőszak • Kártyaadat nélkül • Bármikor lemondható",
    billingLabel: "Válassz csomagot a csapat szintjéhez.",
    annualBilling: "Éves számlázás",
    monthlyBilling: "Havi számlázás",
    comparisonEyebrow: "Összehasonlítás",
    comparisonSub: "Nézd meg egyben, melyik szinten mit kapsz.",
    closeComparison: "Összehasonlítás bezárása",
    showComparison: "Teljes összehasonlítás mutatása",
    featureHeader: "Funkció",
    addOnsLabel: "Add-onok",
    scaleHeading: "Egyedi bevezetés nagyobb szervezeteknek.",
    scaleDesc:
      "Ha már több csapat és összetettebb bevezetési igény van, egyedi kerettel indulunk: ütemezés, onboarding terv, támogatási szint.",
    getInTouch: "Kapcsolatfelvétel",
    faqHeading: "Gyakori kérdések",
    bottomHeading: "Kezdjük el a csapatoddal.",
    tryNow: "Kipróbálom most",
  },
  en: {
    heroHeading: "Clear pricing.\nClear decision.",
    heroSub:
      "Built so you can see where it's worth intervening in team dynamics — not just another tool on the stack.",
    ctaTryFree: "Try for free",
    ctaDemo: "Schedule a demo",
    trialNote: "14-day trial • No credit card • Cancel anytime",
    billingLabel: "Choose a plan for your team's stage.",
    annualBilling: "Annual billing",
    monthlyBilling: "Monthly billing",
    comparisonEyebrow: "Comparison",
    comparisonSub: "See at a glance what each tier includes.",
    closeComparison: "Close comparison",
    showComparison: "Show full comparison",
    featureHeader: "Feature",
    addOnsLabel: "Add-ons",
    scaleHeading: "Custom rollout for larger organizations.",
    scaleDesc:
      "If you have multiple teams and a more complex deployment need, we start with a custom framework: timeline, onboarding plan, support level.",
    getInTouch: "Get in touch",
    faqHeading: "Frequently asked questions",
    bottomHeading: "Let's start with your team.",
    tryNow: "Try it now",
  },
};

export function PricingClient({ locale }: { locale: Locale }) {
  const [billing, setBilling] = useState<BillingMode>("annual");
  const [showComparison, setShowComparison] = useState(false);

  const c = copy[locale] ?? copy.hu;
  const trustedLabels = trustedLabelsData[locale] ?? trustedLabelsData.hu;
  const displayPlans = getPricingDisplayPlans(locale);
  const addOns = getPricingAddOns(locale);
  const comparisonRows = getPricingComparisonRows(locale);
  const faqs = getPricingFaqs(locale);

  const [heroLine1, heroLine2] = c.heroHeading.split("\n");

  return (
    <main className="min-h-dvh bg-[#faf9f6]">
      <section className="relative overflow-hidden border-b border-[#e8e4dc] bg-[#1a1814] px-6 py-14 lg:px-16 lg:py-16">
        <div
          className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-[#c8410a]/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-6xl">
          <p className="font-ibm-plex-mono mb-4 text-[11px] uppercase tracking-[2px] text-[#c8410a]">
            // pricing
          </p>
          <h1 className="font-playfair text-4xl leading-tight text-[#faf9f6] lg:text-[56px]">
            {heroLine1}
            <br />
            {heroLine2}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-[1.75] text-[#faf9f6]/75">
            {c.heroSub}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex min-h-[48px] items-center justify-center rounded bg-[#c8410a] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#a8340a]"
            >
              {c.ctaTryFree}
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] items-center justify-center rounded border border-[#faf9f6]/30 px-6 text-sm font-semibold text-[#faf9f6] transition-colors hover:border-[#faf9f6]/50 hover:bg-white/5"
            >
              {c.ctaDemo}
            </Link>
          </div>
          <p className="mt-4 text-sm text-[#faf9f6]/55">
            {c.trialNote}
          </p>
        </div>
      </section>

      <section className="border-b border-[#e8e4dc] px-6 py-7 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2">
          {trustedLabels.map((label) => (
            <span
              key={label}
              className="font-ibm-plex-mono rounded-full border border-[#e8e4dc] bg-white px-3 py-1 text-[10px] uppercase tracking-[1px] text-[#5a5650]"
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
              <p className="font-ibm-plex-mono text-[11px] uppercase tracking-[2px] text-[#5a5650]">
                Billing
              </p>
              <h2 className="font-playfair mt-2 text-3xl leading-tight text-[#1a1814] md:text-[44px]">
                {c.billingLabel}
              </h2>
            </div>
            <div className="inline-flex rounded border border-[#e8e4dc] bg-white p-1">
              <button
                type="button"
                onClick={() => startTransition(() => setBilling("annual"))}
                className={`min-h-[40px] rounded px-4 text-sm font-semibold transition-colors ${
                  billing === "annual"
                    ? "bg-[#1a1814] text-white"
                    : "text-[#3d3a35] hover:bg-[#f5efe6]"
                }`}
              >
                {c.annualBilling}
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => setBilling("monthly"))}
                className={`min-h-[40px] rounded px-4 text-sm font-semibold transition-colors ${
                  billing === "monthly"
                    ? "bg-[#1a1814] text-white"
                    : "text-[#3d3a35] hover:bg-[#f5efe6]"
                }`}
              >
                {c.monthlyBilling}
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
                    plan.badge ? "border-[#c8410a] bg-[#fef3ec]" : "border-[#e8e4dc] bg-white"
                  }`}
                >
                  {plan.badge ? (
                    <span className="font-ibm-plex-mono absolute -top-3 left-5 rounded-full bg-[#c8410a] px-3 py-0.5 text-[10px] uppercase tracking-[1px] text-white">
                      {plan.badge}
                    </span>
                  ) : null}

                  <div className="flex-1">
                    <p className="font-ibm-plex-mono text-[11px] uppercase tracking-[1px] text-[#5a5650]">
                      {plan.seatLabel}
                    </p>
                    <h3 className="font-playfair mt-2 text-3xl text-[#1a1814]">{plan.name}</h3>
                    <p className="mt-2 text-sm text-[#3d3a35]">{plan.description}</p>
                    <p className="mt-3 rounded bg-[#f3eee4] px-3 py-2 text-sm leading-[1.55] text-[#5b4a3c]">
                      {plan.valuePromise}
                    </p>

                    <div className="mt-5 border-t border-[#e8e4dc] pt-4">
                      <p className="font-playfair text-[38px] leading-none tracking-[-1px] text-[#1a1814]">
                        {displayPrice}
                        <span className="font-ibm-plex-sans ml-1 text-base font-normal text-[#5a5650]">
                          {plan.cadence}
                        </span>
                      </p>
                    </div>

                    <ul className="mt-5 space-y-2">
                      {plan.highlights.map((feature) => (
                        <li
                          key={feature}
                          className="relative pl-5 text-sm leading-[1.65] text-[#3d3a35] before:absolute before:left-0 before:top-[0.8em] before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-[#c8410a]"
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.ctaVariant === "primary" ? (
                    <Link
                      href={plan.ctaHref}
                      className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center rounded bg-[#c8410a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#a8340a]"
                    >
                      {plan.ctaLabel}
                    </Link>
                  ) : (
                    <Link
                      href={plan.ctaHref}
                      className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center rounded border border-[#c8410a] bg-transparent px-5 text-sm font-semibold text-[#c8410a] transition-colors hover:bg-[#fef3ec]"
                    >
                      {plan.ctaLabel}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded border border-[#e8e4dc] bg-white p-5 md:p-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-ibm-plex-mono text-[11px] uppercase tracking-[1px] text-[#c8410a]">
                  {c.comparisonEyebrow}
                </p>
                <p className="mt-1 text-sm text-[#3d3a35]">
                  {c.comparisonSub}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startTransition(() => setShowComparison((prev) => !prev))}
                className="inline-flex min-h-[44px] items-center justify-center rounded border border-[#c8410a] px-4 text-sm font-semibold text-[#c8410a] transition-colors hover:bg-[#fef3ec]"
              >
                {showComparison ? c.closeComparison : c.showComparison}
              </button>
            </div>

            {showComparison ? (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-[640px] w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#e8e4dc] text-left">
                      <th className="py-2 pr-4 font-medium text-[#5a5650]">{c.featureHeader}</th>
                      <th className="py-2 pr-4 font-medium text-[#1a1814]">Team</th>
                      <th className="py-2 pr-4 font-medium text-[#1a1814]">Org</th>
                      <th className="py-2 font-medium text-[#1a1814]">Scale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.label} className="border-b border-[#f1eee7]">
                        <td className="py-3 pr-4 text-[#5a5650]">{row.label}</td>
                        <td className="py-3 pr-4 text-[#1a1814]">{row.team}</td>
                        <td className="py-3 pr-4 text-[#1a1814]">{row.org}</td>
                        <td className="py-3 text-[#1a1814]">{row.scale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded border border-[#e8e4dc] bg-white p-5 md:p-7">
            <p className="font-ibm-plex-mono mb-3 text-[11px] uppercase tracking-[1px] text-[#c8410a]">
              {c.addOnsLabel}
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {addOns.map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <span className="font-ibm-plex-mono text-[10px] uppercase tracking-[1px] text-[#a09c96]">
                    {item.label}
                  </span>
                  <span className="text-sm font-medium text-[#1a1814]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e8e4dc] bg-[#f3eee4] px-6 py-12 lg:px-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-ibm-plex-mono text-[11px] uppercase tracking-[2px] text-[#5a5650]">
              Scale rollout
            </p>
            <h2 className="font-playfair mt-2 text-3xl leading-tight text-[#1a1814] md:text-[42px]">
              {c.scaleHeading}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-[1.7] text-[#3d3a35]">
              {c.scaleDesc}
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] items-center justify-center rounded bg-[#1a1814] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2a2722]"
          >
            {c.getInTouch}
          </Link>
        </div>
      </section>

      <section className="px-6 py-12 lg:px-16 lg:py-14">
        <div className="mx-auto max-w-4xl">
          <p className="font-ibm-plex-mono text-[11px] uppercase tracking-[2px] text-[#5a5650]">
            FAQ
          </p>
          <h2 className="font-playfair mt-2 text-3xl text-[#1a1814] md:text-[42px]">
            {c.faqHeading}
          </h2>

          <div className="mt-6 space-y-3">
            {faqs.map((item) => (
              <details key={item.question} className="group rounded border border-[#e8e4dc] bg-white p-4">
                <summary className="cursor-pointer list-none pr-6 text-[15px] font-semibold text-[#1a1814] marker:content-none">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm leading-[1.65] text-[#3d3a35]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="-mb-16 bg-[#c8410a] px-6 py-16 md:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <h2 className="font-playfair text-4xl leading-tight text-white md:text-[48px]">
            {c.bottomHeading}
          </h2>
          <Link
            href="/sign-up"
            className="inline-flex min-h-[52px] items-center justify-center rounded bg-white px-8 text-sm font-semibold text-[#c8410a] transition-colors hover:bg-[#f7eee8]"
          >
            {c.tryNow}
          </Link>
        </div>
      </section>
    </main>
  );
}
