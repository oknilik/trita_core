"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

// A kereslet-mérés ELSŐ foka: az ajánló a karrier-oldalon.
//
// A megjelenést is rögzítjük, mert enélkül a kattintás-szám olvashatatlan —
// nevező nélkül nincs lemorzsolódási arány, csak egy nyers darabszám.
// A rögzítés idempotens (felhasználónként egy sor), és nem blokkol semmit:
// ha elhasal, a felhasználó ebből semmit nem vesz észre.

export function CareerPlusCta() {
  const { locale } = useLocale();
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    void fetch("/api/career/probe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "cta_view" }),
    }).catch(() => {});
  }, []);

  return (
    <Link
      href="/career/plus"
      className="group relative block overflow-hidden rounded-2xl border-[1.5px] border-[var(--color-action-primary-bg)]/30 bg-gradient-to-br from-[var(--color-surface-self-accent-soft)] via-white to-[var(--color-surface-subtle)] p-6 transition hover:border-[var(--color-action-primary-bg)]/60 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:p-7"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 select-none font-fraunces text-[120px] leading-none text-[var(--color-action-primary-bg)]/[0.07]"
      >
        +
      </span>

      <div className="relative max-w-xl">
        <span className="inline-flex items-center rounded-full bg-[var(--color-action-primary-bg)]/12 px-3 py-1 text-micro font-semibold uppercase tracking-widest text-[var(--color-accent-self-deep)]">
          {t("results.careerPlusBadge", locale)}
        </span>
        <p className="mt-2.5 font-fraunces text-[20px] leading-snug text-[var(--color-text-primary)] md:text-[24px]">
          {t("results.careerPlusCtaTitle", locale)}
        </p>
        <p className="mt-2 text-caption leading-relaxed text-[var(--color-text-secondary)]">
          {t("results.careerPlusCtaBody", locale)}
        </p>
        <span className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-sage px-5 text-sm font-semibold text-white transition group-hover:bg-sage-dark">
          {t("results.careerPlusCtaButton", locale)}
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
