"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

/**
 * A feliratkozás-visszajelző oldalak közös kártyája.
 *
 * Kliens-komponens, mert a nyelv a `LocaleProvider`-ből jön (a marketing-fa
 * statikusan prerenderelt, a nyelvváltás kliens-oldali). Az állapotot a
 * route handler adja query-paraméterben — tokent SOHA nem viszünk ide.
 */
export function NewsletterStatusCard({
  titleKey,
  bodyKey,
  /** Sikertelen megerősítésnél újra fel lehet iratkozni ugyanitt. */
  showForm = false,
}: {
  titleKey: string;
  bodyKey: string;
  showForm?: boolean;
}) {
  const { locale } = useLocale();

  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-cream px-4 py-16 md:py-24">
      <div className="w-full max-w-md rounded-2xl border border-sand bg-surface-card p-8 md:p-10">
        <SectionEyebrow tone="muted">{t("newsletter.eyebrow", locale)}</SectionEyebrow>
        <h1 className="mt-2 font-fraunces text-title leading-tight tracking-tight text-ink">
          {t(titleKey, locale)}
        </h1>
        <p className="mt-3 text-caption leading-relaxed text-ink-body">{t(bodyKey, locale)}</p>

        {showForm ? <NewsletterForm source="blog_index" variant="compact" className="mt-6" /> : null}

        <Link
          href="/blog"
          className={`mt-6 inline-flex min-h-[44px] items-center rounded-lg text-caption font-semibold text-[var(--color-action-primary-bg)] underline-offset-4 hover:underline ${FOCUS_RING_CLASS}`}
        >
          {t("newsletter.backToBlog", locale)}
        </Link>
      </div>
    </main>
  );
}
