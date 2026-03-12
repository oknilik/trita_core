import Link from "next/link";
import type { Locale } from "@/lib/i18n";

const copy: Record<
  Locale,
  {
    badge: string;
    heading: string;
    body: string;
    points: Array<{ title: string; body: string }>;
    linkText: string;
    chartEyebrow: string;
    dimensions: Array<{ name: string; value: number }>;
    insightLabel: string;
    insightText: string;
  }
> = {
  hu: {
    badge: "✓ Tudományos alap",
    heading: "Nem quiz.\nPszichometria.",
    body: "A trita egy validált, többdimenziós személyiségmodellre épül - nem önismereti kvíz, hanem döntéstámogató eszköz, amelyet szervezetpszichológiai kutatás alapoz meg.",
    points: [
      {
        title: "Kutatás alapú modell",
        body: "nem marketing, hanem pszichológiai irodalomra épített, peer-reviewed alapokon nyugvó mérőeszköz.",
      },
      {
        title: "Observer feedback",
        body: "az önkép és a mások által látott kép különbsége a legértékesebb adat. Ez az, amit más HR toolok nem mérnek.",
      },
      {
        title: "Több dimenzió egyszerre",
        body: "nem egyetlen skála, hanem egymással összefüggő jellemzők kombinációja adja a valódi csapatképet.",
      },
    ],
    linkText: "A módszertanról bővebben →",
    chartEyebrow: "Példa csapatprofil – Marketing osztály",
    dimensions: [
      { name: "Nyitottság", value: 82 },
      { name: "Érzelmi stabilitás", value: 65 },
      { name: "Extravertáltság", value: 71 },
      { name: "Együttműködés", value: 44 },
      { name: "Lelkiismeretesség", value: 88 },
      { name: "Becsületesség", value: 76 },
    ],
    insightLabel: "CSAPAT INSIGHT",
    insightText:
      "Magas Lelkiismeretesség + alacsony Együttműködés: erős executer profil, de döntési feszültség valószínű a csapatnál.",
  },
  en: {
    badge: "✓ Scientific basis",
    heading: "Not a quiz.\nPsychometrics.",
    body: "trita is built on a validated, multidimensional personality model — not a self-awareness quiz, but a decision-support tool grounded in organizational psychology research.",
    points: [
      {
        title: "Research-based model",
        body: "not marketing, but a measurement tool built on psychological literature and peer-reviewed foundations.",
      },
      {
        title: "Observer feedback",
        body: "the difference between self-image and how others see you is the most valuable data. This is what other HR tools don't measure.",
      },
      {
        title: "Multiple dimensions at once",
        body: "not a single scale, but the combination of interconnected traits gives the real team picture.",
      },
    ],
    linkText: "Learn more about the methodology →",
    chartEyebrow: "Sample team profile – Marketing department",
    dimensions: [
      { name: "Openness", value: 82 },
      { name: "Emot. stability", value: 65 },
      { name: "Extraversion", value: 71 },
      { name: "Agreeableness", value: 44 },
      { name: "Conscientiousness", value: 88 },
      { name: "Integrity", value: 76 },
    ],
    insightLabel: "TEAM INSIGHT",
    insightText:
      "High Conscientiousness + low Agreeableness: strong executor profile, but decision tension likely within the team.",
  },
};

export function ScienceSection({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;
  const [headingLine1, headingLine2] = c.heading.split("\n");

  return (
    <section id="science" className="grid grid-cols-1 border-b border-[#e0ddd6] md:grid-cols-2">
      <div className="border-b border-[#e0ddd6] px-6 py-12 md:border-b-0 md:border-r md:px-16 md:py-20">
        <div className="font-ibm-plex-mono mb-8 inline-flex items-center gap-2 rounded-sm border border-[#1a5c3a]/20 bg-[#edf7f2] px-[14px] py-1.5 text-[11px] text-[#1a5c3a]">
          {c.badge}
        </div>

        <h2 className="font-playfair mb-6 text-[clamp(28px,7vw,48px)] font-black leading-[1.1] tracking-[-1px] text-[#1a1814] md:tracking-[-1.5px]">
          {headingLine1}
          <br />
          {headingLine2}
        </h2>

        <p className="mb-6 text-[15px] leading-[1.7] text-[#5a5650]">
          {c.body}
        </p>

        <div className="mt-8 flex flex-col gap-5">
          {c.points.map((item, idx) => (
            <div key={item.title} className={`flex gap-4 pb-5 ${idx < c.points.length - 1 ? "border-b border-[#e0ddd6]" : ""}`}>
              <div className="min-w-6 text-lg text-[#1a5c3a]">○</div>
              <p className="text-sm leading-[1.7] text-[#5a5650]">
                <strong className="font-semibold text-[#1a1814]">{item.title}</strong> — {item.body}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/science"
          className="mt-7 inline-flex items-center gap-2 text-[13px] font-medium text-[#c8410a] hover:opacity-90"
        >
          {c.linkText}
        </Link>
      </div>

      <div className="bg-[#edf7f2] px-6 py-12 md:px-16 md:py-20">
        <div className="font-ibm-plex-mono mb-6 text-[11px] uppercase tracking-[1px] text-[#1a5c3a]">
          {c.chartEyebrow}
        </div>

        <div className="flex flex-col gap-3">
          {c.dimensions.map((dim) => (
            <div key={dim.name} className="flex items-center justify-between rounded border border-[#1a5c3a]/10 bg-white px-4 py-3.5">
              <div className="text-sm font-medium text-[#1a1814]">{dim.name}</div>
              <div className="flex items-center gap-3">
                <div className="h-1 w-20 overflow-hidden rounded bg-[#1a5c3a]/10">
                  <div className="h-full rounded bg-[#1a5c3a]" style={{ width: `${dim.value}%` }} />
                </div>
                <div className="font-ibm-plex-mono w-7 text-right text-xs text-[#1a5c3a]">{dim.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded border-l-[3px] border-l-[#1a5c3a] bg-white p-4">
          <div className="font-ibm-plex-mono mb-1.5 text-[10px] text-[#1a5c3a]">{c.insightLabel}</div>
          <div className="text-[13px] leading-[1.6] text-[#5a5650]">
            {c.insightText}
          </div>
        </div>
      </div>
    </section>
  );
}
