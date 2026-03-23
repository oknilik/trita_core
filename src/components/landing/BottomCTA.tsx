import Link from "next/link";
import type { Locale } from "@/lib/i18n";

const copy: Record<Locale, { heading: string; cta: string }> = {
  hu: {
    heading: "Látni akarod,\nmi történik a csapatodban?",
    cta: "Megnézem a csapatomat →",
  },
  en: {
    heading: "Want to see what's\nhappening in your team?",
    cta: "See my team →",
  },
};

export function BottomCTA({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;
  const [headingLine1, headingLine2] = c.heading.split("\n");

  return (
    <section className="-mb-16 grid grid-cols-1 items-center gap-8 bg-sage-deep px-6 py-16 md:grid-cols-[1fr_auto] md:gap-[60px] md:px-16 md:py-[100px]">
      <h2 className="font-fraunces text-[clamp(36px,4vw,56px)] font-black leading-[1.05] tracking-[-2px] text-white">
        {headingLine1}
        <br />
        {headingLine2}
      </h2>
      <Link
        href="/sign-up"
        className="inline-flex min-h-[54px] items-center justify-center rounded bg-white px-9 text-[15px] font-semibold text-bronze transition-all hover:-translate-y-px hover:opacity-90"
      >
        {c.cta}
      </Link>
    </section>
  );
}
