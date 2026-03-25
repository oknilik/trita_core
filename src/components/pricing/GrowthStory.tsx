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
    eyebrow: "Növekedési út",
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
        tier: "€7",
        label: "Self Plus",
        desc: "Facet szint + munkastílus",
        type: "one-time",
      },
      {
        tier: "€12",
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
    eyebrow: "Growth path",
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
        tier: "€7",
        label: "Self Plus",
        desc: "Facet level + work style",
        type: "one-time",
      },
      {
        tier: "€12",
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
  free: "border-sand bg-white text-muted",
  "one-time": "border-sand bg-white text-ink-body",
  subscription: "border-sage/30 bg-sage-ghost text-bronze",
};

export function GrowthStory({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;

  return (
    <section className="border-t border-sand px-6 py-12 lg:px-16 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-px w-4 bg-[#c17f4a]" />
          <span className="text-[9px] font-medium uppercase tracking-[2px] text-[#c17f4a]">{c.eyebrow}</span>
        </div>
        <h2 className="mt-2 font-fraunces text-3xl text-ink md:text-4xl">
          {c.heading}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-ink-body">{c.sub}</p>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {c.steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className={`rounded-xl border p-4 ${typeStyles[step.type] ?? typeStyles["one-time"]}`}
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {step.tier}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-body">{step.desc}</p>
              </div>
              {i < c.steps.length - 1 && (
                <span className="text-sand select-none" aria-hidden="true">
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
