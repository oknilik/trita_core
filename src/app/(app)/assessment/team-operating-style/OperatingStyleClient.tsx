"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { ITEMS, AXES, OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";
import type { OperatingAnswers } from "@/lib/team-operating-style/scoring";
import { Button } from "@/components/ui/primitives/Button";

const ordered = Array.from({ length: 6 }, (_, i) => AXES.map((axis) => ITEMS.filter((q) => q.axis === axis)[i])).flat();
export function OperatingStyleClient({ locale, campaignId, campaignName, teamName, initialAnswers, referenceStart, referenceEnd }: {
  locale: Locale; campaignId: string; campaignName: string; teamName: string;
  initialAnswers: OperatingAnswers; referenceStart: string; referenceEnd: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const completed = ITEMS.filter((q) => Object.hasOwn(answers, q.id)).length;
  async function save(intent: "draft" | "submit") {
    setBusy(true); setMessage(""); setError(false);
    try {
      const response = await fetch("/api/team-operating-style", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, instrumentVersion: OPERATING_STYLE_VERSION, intent, answers }) });
      const data = await response.json();
      if (!response.ok) {
        const code = ["INVALID_INPUT", "STEP_LOCKED", "CAMPAIGN_NOT_ACTIVE", "ALREADY_SUBMITTED"].includes(data.error) ? data.error : "generic";
        setError(true); setMessage(t(`tos.errors.${code}`, locale)); return;
      }
      setMessage(t(intent === "submit" ? "tos.completed" : "tos.saved", locale));
      if (intent === "submit") setDone(true);
      router.refresh();
    } catch { setError(true); setMessage(t("tos.errors.generic", locale)); }
    finally { setBusy(false); }
  }
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale === "hu" ? "hu-HU" : "en-GB", { timeZone: "UTC" });
  return <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
    <header className="space-y-3">
      <p className="text-sm text-muted">{teamName} · {campaignName}</p>
      <h1 className="font-fraunces text-title text-ink">{t("tos.title", locale)}</h1>
      <p className="text-body text-ink-body">{t("tos.instructions", locale)}</p>
      <p className="text-sm text-muted">{t("tos.window", locale)}: {date(referenceStart)} – {date(referenceEnd)}</p>
      <p className="text-sm text-muted">{t("tos.privacy", locale)}</p>
    </header>
    {message && <p role={error ? "alert" : "status"} className="rounded-xl border border-sand bg-paper p-4">{message}</p>}
    {!done && <form onSubmit={(e) => { e.preventDefault(); void save("submit"); }} className="space-y-5">
      <p className="text-sm text-muted">{t("tos.answered", locale)}: {completed}/{ITEMS.length}</p>
      {ordered.map((q, index) => <fieldset key={q.id} disabled={busy} className="rounded-2xl border border-sand p-4 sm:p-5">
        <legend className="px-2 text-body font-medium text-ink">{index + 1}. {t(`tos.items.${q.id}`, locale)}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {["1", "2", "3", "4", "5", "na"].map((key) => {
            const value = key === "na" ? null : Number(key);
            return <label key={key} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-sand p-3 text-sm hover:bg-sand/30">
              <input type="radio" name={q.id} value={key} checked={Object.hasOwn(answers, q.id) && answers[q.id] === value}
                onChange={() => setAnswers((a) => ({ ...a, [q.id]: value }))} />
              {t(`tos.answers.${key}`, locale)}
            </label>;
          })}
        </div>
      </fieldset>)}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void save("draft")}>{t("tos.save", locale)}</Button>
        <Button type="submit" disabled={busy || completed !== ITEMS.length} loading={busy}>{t("tos.submit", locale)}</Button>
      </div>
    </form>}
    <Link className="inline-flex min-h-[44px] items-center text-bronze underline" href="/dashboard">{t("tos.back", locale)}</Link>
  </div>;
}
