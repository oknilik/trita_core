import type { Locale } from "@/lib/i18n";

const copy: Record<Locale, { eyebrow: string; heading: string; sub: string }> = {
  hu: {
    eyebrow: "// árazás",
    heading: "Válaszd azt a szintet,\namely most valóban hasznos.",
    sub: "Egyszeri vásárlások és előfizetések — a saját ritmusodban, overcommitment nélkül.",
  },
  en: {
    eyebrow: "// pricing",
    heading: "Choose the level\nthat's actually useful right now.",
    sub: "One-time purchases and subscriptions — at your own pace, without overcommitment.",
  },
};

export function PricingHero({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;
  const [line1, line2] = c.heading.split("\n");

  return (
    <section className="relative overflow-hidden border-b border-[#e8e4dc] bg-[#1a1814] px-6 py-16 lg:px-16 lg:py-20">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c8410a]/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[#c8410a]/8 blur-3xl"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
          {c.eyebrow}
        </p>
        <h1 className="mt-4 font-playfair text-4xl leading-tight text-[#faf9f6] lg:text-[52px]">
          {line1}
          <br />
          {line2}
        </h1>
        <p className="mt-5 max-w-lg text-[15px] leading-[1.75] text-[#faf9f6]/65">
          {c.sub}
        </p>
      </div>
    </section>
  );
}
