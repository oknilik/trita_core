import type { Locale } from "@/lib/i18n";

const painItemsData: Record<
  Locale,
  Array<{ title: string; desc: string; tag: string }>
> = {
  hu: [
    {
      title: "Rossz felvétel",
      desc: "Egy elhibázott felvétel nem csak pénzbe kerül. Szétrombolhatja azt a csapatdinamikát, amit hónapok alatt építettek fel.",
      tag: "3–6 havi bér",
    },
    {
      title: "Rejtett csapatkonfiktus",
      desc: "Két kollégád nem tud együtt dolgozni. Mindenki látja, de senki nem érti a forrását. A projekt csúszik, a megbeszélések feszültek. A dinamika láthatatlan, de mérhető.",
      tag: "-30% produktivitás",
    },
    {
      title: "Váratlan lemorzsolódás",
      desc: "A legjobb emberek sem maradnak rossz szerepben. Ha valaki elmegy, az ritkán szól a pénzről – sokszor inkább arról, hogy soha nem voltak a helyükön.",
      tag: "50–200% éves bér",
    },
  ],
  en: [
    {
      title: "Bad hire",
      desc: "A bad hire isn't just costly. It can destroy the team dynamics built up over months.",
      tag: "3–6 months salary",
    },
    {
      title: "Hidden team conflict",
      desc: "Two colleagues can't work together. Everyone sees it, but no one understands the root cause. Projects slip, meetings are tense. The dynamic is invisible — but measurable.",
      tag: "-30% productivity",
    },
    {
      title: "Unexpected churn",
      desc: "Your best people don't stay in the wrong role. When someone leaves, it's rarely about money — it's usually that they were never in the right place.",
      tag: "50–200% annual salary",
    },
  ],
};

const sectionLabelData: Record<Locale, string> = {
  hu: "A valódi probléma",
  en: "The real problem",
};

export function PainSection({ locale }: { locale: Locale }) {
  const painItems = painItemsData[locale] ?? painItemsData.hu;
  const sectionLabel = sectionLabelData[locale] ?? sectionLabelData.hu;

  return (
    <section className="grid grid-cols-1 border-b border-[#e0ddd6] md:grid-cols-[240px_1fr]">
      <aside className="flex items-center gap-4 border-b border-[#e0ddd6] bg-[#f0ede6] px-6 py-6 md:block md:border-b-0 md:border-r md:px-10 md:py-[60px]">
        <div className="font-playfair text-5xl leading-none font-black text-[#e0ddd6] md:mb-4 md:text-[80px]">01</div>
        <div className="font-ibm-plex-mono text-[11px] uppercase tracking-[2px] text-[#5a5650]">
          {sectionLabel}
        </div>
      </aside>

      <div className="px-6 py-6 md:px-16 md:py-[60px]">
        <div className="flex flex-col">
          {painItems.map((item, index) => (
            <article
              key={item.title}
              className={`group grid grid-cols-1 gap-3 py-7 md:grid-cols-[1fr_auto] md:gap-6 ${index < painItems.length - 1 ? "border-b border-[#e0ddd6]" : ""}`}
            >
              <div>
                <h3 className="font-playfair mb-2 text-[22px] leading-[1.2] font-bold text-[#1a1814]">
                  {item.title}
                </h3>
                <p className="max-w-[520px] text-sm leading-[1.7] text-[#5a5650]">{item.desc}</p>
              </div>
              <div className="font-ibm-plex-mono h-fit w-fit rounded-sm bg-[#fef3ec] px-3 py-1.5 text-[11px] text-[#c8410a]">
                {item.tag}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
