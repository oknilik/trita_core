"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

const faqs: Record<Locale, { q: string; a: string }[]> = {
  hu: [
    {
      q: "Mi a különbség az egyszeri vásárlás és az előfizetés között?",
      a: "Az egyszeri vásárlások (Self Plus, Self Reflect, Team Scan, Team Deep Dive) örökre aktiválódnak — nincs lejárat, nincs havidíj. Az előfizetés folyamatos szervezeti hozzáférést ad, és havi vagy éves számlázással működik.",
    },
    {
      q: "Hogyan működik a csapatfelmérés vásárlása?",
      a: "A Team Scan vagy Team Deep Dive csomag egy adott csapathoz kötött. Vásárlás után a csapat dashboardján válik elérhetővé az elemzés.",
    },
    {
      q: "A Team Deep Dive-ba beépített tanácsadói konzultáció hogyan zajlik?",
      a: "A vásárlás után egyeztetünk az időpontról. A 90 perces session a csapateredmények alapján, személyre szabottan történik.",
    },
    {
      q: "Van éves kedvezmény az előfizetésnél?",
      a: "Igen. Éves számlázásnál kedvezőbb havi díjat kapsz, mint havi számlázásnál.",
    },
    {
      q: "Mi az a Self Start?",
      a: "A Self Start az ingyenes szint: személyiségtesztet tölthetsz ki, dimenzió szintű eredményeket látsz, és 2 observer meghívót küldhetsz. Fizetős csomag nélkül is elérhető.",
    },
    {
      q: "Milyen fizetési módokat fogadtok el?",
      a: "Bankkártyát (Visa, Mastercard, Amex) és SEPA átutalást — a Stripe biztonságos fizetési felületén keresztül.",
    },
  ],
  en: [
    {
      q: "What's the difference between a one-time purchase and a subscription?",
      a: "One-time purchases (Self Plus, Self Reflect, Team Scan, Team Deep Dive) are activated permanently — no expiry, no monthly fee. Subscriptions provide continuous organizational access, billed monthly or annually.",
    },
    {
      q: "How does buying a team assessment work?",
      a: "Team Scan and Team Deep Dive are tied to a specific team. After purchase, the analysis becomes available on the team's dashboard.",
    },
    {
      q: "How does the built-in advisory consultation work in Team Deep Dive?",
      a: "After purchase, we'll coordinate a time for the session. The 90-minute session is tailored to your team's specific results.",
    },
    {
      q: "Is there an annual discount on subscriptions?",
      a: "Yes. Annual billing gives you a lower monthly rate compared to monthly billing.",
    },
    {
      q: "What is Self Start?",
      a: "Self Start is the free tier: you can complete a personality assessment, see dimension-level results, and send up to 2 observer invitations — no purchase required.",
    },
    {
      q: "What payment methods do you accept?",
      a: "Credit cards (Visa, Mastercard, Amex) and SEPA bank transfers — through Stripe's secure payment interface.",
    },
  ],
};

export function PricingFAQ({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState<number | null>(null);
  const items = faqs[locale] ?? faqs.hu;
  const heading = locale === "hu" ? "Gyakori kérdések" : "Frequently asked questions";
  const eyebrow = "FAQ";

  return (
    <section className="border-t border-[#e8e0d3] px-6 py-12 lg:px-16 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-px w-4 bg-[#c17f4a]" />
          <span className="text-[9px] font-medium uppercase tracking-[2px] text-[#c17f4a]">{eyebrow}</span>
        </div>
        <h2 className="mt-2 font-fraunces text-3xl text-ink md:text-4xl">
          {heading}
        </h2>

        <div className="mt-8 space-y-2">
          {items.map((item, i) => (
            <div
              key={item.q}
              className="rounded-xl border border-sand bg-white overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left min-h-[44px]"
                aria-expanded={open === i}
              >
                <span className="text-[15px] font-semibold text-ink">
                  {item.q}
                </span>
                <span
                  className={`shrink-0 text-bronze transition-transform duration-200 ${
                    open === i ? "rotate-45" : ""
                  }`}
                  aria-hidden="true"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                </span>
              </button>
              {open === i && (
                <div className="border-t border-sand px-5 pb-4 pt-3">
                  <p className="text-sm leading-[1.7] text-ink-body">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
