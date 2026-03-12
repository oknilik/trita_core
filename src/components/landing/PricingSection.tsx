import Link from "next/link";
import { getPricingAddOns, getPricingPlans } from "@/lib/pricing";
import type { Locale } from "@/lib/i18n";

const copy: Record<
  Locale,
  {
    eyebrow: string;
    heading: string;
    planNameSuffix: string;
    viewAllPlans: string;
    detailedNote: string;
  }
> = {
  hu: {
    eyebrow: "04 — Árazás",
    heading: "Egyszerű árazás.\nNincs meglepetés.",
    planNameSuffix: " csomag",
    viewAllPlans: "Összes csomag megtekintése →",
    detailedNote: "Részletes összehasonlítás és add-on árak külön oldalon",
  },
  en: {
    eyebrow: "04 — Pricing",
    heading: "Simple pricing.\nNo surprises.",
    planNameSuffix: " plan",
    viewAllPlans: "View all plans →",
    detailedNote: "Detailed comparison and add-on pricing on the pricing page",
  },
};

export function PricingSection({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;
  const pricingPlans = getPricingPlans(locale);
  const pricingAddOns = getPricingAddOns(locale);

  const teamPlan = pricingPlans.find((plan) => plan.id === "team") ?? pricingPlans[0];
  const listFeatures = teamPlan.features.slice(0, 5);

  const [headingLine1, headingLine2] = c.heading.split("\n");

  return (
    <section id="pricing" className="border-b border-[#e0ddd6] px-6 py-12 md:px-16 md:py-20">
      <div className="max-w-[800px]">
        <div className="font-ibm-plex-mono mb-4 text-[11px] uppercase tracking-[2px] text-[#5a5650]">
          {c.eyebrow}
        </div>

        <h2 className="font-playfair text-[clamp(28px,7vw,48px)] font-black leading-[1.1] tracking-[-1px] text-[#1a1814] md:tracking-[-1.5px]">
          {headingLine1}
          <br />
          {headingLine2}
        </h2>

        <div className="mt-12 overflow-hidden rounded border border-[#e0ddd6]">
          <div className="flex flex-col items-start justify-between gap-3 bg-[#1a1814] px-6 py-6 text-white md:flex-row md:items-center md:px-10 md:py-8">
            <div>
              <div className="font-playfair text-3xl font-bold md:text-[28px]">
                {teamPlan.name}{c.planNameSuffix}
              </div>
              <div className="mt-1 text-sm opacity-50">{teamPlan.seats}</div>
            </div>
            <div className="font-playfair text-[40px] font-black tracking-[-2px] md:text-[48px]">
              {teamPlan.price}
              <sub className="font-ibm-plex-sans ml-1 text-lg font-light tracking-normal text-white/50">
                {teamPlan.cadence}
              </sub>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-7 bg-white px-6 py-6 md:grid-cols-2 md:gap-10 md:px-10 md:py-10">
            <ul className="flex flex-col gap-3">
              {listFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-[#5a5650]">
                  <span className="text-[13px] font-semibold text-[#1a5c3a]">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex flex-col justify-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex min-h-[52px] items-center justify-center rounded bg-[#c8410a] px-6 text-[15px] font-medium text-white transition-all hover:-translate-y-px hover:bg-[#a33408]"
              >
                {c.viewAllPlans}
              </Link>
              <div className="font-ibm-plex-mono text-[11px] text-[#5a5650]">
                {c.detailedNote}
              </div>
              <p className="text-sm text-[#5a5650]">{teamPlan.valuePromise}</p>
              <ul className="mt-2 flex flex-col gap-2">
                {pricingAddOns.map((extra) => (
                  <li
                    key={extra.label}
                    className="font-ibm-plex-mono border-b border-[#e0ddd6] py-2 text-xs text-[#5a5650]"
                  >
                    {extra.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
