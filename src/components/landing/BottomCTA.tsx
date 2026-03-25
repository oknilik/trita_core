"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

const copy = {
  hu: {
    title: "Kezdd el most.",
    titleContinue: "Folytasd, ahol abbahagytad.",
    subtitle: "Az első karrierképed ~15 perc múlva ott lehet előtted.",
    subtitleContinue: "A válaszaid mentve vannak — folytasd a tesztet.",
    cta: "Indítsd el a tesztet →",
    ctaContinue: "Folytatom a tesztet →",
  },
  en: {
    title: "Start now.",
    titleContinue: "Pick up where you left off.",
    subtitle: "Your first career profile can be ready in ~15 minutes.",
    subtitleContinue: "Your answers are saved — continue the assessment.",
    cta: "Start the assessment →",
    ctaContinue: "Continue assessment →",
  },
};

export function BottomCTA() {
  const { locale } = useLocale();
  const c = copy[locale] ?? copy.hu;
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("trita_draft_HEXACO");
      if (saved) {
        const parsed = JSON.parse(saved);
        const answers = parsed?.answers ?? parsed;
        if (answers && Object.keys(answers).length > 0) setHasDraft(true);
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <section className="-mb-16 grid grid-cols-1 items-center gap-6 bg-sage-deep px-6 py-16 md:grid-cols-[1fr_auto] md:gap-[60px] md:px-16 md:py-[100px]">
      <div>
        <h2 className="font-fraunces text-[clamp(36px,4vw,56px)] font-black leading-[1.05] tracking-[-2px] text-white">
          {hasDraft ? c.titleContinue : c.title}
        </h2>
        <p className="mt-3 max-w-[440px] text-[16px] leading-relaxed text-white/50">
          {hasDraft ? c.subtitleContinue : c.subtitle}
        </p>
      </div>
      <Link
        href="/try"
        className="inline-flex min-h-[54px] items-center justify-center rounded-xl bg-white px-9 text-[15px] font-bold text-[#c17f4a] shadow-md shadow-black/10 transition-all hover:-translate-y-px hover:shadow-lg"
      >
        {hasDraft ? c.ctaContinue : c.cta}
      </Link>
    </section>
  );
}
