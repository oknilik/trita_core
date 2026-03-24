import Link from "next/link";
import type { Locale } from "@/lib/i18n";

const copy: Record<Locale, { title: string; subtitle: string; cta: string }> = {
  hu: {
    title: "Kezdd el most.",
    subtitle: "Az első karrierképed ~15 perc múlva ott lehet előtted.",
    cta: "Indítsd el a tesztet →",
  },
  en: {
    title: "Start now.",
    subtitle: "Your first career profile can be ready in ~15 minutes.",
    cta: "Start the assessment →",
  },
};

export function BottomCTA({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;

  return (
    <section className="-mb-16 grid grid-cols-1 items-center gap-6 bg-sage-deep px-6 py-16 md:grid-cols-[1fr_auto] md:gap-[60px] md:px-16 md:py-[100px]">
      <div>
        <h2 className="font-fraunces text-[clamp(36px,4vw,56px)] font-black leading-[1.05] tracking-[-2px] text-white">
          {c.title}
        </h2>
        <p className="mt-3 max-w-[440px] text-[16px] leading-relaxed text-white/50">
          {c.subtitle}
        </p>
      </div>
      <Link
        href="/sign-up"
        className="inline-flex min-h-[54px] items-center justify-center rounded-xl bg-white px-9 text-[15px] font-bold text-[#c17f4a] shadow-md shadow-black/10 transition-all hover:-translate-y-px hover:shadow-lg"
      >
        {c.cta}
      </Link>
    </section>
  );
}
