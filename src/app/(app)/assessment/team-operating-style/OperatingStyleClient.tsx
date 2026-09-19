"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import { ITEMS, AXES, OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";
import type { OperatingAnswers } from "@/lib/team-operating-style/scoring";
import { SliderSelector } from "@/components/assessment/SliderSelector";
import { Button } from "@/components/ui/primitives/Button";

const ordered = Array.from({ length: 6 }, (_, i) => AXES.map((axis) => ITEMS.filter((q) => q.axis === axis)[i])).flat();
export function OperatingStyleClient({ locale, campaignId, campaignName, teamName, initialAnswers }: {
  locale: Locale; campaignId: string; campaignName: string; teamName: string;
  initialAnswers: OperatingAnswers; referenceStart: string; referenceEnd: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [index, setIndex] = useState(() => {
    const firstMissing = ordered.findIndex(q => !Object.hasOwn(initialAnswers, q.id));
    return firstMissing < 0 ? ordered.length - 1 : firstMissing;
  });
  const questionRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { questionRef.current?.focus({ preventScroll: true }); }, [index]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const missing = ordered.filter((q) => !Object.hasOwn(answers, q.id));
  const completed = ITEMS.length - missing.length;
  const [showMissing, setShowMissing] = useState(false);
  async function save(intent: "draft" | "submit") {
    if (busy) return;
    if (intent === "submit" && missing.length) {
      setShowMissing(true);
      setIndex(ordered.indexOf(missing[0]));
      questionRef.current?.focus({ preventScroll: true });
      return;
    }
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
  const question = ordered[index];
  const answered = Object.hasOwn(answers, question.id);
  const choose = (value: number | null) => {
    setAnswers(previous => ({ ...previous, [question.id]: value }));
    setShowMissing(false);
  };
  return <div className="mx-auto flex w-full max-w-xl flex-col px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
    <header className="border-b border-sand pb-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-fraunces text-xl text-ink">{t("tos.title", locale)}</h1>
        {!done && <span className="shrink-0 text-sm tabular-nums text-muted">{index + 1} / {ITEMS.length}</span>}
      </div>
      <p className="mt-1 text-caption text-muted">{teamName}</p>
      {!done && <div role="progressbar" aria-label={t("tos.answered", locale)} aria-valuenow={completed} aria-valuemin={0} aria-valuemax={ITEMS.length} className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-action-primary-bg transition-all" style={{ width: `${completed / ITEMS.length * 100}%` }} />
      </div>}
    </header>
    {message && <p role={error ? "alert" : "status"} className="mt-5 rounded-xl border border-sand bg-paper p-4">{message}</p>}
    {!done && <form onSubmit={e => { e.preventDefault(); if (index === ordered.length - 1) void save("submit"); else if (answered) setIndex(i => i + 1); }}>
      <p className="mt-5 text-center text-caption text-muted">{t("tos.shortInstructions", locale)}</p>
      <section aria-labelledby="operating-question" className="flex flex-col items-center py-8 sm:py-10">
        <h2 id="operating-question" ref={questionRef} tabIndex={-1} className="mb-8 w-full text-center font-fraunces text-2xl leading-snug text-ink outline-none sm:text-3xl">{t(`tos.items.${question.id}`, locale)}</h2>
        <SliderSelector value={answered ? answers[question.id] : null} onChange={choose} ariaLabel={t(`tos.items.${question.id}`, locale)} disabled={busy} labels={[1, 2, 3, 4, 5].map(n => t(`tos.answers.${n}`, locale))} />
        <button type="button" disabled={busy} aria-pressed={answered && answers[question.id] === null} onClick={() => choose(null)} className={`mt-5 min-h-[44px] rounded-xl border px-4 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sage ${answered && answers[question.id] === null ? "border-sage bg-sage-soft text-ink" : "border-sand text-muted hover:bg-sand/30"}`}>
          {t("tos.answers.na", locale)}
        </button>
      </section>
      {showMissing && <p role="alert" className="mb-4 text-center text-sm text-ink">{t("tos.missingAnswer", locale)}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="secondary" disabled={busy || index === 0} onClick={() => setIndex(i => i - 1)}>{t("tos.previous", locale)}</Button>
        <Button type="submit" disabled={busy || !answered} loading={busy && index === ordered.length - 1}>{t(index === ordered.length - 1 ? "tos.finish" : "tos.next", locale)}</Button>
      </div>
      <Button className="mt-4 w-full" type="button" variant="ghost" disabled={busy} onClick={() => void save("draft")}>{t("tos.save", locale)}</Button>
    </form>}
    <details className="mt-6 border-t border-sand pt-4 text-xs text-muted">
      <summary className="flex min-h-[44px] cursor-pointer items-center">{t("tos.aboutAnswers", locale)}</summary>
      <p className="mt-2 leading-relaxed">{t("tos.privacy", locale)}</p>
      <p className="mt-2">{campaignName}</p>
    </details>
    <Link className="mt-3 inline-flex min-h-[44px] items-center justify-center text-sm text-muted underline" href="/tasks">{t("tos.back", locale)}</Link>
  </div>;
}
