"use client";

import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { track } from "@/lib/analytics/client";
import { t, tf, type Locale } from "@/lib/i18n/public";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

/**
 * GYIK-lista a `pricing.faqQ<n>` / `pricing.faqA<n>` kulcsokból. A tételek
 * sorszámait a hívó adja (`src/app/(marketing)/pricing/faq.ts`), így a
 * szerver-oldali FAQ JSON-LD és a látható lista ugyanabból a listából
 * dolgozik — a Google irányelve szerint a strukturált adatban szereplő
 * kérdésnek látszania kell az oldalon.
 */
export function FaqList({
  indexes,
  locale,
  surface,
  eyebrow,
  vars = {},
}: {
  indexes: readonly number[];
  locale: Locale;
  /** Analitika: melyik oldal GYIK-je (faq.open). */
  surface: string;
  eyebrow: string;
  /** Behelyettesítés a válaszokba (pl. árak a díjkártyából). */
  vars?: Record<string, string | number>;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <h2 className="mt-4 font-fraunces text-fluid-title text-ink">{t("pricing.faqHeading", locale)}</h2>
      </div>
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {indexes.map((i) => (
          <details
            key={i}
            onToggle={(event) => event.currentTarget.open && track("faq.open", { faq_id: `${surface}_q${i}`, surface })}
            className="group rounded-[18px] border border-sand bg-surface-card open:shadow-[0_12px_30px_rgba(26,26,46,0.04)]"
          >
            <summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-[18px] px-5 py-4 text-sm font-semibold text-ink ${FOCUS_RING_CLASS}`}>
              {t(`pricing.faqQ${i}`, locale)}
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warm text-lg font-normal text-ink-body transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="px-5 pb-5 pr-14 text-sm leading-relaxed text-ink-body">{tf(`pricing.faqA${i}`, locale, vars)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
