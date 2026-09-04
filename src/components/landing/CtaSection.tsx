"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import type { SiteMode } from "@/components/landing/types";
import { track } from "@/lib/analytics/client";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { ChevronRightIcon } from "@/components/ui/icons";

export function CtaSection({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const isSelf = mode === "self";
  const [hasDraft, setHasDraft] = useState(false);
  // localStorage csak kliensen olvasható — hydration-biztos minta, szándékos.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setHasDraft(hasAssessmentDraftInStorage("TRITAN")); }, []);

  if (!isSelf) {
    return (
      <section className="px-7 py-16 md:py-24">
        <div className="mx-auto flex max-w-[960px] flex-col gap-6 rounded-[28px] bg-[var(--color-surface-muted)] px-6 py-8 md:flex-row md:items-center md:justify-between md:px-9">
          <div className="max-w-[610px]">
            <h2 className="font-fraunces text-fluid-title font-medium tracking-tight text-ink">
              {t("landing.ctaTeamHeadlineBefore", locale)}
              <em className="italic text-[var(--color-layer-team-accent)]">
                {t("landing.ctaTeamHeadlineEm", locale)}
              </em>
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-body">
              {t("landing.ctaTeamSub", locale)}
            </p>
            <p className="mt-2 font-dm-sans text-xs text-ink-body/60">
              {t("landing.ctaTeamMicrocopy", locale)}
            </p>
          </div>
          <Link
            href="/pilot"
            onClick={() =>
              track("cta.click", {
                cta_id: "closing",
                surface: "landing",
                mode: "team",
              })
            }
            className={`inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-xl bg-[var(--color-layer-team-hero-from)] px-7 text-base font-semibold text-[var(--color-text-on-inverse)] shadow-[var(--ui-shadow-md)] transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[var(--ui-shadow-lg)] ${FOCUS_RING_CLASS}`}
          >
            {t("landing.ctaTeamCta", locale)}
          </Link>
        </div>
      </section>
    );
  }

  const cta = hasDraft
    ? t("landing.selfCtaContinue", locale)
    : t("landing.ctaSelfCta", locale);

  return (
    <section className="px-7 py-16 md:py-24">
      <div className="mx-auto max-w-[640px] text-center">
        <h2 className="font-fraunces mb-5 text-fluid-title font-medium tracking-tight text-ink">
          {t("landing.ctaSelfClosingBefore", locale)}
          <em className="italic text-[var(--color-accent-primary)]">
            {t("landing.ctaSelfClosingEm", locale)}
          </em>
        </h2>
        <p className="mb-9 text-base leading-relaxed text-ink-body">
          {t("landing.ctaSelfSub", locale)}
        </p>
        <div className="flex flex-col items-stretch gap-2.5 sm:items-center">
          <Link
            href="/try"
            onClick={() =>
              track("cta.click", {
                cta_id: "closing",
                surface: "landing",
                mode: "self",
              })
            }
            className={[
              "inline-flex min-h-[52px] items-center justify-center rounded-xl px-7 text-base font-semibold text-[var(--color-text-on-accent-deep)] transition-all hover:-translate-y-0.5 hover:shadow-lg",
              "bg-[var(--color-bronze-dark)] hover:bg-[var(--color-accent-primary-strong)]",
              FOCUS_RING_CLASS,
            ].join(" ")}
          >
            {cta}
          </Link>
          <Link
            href="/how-we-work"
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-sm font-semibold text-[var(--color-action-secondary-fg)] transition-colors hover:text-[var(--color-action-primary-bg)] ${FOCUS_RING_CLASS}`}
          >
            {t("landing.ctaSelfSecondary", locale)}
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <p className="mt-3.5 font-dm-sans text-xs text-ink-body/60">
          {t("landing.ctaSelfMicrocopy", locale)}
        </p>
      </div>
    </section>
  );
}
