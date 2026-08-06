"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import type { SiteMode } from "@/components/landing/ModeSwitcher";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";

export function CtaSection({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const isSelf = mode === "self";
  const [hasDraft, setHasDraft] = useState(false);
  // localStorage csak kliensen olvasható — hydration-biztos minta, szándékos.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setHasDraft(hasAssessmentDraftInStorage("TRITAN")); }, []);

  const headlineBefore = isSelf
    ? t("landing.ctaSelfHeadlineBefore", locale)
    : t("landing.ctaTeamHeadlineBefore", locale);
  const headlineEm = isSelf
    ? t("landing.ctaSelfHeadlineEm", locale)
    : t("landing.ctaTeamHeadlineEm", locale);
  const sub = isSelf ? t("landing.ctaSelfSub", locale) : t("landing.ctaTeamSub", locale);
  const cta = isSelf
    ? (hasDraft ? t("landing.selfCtaContinue", locale) : t("landing.ctaSelfCta", locale))
    : t("landing.ctaTeamCta", locale);
  const microcopy = isSelf ? t("landing.ctaSelfMicrocopy", locale) : t("landing.ctaTeamMicrocopy", locale);
  const ctaHref = isSelf ? "/try" : "/contact";

  return (
    <section className="px-7 py-12 md:py-20">
      <div className="mx-auto max-w-[640px] text-center">
        <h2 className="font-fraunces mb-5 text-fluid-title font-medium tracking-tight text-ink">
          {headlineBefore}
          <em
            className="italic"
            style={{ color: isSelf ? "var(--color-accent-primary)" : "var(--color-action-primary-bg)" }}
          >
            {headlineEm}
          </em>
        </h2>
        <p className="mb-9 text-base leading-relaxed text-ink-body">{sub}</p>
        <Link
          href={ctaHref}
          className={[
            "inline-flex min-h-[54px] items-center justify-center rounded-xl px-9 text-[17px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg",
            // Self CTA: bronze-dark (fehér szöveg mellett 4.89:1) — azonos a
            // NavBar sticky CTA-jával és a hero gombjával; hover egy fokkal
            // sötétebb (bronze-700), hogy a hover-visszajelzés megmaradjon.
            isSelf ? "bg-[var(--color-bronze-dark)] hover:bg-[var(--color-accent-primary-strong)]" : "bg-[var(--color-action-primary-bg)] hover:bg-[var(--color-sage-dark)]",
          ].join(" ")}
        >
          {cta}
        </Link>
        <p className="mt-3.5 font-dm-sans text-xs text-ink-body/60">{microcopy}</p>
      </div>
    </section>
  );
}
