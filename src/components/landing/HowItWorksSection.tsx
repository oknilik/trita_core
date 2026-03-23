import type { Locale } from "@/lib/i18n";

const stepsData: Record<
  Locale,
  Array<{ number: string; title: string; desc: string; time: string }>
> = {
  hu: [
    {
      number: "01",
      title: "Meghívod a csapatodat",
      desc: "Egy linket küldesz. Nem kell IT, nem kell telepítés, nem kell egyenként regisztrálni mindenkit. A csapat kap egy emailt és elkezdi.",
      time: "→ 2 perc setup",
    },
    {
      number: "02",
      title: "Mindenki kitölti a felmérést",
      desc: "10–15 perces, tudományosan validált kérdőív. Opcionálisan: egymást is értékelitek – az observer visszajelzés hozhatja a legtöbb meglepetést és megmutatja a fejlesztés irányait.",
      time: "→ 10–15 perc / fő",
    },
    {
      number: "03",
      title: "Látod a teljes csapatképet",
      desc: "Csapat RadarChart, egyéni profilok, önkép vs. mások képe összehasonlítás. Automatikusan értelmezve – nem kell pszichológiai háttér az olvasásához.",
      time: "→ azonnal elérhető",
    },
  ],
  en: [
    {
      number: "01",
      title: "Invite your team",
      desc: "Send a link. No IT, no installation, no individual registration. The team gets an email and gets started.",
      time: "→ 2 min setup",
    },
    {
      number: "02",
      title: "Everyone completes the survey",
      desc: "A 10–15 minute, scientifically validated questionnaire. Optionally: rate each other too — observer feedback often brings the biggest surprises and shows where to improve.",
      time: "→ 10–15 min / person",
    },
    {
      number: "03",
      title: "See the full team picture",
      desc: "Team RadarChart, individual profiles, self vs. others comparison. Automatically interpreted — no psychology background needed to read it.",
      time: "→ available instantly",
    },
  ],
};

const sectionLabelData: Record<Locale, string> = {
  hu: "Hogyan működik",
  en: "How it works",
};

export function HowItWorksSection({ locale }: { locale: Locale }) {
  const steps = stepsData[locale] ?? stepsData.hu;
  const sectionLabel = sectionLabelData[locale] ?? sectionLabelData.hu;

  return (
    <section id="how-it-works" className="border-b border-sand bg-ink px-6 py-12 md:px-16 md:py-20">
      <div className="font-dm-sans mb-12 flex items-center gap-4 text-[11px] uppercase tracking-[2px] text-white/40">
        {sectionLabel}
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-1 gap-[2px] md:grid-cols-3">
        {steps.map((step) => (
          <article
            key={step.number}
            className="border border-white/10 bg-white/[0.03] px-8 py-10 transition-colors hover:bg-white/[0.06]"
          >
            <p className="font-fraunces mb-5 text-[64px] leading-none font-black text-white/[0.07]">
              {step.number}
            </p>
            <h3 className="font-fraunces mb-3 text-[22px] font-bold text-white">{step.title}</h3>
            <p className="text-sm leading-[1.7] text-white/50">{step.desc}</p>
            <p className="font-dm-sans mt-5 text-[11px] text-bronze">{step.time}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
