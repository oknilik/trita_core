"use client";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import type { SiteMode } from "@/components/landing/ModeSwitcher";

export function CtaSection({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const isSelf = mode === "self";

  const headlineBefore = isSelf
    ? t("landing.ctaSelfHeadlineBefore", locale)
    : t("landing.ctaTeamHeadlineBefore", locale);
  const headlineEm = isSelf
    ? t("landing.ctaSelfHeadlineEm", locale)
    : t("landing.ctaTeamHeadlineEm", locale);
  const sub = isSelf ? t("landing.ctaSelfSub", locale) : t("landing.ctaTeamSub", locale);
  const cta = isSelf ? t("landing.ctaSelfCta", locale) : t("landing.ctaTeamCta", locale);
  const microcopy = isSelf ? t("landing.ctaSelfMicrocopy", locale) : t("landing.ctaTeamMicrocopy", locale);
  const ctaHref = isSelf ? "/sign-up" : "/sign-up?type=team";

  return (
    <section className="px-7 py-12 md:py-20">
      <div className="mx-auto max-w-[640px] text-center">
        <h2 className="font-fraunces mb-5 text-[clamp(28px,3.5vw,42px)] font-normal leading-[1.1] tracking-tight text-ink">
          {headlineBefore}
          <em className="not-italic italic text-[#5a8f7f]">{headlineEm}</em>
        </h2>
        <p className="mb-9 text-base leading-relaxed text-ink-body">{sub}</p>
        <Link
          href={ctaHref}
          className={[
            "inline-flex min-h-[54px] items-center justify-center rounded-[14px] px-9 text-[17px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg",
            isSelf ? "bg-[#c17f4a] hover:bg-[#9a6538]" : "bg-[#3d6b5e] hover:bg-[#2d5a4e]",
          ].join(" ")}
        >
          {cta}
        </Link>
        <p className="mt-3.5 font-dm-sans text-xs text-ink-body/60">{microcopy}</p>
      </div>
    </section>
  );
}
