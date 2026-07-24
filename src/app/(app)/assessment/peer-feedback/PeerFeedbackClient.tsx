"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { hasJudgmentTone } from "@/lib/feedback-tone";

// Kollégai visszajelzés kör — kitöltő kliens. Csapattársanként: opcionális
// elismerés + kötelező feedforward-pár („Folytasd, mert…" / „Jövőre
// próbáld…"). Egy beadás, a végén lépés-léptetés.

interface Teammate {
  userId: string;
  name: string;
}

interface EntryState {
  appreciation: string;
  continueText: string;
  tryText: string;
}

export function PeerFeedbackClient({
  locale,
  campaignId,
  campaignName,
  anonymousMode,
  teammates,
  doneCount,
}: {
  locale: Locale;
  campaignId: string;
  campaignName: string;
  anonymousMode: boolean;
  teammates: Teammate[];
  doneCount: number;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<Record<string, EntryState>>(() =>
    Object.fromEntries(
      teammates.map((tm) => [tm.userId, { appreciation: "", continueText: "", tryText: "" }]),
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setEntry = (userId: string, patch: Partial<EntryState>) =>
    setEntries((prev) => ({ ...prev, [userId]: { ...prev[userId], ...patch } }));

  const allValid = teammates.every(
    (tm) =>
      entries[tm.userId].continueText.trim().length >= 3 &&
      entries[tm.userId].tryText.trim().length >= 3,
  );

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/peer-feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          entries: teammates.map((tm) => ({
            toUserId: tm.userId,
            ...(entries[tm.userId].appreciation.trim().length >= 3
              ? { appreciation: entries[tm.userId].appreciation.trim() }
              : {}),
            continueText: entries[tm.userId].continueText.trim(),
            tryText: entries[tm.userId].tryText.trim(),
          })),
        }),
      });
      if (!res.ok) {
        setError(t("peerFb.submitError", locale));
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (done || teammates.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-sand bg-white p-8 text-center shadow-sm">
          <h1 className="font-fraunces text-2xl text-ink">{t("peerFb.doneTitle", locale)}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-body">
            {t("peerFb.doneBody", locale)}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-ink px-6 text-[13px] font-semibold text-white transition hover:brightness-110"
          >
            {t("peerFb.backToDashboard", locale)}
          </Link>
        </div>
      </div>
    );
  }

  const textareaClass =
    "w-full rounded-lg border border-sand bg-white p-3 text-sm text-ink outline-none focus:border-sage-ring";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="font-mono text-xs uppercase tracking-widest text-bronze">
        {campaignName}
      </p>
      <h1 className="mt-1 font-fraunces text-2xl text-ink md:text-3xl">
        {t("peerFb.title", locale)}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-body">
        {anonymousMode ? t("peerFb.introAnon", locale) : t("peerFb.introNamed", locale)}
      </p>
      {doneCount > 0 && (
        <p className="mt-1 text-xs text-muted">
          {tf("peerFb.alreadyDone", locale, { count: doneCount })}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-5">
        {teammates.map((tm) => {
          const entry = entries[tm.userId];
          const judgy =
            hasJudgmentTone(entry.continueText) ||
            hasJudgmentTone(entry.tryText) ||
            hasJudgmentTone(entry.appreciation);
          return (
            <section key={tm.userId} className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-[15px] font-semibold text-ink">{tm.name}</h2>
              <label className="mb-1 block text-caption font-semibold text-ink-body">
                {t("peerFb.appreciationLabel", locale)}{" "}
                <span className="font-normal text-muted">{t("peerFb.optional", locale)}</span>
              </label>
              <textarea
                rows={2}
                maxLength={400}
                value={entry.appreciation}
                onChange={(e) => setEntry(tm.userId, { appreciation: e.target.value })}
                placeholder={t("peerFb.appreciationPlaceholder", locale)}
                className={textareaClass}
              />
              <label className="mb-1 mt-3 block text-caption font-semibold text-ink-body">
                {t("peerFb.continueLabel", locale)}
              </label>
              <textarea
                rows={2}
                maxLength={400}
                value={entry.continueText}
                onChange={(e) => setEntry(tm.userId, { continueText: e.target.value })}
                placeholder={t("peerFb.continuePlaceholder", locale)}
                className={textareaClass}
              />
              <label className="mb-1 mt-3 block text-caption font-semibold text-ink-body">
                {t("peerFb.tryLabel", locale)}
              </label>
              <textarea
                rows={2}
                maxLength={400}
                value={entry.tryText}
                onChange={(e) => setEntry(tm.userId, { tryText: e.target.value })}
                placeholder={t("peerFb.tryPlaceholder", locale)}
                className={textareaClass}
              />
              {judgy && (
                <p className="mt-2 rounded-lg bg-[var(--color-state-warning-bg)] px-3 py-2 text-micro leading-relaxed text-[var(--color-state-warning-fg)]">
                  {t("peerFb.toneNudge", locale)}
                </p>
              )}
            </section>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-state-error-fg">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        <Button
          type="button"
          variant="primary"
          loading={submitting}
          disabled={!allValid}
          onClick={submit}
        >
          {t("peerFb.submit", locale)}
        </Button>
        {!allValid && (
          <span className="text-xs text-muted">{t("peerFb.fillAllHint", locale)}</span>
        )}
      </div>
    </div>
  );
}
