"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import type { NewsletterTopic } from "@/lib/newsletter";

/**
 * Levélbeállítások — három független kapcsoló:
 *   · életciklus-emailek (reflexiós utókövetés és hasonlók),
 *   · új blogbejegyzés értesítő,
 *   · időszaki, szerkesztett hírlevél.
 *
 * A kettő szándékosan külön áll: az első a termék működéséhez tartozó,
 * személyre szóló érintés, a második tartalom-marketing. Aki az egyiket
 * kikapcsolja, attól még kérheti a másikat.
 *
 * A mentés kapcsolónként, azonnal történik (nincs „Mentés" gomb) — a POST
 * csak azt a mezőt küldi, amit a felhasználó épp billentett.
 */
export function EmailPreferencesClient({
  initialOptOut,
  initialNewsletterTopics,
}: {
  initialOptOut: boolean;
  initialNewsletterTopics: NewsletterTopic[];
}) {
  const { locale } = useLocale();
  const [optOut, setOptOut] = useState(initialOptOut);
  const [newsletterTopics, setNewsletterTopics] = useState<NewsletterTopic[]>(initialNewsletterTopics);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const save = async (payload: Record<string, unknown>, apply: () => void) => {
    setBusy(true);
    setError(false);
    setSaved(false);
    try {
      const res = await fetch("/api/profile/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("SAVE_FAILED");
      apply();
      setSaved(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const toggleNewsletterTopic = (topic: NewsletterTopic, enabled: boolean) => {
    const next = enabled
      ? Array.from(new Set([...newsletterTopics, topic]))
      : newsletterTopics.filter((value) => value !== topic);
    void save({ newsletterTopics: next }, () => setNewsletterTopics(next));
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-sand bg-cream/45 p-4">
        <input
          type="checkbox"
          checked={!optOut}
          disabled={busy}
          onChange={(e) => {
            const next = !e.target.checked;
            void save({ lifecycleEmailsOptOut: next }, () => setOptOut(next));
          }}
          className="mt-0.5 h-5 w-5 accent-[var(--color-accent-primary)]"
        />
        <span>
          <span className="block text-caption font-semibold text-ink">
            {t("results.emailPrefsToggleLabel", locale)}
          </span>
          <span className="mt-0.5 block text-micro leading-relaxed text-muted">
            {t("results.emailPrefsToggleHint", locale)}
          </span>
        </span>
      </label>

      <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-sand bg-cream/45 p-4">
        <input
          type="checkbox"
          checked={newsletterTopics.includes("blog")}
          disabled={busy}
          onChange={(e) => toggleNewsletterTopic("blog", e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-[var(--color-accent-primary)]"
        />
        <span>
          <span className="block text-caption font-semibold text-ink">
            {t("results.emailPrefsBlogLabel", locale)}
          </span>
          <span className="mt-0.5 block text-micro leading-relaxed text-muted">
            {t("results.emailPrefsBlogHint", locale)}
          </span>
        </span>
      </label>

      <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-sand bg-cream/45 p-4">
        <input
          type="checkbox"
          checked={newsletterTopics.includes("newsletter")}
          disabled={busy}
          onChange={(e) => toggleNewsletterTopic("newsletter", e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-[var(--color-accent-primary)]"
        />
        <span>
          <span className="block text-caption font-semibold text-ink">
            {t("results.emailPrefsDigestLabel", locale)}
          </span>
          <span className="mt-0.5 block text-micro leading-relaxed text-muted">
            {t("results.emailPrefsDigestHint", locale)}
          </span>
        </span>
      </label>

      {saved ? (
        <p role="status" aria-live="polite" className="rounded-lg bg-sage/10 px-3 py-2 text-xs text-sage-dark">
          {t("results.emailPrefsSaved", locale)}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg border border-state-error-border bg-state-error-bg px-3 py-2 text-xs text-state-error-fg">
          {t("results.compareError", locale)}
        </p>
      ) : null}
    </div>
  );
}
