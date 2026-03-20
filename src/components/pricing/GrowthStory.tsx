import type { Locale } from "@/lib/i18n";

const copy: Record<
  Locale,
  {
    eyebrow: string;
    heading: string;
    sub: string;
    steps: { tier: string; label: string; desc: string; type: string }[];
  }
> = {
  hu: {
    eyebrow: "// növekedési út",
    heading: "Mindenki ugyanonnan indul.",
    sub: "Kezdd önismerettel, folytasd csapatszinten — ha és amikor valóban szükséged van rá.",
    steps: [
      {
        tier: "Ingyenes",
        label: "Self Start",
        desc: "Teszt + dimenzió szintű profil",
        type: "free",
      },
      {
        tier: "€49",
        label: "Self Plus",
        desc: "Facet szint + munkastílus",
        type: "one-time",
      },
      {
        tier: "€89",
        label: "Self Reflect",
        desc: "Observer visszajelzés + check-in",
        type: "one-time",
      },
      {
        tier: "€490",
        label: "Team Scan",
        desc: "Csapatmintázat + heatmap",
        type: "one-time",
      },
      {
        tier: "€990",
        label: "Team Deep Dive",
        desc: "Mély elemzés + tanácsadás",
        type: "one-time",
      },
      {
        tier: "€49/hó",
        label: "Org előfizetés",
        desc: "Folyamatos szervezeti láthatóság",
        type: "subscription",
      },
    ],
  },
  en: {
    eyebrow: "// growth path",
    heading: "Everyone starts from the same place.",
    sub: "Begin with self-awareness, grow to team level — if and when you truly need it.",
    steps: [
      {
        tier: "Free",
        label: "Self Start",
        desc: "Assessment + dimension-level profile",
        type: "free",
      },
      {
        tier: "€49",
        label: "Self Plus",
        desc: "Facet level + work style",
        type: "one-time",
      },
      {
        tier: "€89",
        label: "Self Reflect",
        desc: "Observer feedback + check-in",
        type: "one-time",
      },
      {
        tier: "€490",
        label: "Team Scan",
        desc: "Team pattern + heatmap",
        type: "one-time",
      },
      {
        tier: "€990",
        label: "Team Deep Dive",
        desc: "Deep analysis + advisory",
        type: "one-time",
      },
      {
        tier: "€49/mo",
        label: "Org subscription",
        desc: "Continuous org visibility",
        type: "subscription",
      },
    ],
  },
};

const typeStyles: Record<string, string> = {
  free: "border-[#e8e4dc] bg-white text-[#a09a90]",
  "one-time": "border-[#e8e4dc] bg-white text-[#3d3a35]",
  subscription: "border-[#c8410a]/30 bg-[#fff5f0] text-[#c8410a]",
};

export function GrowthStory({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;

  return (
    <section className="border-t border-[#e8e4dc] px-6 py-12 lg:px-16 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
          {c.eyebrow}
        </p>
        <h2 className="mt-2 font-playfair text-3xl text-[#1a1814] md:text-4xl">
          {c.heading}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-[#5a5650]">{c.sub}</p>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {c.steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className={`rounded-xl border p-4 ${typeStyles[step.type] ?? typeStyles["one-time"]}`}
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#a09a90]">
                  {step.tier}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#1a1814]">
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] text-[#5a5650]">{step.desc}</p>
              </div>
              {i < c.steps.length - 1 && (
                <span className="text-[#e8e4dc] select-none" aria-hidden="true">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
