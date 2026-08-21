"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

/**
 * Levélbeállítások — KÉT független kapcsoló:
 *   · életciklus-emailek (reflexiós utókövetés és hasonlók),
 *   · hírlevél / új blogbejegyzés értesítő.
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
  initialNewsletter,
}: {
  initialOptOut: boolean;
  initialNewsletter: boolean;
}) {
  const { locale } = useLocale();
  const [optOut, setOptOut] = useState(initialOptOut);
  const [newsletter, setNewsletter] = useState(initialNewsletter);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const save = async (payload: Record<string, boolean>, apply: () => void) => {
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
          checked={newsletter}
          disabled={busy}
          onChange={(e) => {
            const next = e.target.checked;
            void save({ newsletterSubscribed: next }, () => setNewsletter(next));
          }}
          className="mt-0.5 h-5 w-5 accent-[var(--color-accent-primary)]"
        />
        <span>
          <span className="block text-caption font-semibold text-ink">
            {t("results.emailPrefsNewsletterLabel", locale)}
          </span>
          <span className="mt-0.5 block text-micro leading-relaxed text-muted">
            {t("results.emailPrefsNewsletterHint", locale)}
          </span>
        </span>
      </label>

      {saved ? (
        <p className="rounded-lg bg-sage/10 px-3 py-2 text-xs text-sage-dark">
          {t("results.emailPrefsSaved", locale)}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-state-error-border bg-state-error-bg px-3 py-2 text-xs text-state-error-fg">
          {t("results.compareError", locale)}
        </p>
      ) : null}
    </div>
  );
}
