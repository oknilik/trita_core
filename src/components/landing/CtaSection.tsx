"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import type { SiteMode } from "@/components/landing/ModeSwitcher";
import { track } from "@/lib/analytics/client";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

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
  const secondaryHref = isSelf ? "/how-we-work" : "/try";
  const secondaryLabel = isSelf
    ? t("landing.ctaSelfSecondary", locale)
    : t("landing.ctaTeamSecondary", locale);

  return (
    <section className="px-7 py-16 md:py-24">
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
        <div className="flex flex-col items-stretch gap-2.5 sm:items-center">
          <Link
            href={ctaHref}
            onClick={() =>
              track("cta.click", {
                cta_id: "closing",
                surface: "landing",
                mode: isSelf ? "self" : "team",
              })
            }
            className={[
              "inline-flex min-h-[54px] items-center justify-center rounded-xl px-9 text-[17px] font-semibold text-[var(--color-text-on-accent-deep)] transition-all hover:-translate-y-0.5 hover:shadow-lg",
              isSelf ? "bg-[var(--color-bronze-dark)] hover:bg-[var(--color-accent-primary-strong)]" : "bg-[var(--color-action-primary-bg)] hover:bg-[var(--color-sage-dark)]",
            ].join(" ")}
          >
            {cta}
          </Link>
          <Link
            href={secondaryHref}
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-sm font-semibold text-[var(--color-action-secondary-fg)] transition-colors hover:text-[var(--color-action-primary-bg)] ${FOCUS_RING_CLASS}`}
          >
            {secondaryLabel}
          </Link>
        </div>
        <p className="mt-3.5 font-dm-sans text-xs text-ink-body/60">{microcopy}</p>
      </div>
    </section>
  );
}
