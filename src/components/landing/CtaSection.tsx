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

  // A 12 px-es mikroszöveg korábban `text-ink-body/60` volt: krémen 2,9:1.
  // Az opacity-halványítás helyett a teljes muted token (≥ 4,5:1 mindkét
  // sémán, a meleg surface-muted felületen is).

  if (!isSelf) {
    return (
      <section className="px-7 py-16 md:py-24">
        {/* A gomb-oszlop csak akkor kerül a szöveg MELLÉ, ha a leghosszabb
            (magyar) gombfelirat elfér egy sorban — 960 px alatt a két elem
            egymás alá kerül, különben a felirat kettétörik. */}
        <div className="mx-auto flex max-w-[960px] flex-col gap-6 rounded-[28px] bg-[var(--color-surface-muted)] px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-9">
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
            <p className="mt-2 font-dm-sans text-xs text-[var(--color-text-muted)]">
              {t("landing.ctaTeamMicrocopy", locale)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
            <Link
              href="/contact"
              onClick={() =>
                track("cta.click", {
                  cta_id: "closing",
                  surface: "landing",
                  mode: "team",
                })
              }
              className={`inline-flex min-h-[52px] shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-[var(--color-layer-team-hero-from)] px-7 text-base font-semibold text-[var(--color-text-on-inverse)] shadow-[var(--ui-shadow-md)] transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[var(--ui-shadow-lg)] ${FOCUS_RING_CLASS}`}
            >
              {t("landing.ctaTeamCta", locale)}
            </Link>
            <Link
              href="/pilot"
              onClick={() => track("cta.click", { cta_id: "cta_team_pilot", surface: "landing", mode: "team" })}
              className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-2 text-sm font-semibold text-[var(--color-layer-team-accent)] transition-opacity hover:opacity-80 ${FOCUS_RING_CLASS}`}
            >
              {t("landing.ctaTeamPilot", locale)}
              <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
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
          {/* Kontraszt (a11y): az alap bronz krémen 3,0:1 alatt marad, nagy
              szövegként is határeset — a hero-val azonos középső fok (3,9:1). */}
          <em className="italic text-[var(--color-accent-primary-mid)]">
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
            href="/team-dynamics"
            className={`inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-sm font-semibold text-[var(--color-action-secondary-fg)] transition-colors hover:text-[var(--color-action-primary-bg)] ${FOCUS_RING_CLASS}`}
          >
            {t("landing.ctaSelfSecondary", locale)}
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <p className="mt-3.5 font-dm-sans text-xs text-[var(--color-text-muted)]">
          {t("landing.ctaSelfMicrocopy", locale)}
        </p>
      </div>
    </section>
  );
}
