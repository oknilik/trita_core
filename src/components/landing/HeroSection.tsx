"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

type HeadingSlide = { before: string; word: string; after: string };

const copy: Record<
  Locale,
  {
    eyebrow: string;
    headingSlides: [HeadingSlide, HeadingSlide];
    sub: string;
    cta: string;
    signInCta: string;
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
    headingSlides: [
      { before: "Értsd meg jobban a ", word: "saját", after: " működésedet." },
      { before: "Értsd meg jobban a ", word: "csapatod", after: " működését." },
    ],
    sub: "A trita megmutatja, ami eddig láthatatlan volt - a csapatod valódi dinamikáját. Mielőtt a feszültség konfliktussá, a konfliktus pedig költséggé válik.",
    cta: "Megnézem a csapatomat →",
    signInCta: "Van már fiókod? Jelentkezz be",
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
    headingSlides: [
      { before: "Understand your ", word: "own", after: " dynamics better." },
      { before: "Understand your ", word: "team's", after: " dynamics better." },
    ],
    sub: "trita shows what's been invisible — your team's real dynamics. Before tension becomes conflict, and conflict becomes cost.",
    cta: "See my team →",
    signInCta: "Already have an account? Sign in",
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
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => 1 - i);
        setVisible(true);
      }, 260);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const slide = c.headingSlides[idx];

  return (
    <section className="grid min-h-[85vh] grid-cols-1 border-b border-sand lg:grid-cols-2">
      <div className="flex border-b border-sand px-6 py-12 lg:border-b-0 lg:border-r lg:px-16 lg:py-20">
        <div className="my-auto w-full">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-px w-8 bg-bronze" />
            <div className="font-dm-sans text-[11px] uppercase tracking-[2px] text-bronze">
              {c.eyebrow}
            </div>
          </div>

          <h1 className="font-fraunces mb-7 text-[clamp(40px,10vw,72px)] font-normal leading-[1.05] tracking-[-1.5px] text-ink lg:tracking-[-2px]">
            <span
              style={{ transition: "opacity 260ms ease, transform 260ms ease" }}
              className={visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[6px]"}
            >
              {slide.before}
              <span className="italic text-sage">
                {slide.word}
              </span>
              {slide.after}
            </span>
          </h1>

          <p className="mb-8 max-w-[440px] text-[15px] font-light leading-[1.75] text-ink-body lg:mb-12 lg:text-[17px]">
            {c.sub}
          </p>

          <div className="flex flex-col items-start gap-4">
            <Link
              href="/sign-up"
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded bg-sage px-6 py-4 text-[15px] font-medium text-white transition-all hover:-translate-y-px hover:bg-sage-dark lg:w-auto lg:px-8"
            >
              {c.cta}
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-ink-body transition-colors hover:text-ink"
            >
              {c.signInCta}
            </Link>
          </div>
        </div>
      </div>

      <div className="relative flex items-center overflow-hidden bg-warm-mid px-6 py-10 lg:px-12 lg:py-[60px]">
        <div className="relative z-10 mx-auto flex w-full max-w-[640px] flex-col gap-8 lg:gap-10">
          <div className="hidden overflow-hidden rounded-[6px] border border-sand bg-white shadow-[0_4px_24px_rgba(26,24,20,0.07)] md:block">
            <div className="flex items-center justify-between border-b border-sand bg-warm-mid px-4 py-[10px]">
              <div className="font-dm-sans text-[10px] tracking-[1px] text-ink-body">
                {c.mockCardHeader}
              </div>
              <div className="flex gap-[6px]">
                <span className="h-2 w-2 rounded-full bg-sand" />
                <span className="h-2 w-2 rounded-full bg-sand" />
                <span className="h-2 w-2 rounded-full bg-sage/50" />
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

            <div className="flex gap-5 border-t border-sand bg-warm-mid px-5 py-[10px]">
              <LegendItem color="#3d6b5e" dashed={false} label={c.legendSelf} />
              <LegendItem color="#3d6b5e" dashed label={c.legendObserver} />
            </div>
          </div>

          <div className="relative rounded border-l-[3px] border-l-sand bg-warm-mid px-5 py-4 pl-7">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-2 top-[-14px] font-fraunces text-5xl leading-none text-[#d6d0c5]"
            >
              &quot;
            </span>
            <p className="font-fraunces mb-2 text-sm italic leading-[1.6] text-ink md:text-[14px]">
              {c.quote}
            </p>
            <div className="font-dm-sans text-[10px] tracking-[1px] text-ink-body uppercase">
              {c.quoteAttribution}
            </div>
          </div>

          <div className="relative overflow-hidden rounded border border-sand bg-white px-5 py-4">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-sage to-[#e8a87c]" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-dm-sans mb-1 text-[10px] uppercase tracking-[1px] text-bronze">
                  ◆ Founding Customer Program
                </div>
                <div className="text-[13px] font-semibold text-ink">{c.foundingTitle}</div>
                <div className="mt-1 text-xs text-ink-body">
                  {c.foundingSub}
                </div>
              </div>
              <div className="ml-4 flex shrink-0 flex-col items-center gap-1">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sage" />
                <span className="font-dm-sans text-[10px] whitespace-nowrap text-ink-body">
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
      ? "border-l-sage text-bronze"
      : tone === "green"
        ? "border-l-sage text-sage"
        : "border-l-[#9333ea] text-[#9333ea]";

  return (
    <div className={`rounded bg-cream px-3 py-2.5 border-l-2 ${toneClass}`}>
      <div className="font-dm-sans mb-1 text-[9px]">{title}</div>
      <div className="text-[11px] leading-[1.5] text-ink-body">{body}</div>
    </div>
  );
}

function LegendItem({ color, dashed, label }: { color: string; dashed?: boolean; label: string }) {
  return (
    <div className="font-dm-sans flex items-center gap-[6px] text-[10px] text-ink-body">
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
      <polygon points="0,-70 61,-35 61,35 0,70 -61,35 -61,-35" fill="none" stroke="#e8e0d3" strokeWidth="1" />
      <polygon points="0,-52 45,-26 45,26 0,52 -45,26 -45,-26" fill="none" stroke="#e8e0d3" strokeWidth="1" />
      <polygon points="0,-35 30,-17 30,17 0,35 -30,17 -30,-17" fill="none" stroke="#e8e0d3" strokeWidth="1" />

      <line x1="0" y1="0" x2="0" y2="-70" stroke="#e8e0d3" strokeWidth="1" />
      <line x1="0" y1="0" x2="61" y2="-35" stroke="#e8e0d3" strokeWidth="1" />
      <line x1="0" y1="0" x2="61" y2="35" stroke="#e8e0d3" strokeWidth="1" />
      <line x1="0" y1="0" x2="0" y2="70" stroke="#e8e0d3" strokeWidth="1" />
      <line x1="0" y1="0" x2="-61" y2="35" stroke="#e8e0d3" strokeWidth="1" />
      <line x1="0" y1="0" x2="-61" y2="-35" stroke="#e8e0d3" strokeWidth="1" />

      <polygon points="0,-62 52,-24 54,32 0,58 -56,28 -44,-40" fill="rgba(61,107,94,0.1)" stroke="#3d6b5e" strokeWidth="2.5" />
      <polygon
        points="0,-50 42,-30 44,26 0,48 -50,24 -38,-42"
        fill="none"
        stroke="#3d6b5e"
        strokeWidth="1.5"
        strokeDasharray="4,3"
        opacity="0.7"
      />

      <text x="0" y="-78" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="8" fill="#4a4a5e">{labels[0]}</text>
      <text x="70" y="-38" textAnchor="start" fontFamily="IBM Plex Mono" fontSize="8" fill="#4a4a5e">{labels[1]}</text>
      <text x="70" y="42" textAnchor="start" fontFamily="IBM Plex Mono" fontSize="8" fill="#4a4a5e">{labels[2]}</text>
      <text x="0" y="84" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="8" fill="#4a4a5e">{labels[3]}</text>
      <text x="-70" y="42" textAnchor="end" fontFamily="IBM Plex Mono" fontSize="8" fill="#4a4a5e">{labels[4]}</text>
      <text x="-70" y="-38" textAnchor="end" fontFamily="IBM Plex Mono" fontSize="8" fill="#4a4a5e">{labels[5]}</text>
    </svg>
  );
}
