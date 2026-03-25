import type { Locale } from "@/lib/i18n";

const copy: Record<Locale, { eyebrow: string; heading: string; headingEm: string; sub: string }> = {
  hu: {
    eyebrow: "Árazás",
    heading: "Válaszd azt a szintet, amely most valóban ",
    headingEm: "hasznos.",
    sub: "Egyszeri vásárlások és előfizetések — a saját ritmusodban, elköteleződés nélkül.",
  },
  en: {
    eyebrow: "Pricing",
    heading: "Choose the level that's actually useful ",
    headingEm: "right now.",
    sub: "One-time purchases and subscriptions — at your own pace, no long-term commitment.",
  },
};

export function PricingHero({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;

  return (
    <section className="px-5 pb-8 pt-10 lg:px-14 lg:pt-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-px w-4 bg-[#c17f4a]" />
          <span className="text-[9px] font-medium uppercase tracking-[2px] text-[#c17f4a]">
            {c.eyebrow}
          </span>
        </div>
        <h1 className="mb-2 font-fraunces text-[24px] leading-[1.12] tracking-tight text-[#1a1a2e] lg:text-[34px]">
          {c.heading}<em className="not-italic text-[#c17f4a]">{c.headingEm}</em>
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-[#8a8a9a]">
          {c.sub}
        </p>
      </div>
    </section>
  );
}
