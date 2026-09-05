"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { ChevronRightIcon } from "@/components/ui/icons";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { track } from "@/lib/analytics/client";
import { t } from "@/lib/i18n/public";
import { TEAM_FAQ_INDEXES } from "@/lib/team-dynamics-pillar";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

/**
 * A /team-dynamics pillar GYIK-blokkja. Ugyanaz a `<details>`-minta, mint a
 * /how-we-work GYIK-je; a `faq.open` esemény `surface`-e különbözteti meg,
 * melyik lapon merül fel a kétely. A `page.tsx` ugyanezekből a kulcsokból
 * építi a FAQPage JSON-LD-t.
 */
export function TeamFaq() {
  const { locale } = useLocale();

  return (
    <section data-team-faq className="bg-cream">
      <div className="mx-auto max-w-3xl px-7 py-16 md:py-20">
        <div className="text-center">
          <SectionEyebrow tone="team">{t("teamDynamics.faqEyebrow", locale)}</SectionEyebrow>
          <h2 className="mt-4 font-fraunces text-fluid-title text-ink">{t("teamDynamics.faqHeading", locale)}</h2>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {TEAM_FAQ_INDEXES.map((i) => (
            <details
              key={i}
              onToggle={(event) =>
                event.currentTarget.open && track("faq.open", { faq_id: `team_q${i}`, surface: "team-dynamics" })
              }
              className="group rounded-[18px] border border-sand bg-surface-card open:shadow-[0_12px_30px_rgba(26,26,46,0.04)]"
            >
              <summary
                className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-[18px] px-5 py-4 text-sm font-semibold text-ink ${FOCUS_RING_CLASS}`}
              >
                {t(`teamDynamics.faqQ${i}`, locale)}
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warm text-lg font-normal text-ink-body transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 pr-14 text-sm leading-relaxed text-ink-body">{t(`teamDynamics.faqA${i}`, locale)}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/how-we-work"
            className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[var(--color-action-secondary-fg)] transition-colors hover:text-[var(--color-action-primary-bg)] ${FOCUS_RING_CLASS}`}
          >
            {t("teamDynamics.faqMoreCta", locale)}
            <ChevronRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
