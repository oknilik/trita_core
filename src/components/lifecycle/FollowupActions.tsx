"use client";

import { useState } from "react";

export function FollowupActions({ id, locale }: { id: string; locale: "hu" | "en" }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const hu = locale === "hu";
  async function update(action: "snooze" | "dismiss") {
    setBusy(true);
    try {
      const response = await fetch("/api/lifecycle/preference", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      if (!response.ok) throw new Error();
      setMessage(action === "snooze" ? (hu ? "Egy hétre elhalasztottuk az emlékeztetőt." : "Reminder snoozed for a week.") : (hu ? "Ehhez a lépéshez nem küldünk több emlékeztetőt." : "We will not send more reminders for this step."));
    } catch { setMessage(hu ? "Most nem sikerült menteni. Próbáld újra később." : "Could not save. Please try again later."); }
    finally { setBusy(false); }
  }
  return <div className="mt-6 space-y-3">
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy} onClick={() => update("snooze")} className="min-h-[44px] rounded-lg border border-sand px-4 py-2 text-sm disabled:opacity-50">{hu ? "Emlékeztess egy hét múlva" : "Remind me in a week"}</button>
      <button type="button" disabled={busy} onClick={() => update("dismiss")} className="min-h-[44px] rounded-lg border border-sand px-4 py-2 text-sm disabled:opacity-50">{hu ? "Most kihagyom" : "Skip this step"}</button>
    </div>
    <p role="status" className="text-sm text-muted">{message}</p>
  </div>;
}

export function FollowupUnsubscribe({ token, locale }: { token: string; locale: "hu" | "en" }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const hu = locale === "hu";
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
    {done ? <p role="status">{hu ? "Leiratkoztál az utánkövető levelekről." : "You have unsubscribed from follow-up emails."}</p>
      : <button type="button" disabled={busy || !token} onClick={unsubscribe} className="min-h-[44px] rounded-lg bg-sage px-5 py-3 font-semibold text-[var(--color-action-primary-fg)] disabled:opacity-50">{hu ? "Leiratkozom" : "Unsubscribe"}</button>}
    {error && <p role="alert" className="text-sm">{hu ? "A link már nem használható, vagy átmeneti hiba történt. A fiókod email-beállításainál is leiratkozhatsz." : "This link is unavailable or a temporary error occurred. You can also unsubscribe in your account email preferences."}</p>}
    <a href="/email-preferences" className="block text-sm underline">{hu ? "Email-beállítások" : "Email preferences"}</a>
  </div>;
}
