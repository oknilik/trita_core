"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";

const copy: Record<
  Locale,
  {
    eyebrow: string;
    heading: string;
    sub: string;
    cta: string;
    mockCardHeader: string;
    insightCards: Array<{ tone: "accent" | "green" | "purple"; title: string; body: string }>;
    legendSelf: string;
    legendObserver: string;
    quote: string;
    quoteAttribution: string;
    foundingTitle: string;
    foundingSub: string;
    spotsLeft: string;
    radarLabels: [string, string, string, string, string, string];
  }
> = {
  hu: {
    eyebrow: "Csapatintelligencia platform",
    heading: "Lásd tisztábban a csapatod működését",
    sub: "A trita megmutatja, ami eddig láthatatlan volt - a csapatod valódi dinamikáját. Mielőtt a feszültség konfliktussá, a konfliktus pedig költséggé válik.",
    cta: "Megnézem a csapatomat →",
    mockCardHeader: "CSAPAT PROFIL — Sales (6 fő)",
    insightCards: [
      { tone: "accent", title: "⚠ FESZÜLTSÉG", body: "Döntéshozatalnál konfliktus valószínű - 3 fő eltérő stílus" },
      { tone: "green", title: "✓ ERŐSSÉG", body: "Magas megbízhatóság, határidők tartása erős" },
      { tone: "purple", title: "◎ SELF VS OBSERVER", body: "2 tag önképe jelentősen eltér mások visszajelzésétől" },
    ],
    legendSelf: "önkép",
    legendObserver: "observer",
    quote: "\"48 óra alatt többet tudtam meg a csapatomról, mint az előző két évben.\"",
    quoteAttribution: "— Pilot tesztelő, 12 fős tech csapat",
    foundingTitle: "Csatlakozz az első 10 cég közé",
    foundingSub: "Személyes onboarding + founding ár az első évre",
    spotsLeft: "3 hely maradt",
    radarLabels: ["Nyitottság", "Lelkiis.", "Extrav.", "Egym.", "Becsül.", "Érz. st."],
  },
  en: {
    eyebrow: "Team intelligence platform",
    heading: "See your team's dynamics more clearly",
    sub: "trita shows what's been invisible — your team's real dynamics. Before tension becomes conflict, and conflict becomes cost.",
    cta: "See my team →",
    mockCardHeader: "TEAM PROFILE — Sales (6 members)",
    insightCards: [
      { tone: "accent", title: "⚠ TENSION", body: "Conflict likely at decision-making — 3 members with different styles" },
      { tone: "green", title: "✓ STRENGTH", body: "High reliability, strong on deadlines" },
      { tone: "purple", title: "◎ SELF VS OBSERVER", body: "2 members' self-image differs significantly from others' feedback" },
    ],
    legendSelf: "self",
    legendObserver: "observer",
    quote: "\"In 48 hours I learned more about my team than in the previous two years.\"",
    quoteAttribution: "— Pilot tester, 12-person tech team",
    foundingTitle: "Join the first 10 companies",
    foundingSub: "Personal onboarding + founding price for the first year",
    spotsLeft: "3 spots left",
    radarLabels: ["Openness", "Conscient.", "Extrav.", "Agreeable.", "Integrity", "Emot. st."],
  },
};

export function HeroSection({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;

  return (
    <section className="grid min-h-[85vh] grid-cols-1 border-b border-[#e0ddd6] lg:grid-cols-2">
      <div className="flex border-b border-[#e0ddd6] px-6 py-12 lg:border-b-0 lg:border-r lg:px-16 lg:py-20">
        <div className="my-auto w-full">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-px w-8 bg-[#c8410a]" />
            <div className="font-ibm-plex-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
              {c.eyebrow}
            </div>
          </div>

          <h1 className="font-playfair mb-7 text-[clamp(40px,10vw,72px)] font-black leading-[1.05] tracking-[-1.5px] text-[#1a1814] lg:tracking-[-2px]">
            {c.heading}
          </h1>

          <p className="mb-8 max-w-[440px] text-[15px] font-light leading-[1.75] text-[#5a5650] lg:mb-12 lg:text-[17px]">
            {c.sub}
          </p>

          <div className="flex flex-col items-start gap-4">
            <Link
              href="/sign-up"
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded bg-[#c8410a] px-6 py-4 text-[15px] font-medium text-white transition-all hover:-translate-y-px hover:bg-[#a33408] lg:w-auto lg:px-8"
            >
              {c.cta}
            </Link>
          </div>
        </div>
      </div>

      <div className="relative flex items-center overflow-hidden bg-[#f0ede6] px-6 py-10 lg:px-12 lg:py-[60px]">
        <div className="relative z-10 mx-auto flex w-full max-w-[640px] flex-col gap-8 lg:gap-10">
          <div className="hidden overflow-hidden rounded-[6px] border border-[#e0ddd6] bg-white shadow-[0_4px_24px_rgba(26,24,20,0.07)] md:block">
            <div className="flex items-center justify-between border-b border-[#e0ddd6] bg-[#f0ede6] px-4 py-[10px]">
              <div className="font-ibm-plex-mono text-[10px] tracking-[1px] text-[#5a5650]">
                {c.mockCardHeader}
              </div>
              <div className="flex gap-[6px]">
                <span className="h-2 w-2 rounded-full bg-[#e0ddd6]" />
                <span className="h-2 w-2 rounded-full bg-[#e0ddd6]" />
                <span className="h-2 w-2 rounded-full bg-[#c8410a]/50" />
              </div>
            </div>

            <div className="grid grid-cols-2 items-center gap-4 p-5">
              <div className="flex justify-center">
                <RadarChartPreview labels={c.radarLabels} />
              </div>

              <div className="flex flex-col gap-2">
                {c.insightCards.map((card) => (
                  <InsightCard key={card.title} tone={card.tone} title={card.title} body={card.body} />
                ))}
              </div>
            </div>

            <div className="flex gap-5 border-t border-[#e0ddd6] bg-[#f0ede6] px-5 py-[10px]">
              <LegendItem color="#c8410a" dashed={false} label={c.legendSelf} />
              <LegendItem color="#1a5c3a" dashed label={c.legendObserver} />
            </div>
          </div>

          <div className="relative rounded border-l-[3px] border-l-[#e0ddd6] bg-[#f0ede6] px-5 py-4 pl-7">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-2 top-[-14px] font-playfair text-5xl leading-none text-[#d6d0c5]"
            >
              &quot;
            </span>
            <p className="font-playfair mb-2 text-sm italic leading-[1.6] text-[#1a1814] md:text-[14px]">
              {c.quote}
            </p>
            <div className="font-ibm-plex-mono text-[10px] tracking-[1px] text-[#5a5650] uppercase">
              {c.quoteAttribution}
            </div>
          </div>

          <div className="relative overflow-hidden rounded border border-[#e0ddd6] bg-white px-5 py-4">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#c8410a] to-[#e8a87c]" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-ibm-plex-mono mb-1 text-[10px] uppercase tracking-[1px] text-[#c8410a]">
                  ◆ Founding Customer Program
                </div>
                <div className="text-[13px] font-semibold text-[#1a1814]">{c.foundingTitle}</div>
                <div className="mt-1 text-xs text-[#5a5650]">
                  {c.foundingSub}
                </div>
              </div>
              <div className="ml-4 flex shrink-0 flex-col items-center gap-1">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#c8410a]" />
                <span className="font-ibm-plex-mono text-[10px] whitespace-nowrap text-[#5a5650]">
                  {c.spotsLeft}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InsightCard({
  tone,
  title,
  body,
}: {
  tone: "accent" | "green" | "purple";
  title: string;
  body: string;
}) {
  const toneClass =
    tone === "accent"
      ? "border-l-[#c8410a] text-[#c8410a]"
      : tone === "green"
        ? "border-l-[#1a5c3a] text-[#1a5c3a]"
        : "border-l-[#9333ea] text-[#9333ea]";

  return (
    <div className={`rounded bg-[#faf9f6] px-3 py-2.5 border-l-2 ${toneClass}`}>
      <div className="font-ibm-plex-mono mb-1 text-[9px]">{title}</div>
      <div className="text-[11px] leading-[1.5] text-[#5a5650]">{body}</div>
    </div>
  );
}

function LegendItem({ color, dashed, label }: { color: string; dashed?: boolean; label: string }) {
  return (
    <div className="font-ibm-plex-mono flex items-center gap-[6px] text-[10px] text-[#5a5650]">
      <svg width="20" height="8" aria-hidden="true">
        <line
          x1="0"
          y1="4"
          x2="20"
          y2="4"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? "4 2" : undefined}
        />
      </svg>
      {label}
    </div>
  );
}

function RadarChartPreview({ labels }: { labels: [string, string, string, string, string, string] }) {
  return (
    <svg width="160" height="160" viewBox="-88 -88 176 176" overflow="visible" aria-label="Csapat profil radar chart">
      <defs>
        <radialGradient id="heroRg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c8410a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#c8410a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <polygon points="0,-70 61,-35 61,35 0,70 -61,35 -61,-35" fill="none" stroke="#e0ddd6" strokeWidth="1" />
      <polygon points="0,-52 45,-26 45,26 0,52 -45,26 -45,-26" fill="none" stroke="#e0ddd6" strokeWidth="1" />
      <polygon points="0,-35 30,-17 30,17 0,35 -30,17 -30,-17" fill="none" stroke="#e0ddd6" strokeWidth="1" />

      <line x1="0" y1="0" x2="0" y2="-70" stroke="#e0ddd6" strokeWidth="1" />
      <line x1="0" y1="0" x2="61" y2="-35" stroke="#e0ddd6" strokeWidth="1" />
      <line x1="0" y1="0" x2="61" y2="35" stroke="#e0ddd6" strokeWidth="1" />
      <line x1="0" y1="0" x2="0" y2="70" stroke="#e0ddd6" strokeWidth="1" />
      <line x1="0" y1="0" x2="-61" y2="35" stroke="#e0ddd6" strokeWidth="1" />
      <line x1="0" y1="0" x2="-61" y2="-35" stroke="#e0ddd6" strokeWidth="1" />

      <polygon points="0,-62 52,-24 54,32 0,58 -56,28 -44,-40" fill="url(#heroRg)" stroke="#c8410a" strokeWidth="2" />
      <polygon
        points="0,-50 42,-30 44,26 0,48 -50,24 -38,-42"
        fill="none"
        stroke="#1a5c3a"
        strokeWidth="1.5"
        strokeDasharray="4,3"
        opacity="0.7"
      />

      <text x="0" y="-78" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="8" fill="#5a5650">{labels[0]}</text>
      <text x="70" y="-38" textAnchor="start" fontFamily="IBM Plex Mono" fontSize="8" fill="#5a5650">{labels[1]}</text>
      <text x="70" y="42" textAnchor="start" fontFamily="IBM Plex Mono" fontSize="8" fill="#5a5650">{labels[2]}</text>
      <text x="0" y="84" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="8" fill="#5a5650">{labels[3]}</text>
      <text x="-70" y="42" textAnchor="end" fontFamily="IBM Plex Mono" fontSize="8" fill="#5a5650">{labels[4]}</text>
      <text x="-70" y="-38" textAnchor="end" fontFamily="IBM Plex Mono" fontSize="8" fill="#5a5650">{labels[5]}</text>
    </svg>
  );
}
