import type { Locale } from "@/lib/i18n";

const copy: Record<
  Locale,
  {
    eyebrow: string;
    heading: string;
    sub: string;
    items: { label: string; price: string; desc: string }[];
  }
> = {
  hu: {
    eyebrow: "// add-onok",
    heading: "Csak amit valóban használsz.",
    sub: "Jelöltértékelés és extra kreditek — fizetsz érte, amikor ténylegesen futtatod.",
    items: [
      {
        label: "1× Jelölt értékelés",
        price: "€39",
        desc: "Egyszeri jelölt felmérés personality profillal",
      },
      {
        label: "5× Jelölt csomag",
        price: "€175",
        desc: "5 jelölt értékelési kredit egy vásárlásban",
      },
      {
        label: "10× Jelölt csomag",
        price: "€299",
        desc: "10 kredit — a legjobb ár per értékelés",
      },
    ],
  },
  en: {
    eyebrow: "// add-ons",
    heading: "Only what you actually use.",
    sub: "Candidate assessments and extra credits — pay when you actually run them.",
    items: [
      {
        label: "1× Candidate assessment",
        price: "€39",
        desc: "One-time candidate assessment with personality profile",
      },
      {
        label: "5× Candidate pack",
        price: "€175",
        desc: "5 candidate assessment credits in one purchase",
      },
      {
        label: "10× Candidate pack",
        price: "€299",
        desc: "10 credits — best price per assessment",
      },
    ],
  },
};

export function AddOns({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;

  return (
    <section className="border-t border-[#e8e4dc] bg-[#faf9f6] px-6 py-12 lg:px-16 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
          {c.eyebrow}
        </p>
        <h2 className="mt-2 font-playfair text-3xl text-[#1a1814] md:text-4xl">
          {c.heading}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-[#5a5650]">{c.sub}</p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {c.items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-[#e8e4dc] bg-white p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#a09a90]">
                {item.label}
              </p>
              <p className="mt-2 font-playfair text-3xl text-[#1a1814]">
                {item.price}
              </p>
              <p className="mt-1.5 text-sm text-[#5a5650]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
