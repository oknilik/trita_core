"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";

export function FollowupActions({ id, locale }: { id: string; locale: "hu" | "en" }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function update(action: "snooze" | "dismiss") {
    setBusy(true);
    try {
      const response = await fetch("/api/lifecycle/preference", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      if (!response.ok) throw new Error();
      setMessage(t(action === "snooze" ? "lifecycle.preferences.snoozed" : "lifecycle.preferences.dismissed", locale));
    } catch { setMessage(t("lifecycle.preferences.failed", locale)); }
    finally { setBusy(false); }
  }
  return <div className="mt-6 space-y-3">
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy} onClick={() => update("snooze")} className="min-h-[44px] rounded-lg border border-sand px-4 py-2 text-sm disabled:opacity-50">{t("lifecycle.preferences.snooze", locale)}</button>
      <button type="button" disabled={busy} onClick={() => update("dismiss")} className="min-h-[44px] rounded-lg border border-sand px-4 py-2 text-sm disabled:opacity-50">{t("lifecycle.preferences.dismiss", locale)}</button>
    </div>
    <p role="status" className="text-sm text-muted">{message}</p>
  </div>;
}

export function FollowupUnsubscribe({ token, locale }: { token: string; locale: "hu" | "en" }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  async function unsubscribe() {
    setBusy(true); setError(false);
    try {
      const response = await fetch(`/api/lifecycle/unsubscribe?token=${encodeURIComponent(token)}`, { method: "POST" });
      if (!response.ok) throw new Error();
      setDone(true);
    } catch { setError(true); }
    finally { setBusy(false); }
  }
  return <div className="mt-6 space-y-4">
    {done ? <p role="status">{t("lifecycle.preferences.unsubscribed", locale)}</p>
      : <button type="button" disabled={busy || !token} onClick={unsubscribe} className="min-h-[44px] rounded-lg bg-sage px-5 py-3 font-semibold text-[var(--color-action-primary-fg)] disabled:opacity-50">{t("lifecycle.preferences.unsubscribe", locale)}</button>}
    {error && <p role="alert" className="text-sm">{t("lifecycle.preferences.unsubscribeFailed", locale)}</p>}
    <a href="/email-preferences" className="block text-sm underline">{t("lifecycle.email.preferences", locale)}</a>
  </div>;
}
