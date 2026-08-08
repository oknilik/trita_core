"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

export function EmailPreferencesClient({ initialOptOut }: { initialOptOut: boolean }) {
  const { locale } = useLocale();
  const [optOut, setOptOut] = useState(initialOptOut);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const handleToggle = async (next: boolean) => {
    setBusy(true);
    setError(false);
    setSaved(false);
    try {
      const res = await fetch("/api/profile/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycleEmailsOptOut: next }),
      });
      if (!res.ok) throw new Error("SAVE_FAILED");
      setOptOut(next);
      setSaved(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-sand bg-cream/45 p-4">
        <input
          type="checkbox"
          checked={!optOut}
          disabled={busy}
          onChange={(e) => void handleToggle(!e.target.checked)}
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

      {saved ? (
        <p className="mt-3 rounded-lg bg-sage/10 px-3 py-2 text-xs text-sage-dark">
          {t("results.emailPrefsSaved", locale)}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-state-error-border bg-state-error-bg px-3 py-2 text-xs text-state-error-fg">
          {t("results.compareError", locale)}
        </p>
      ) : null}
    </div>
  );
}
