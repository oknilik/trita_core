"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { hasJudgmentTone } from "@/lib/feedback-tone";

// Kollégai visszajelzés kör — kitöltő kliens. Csapattársanként: opcionális
// elismerés + kötelező feedforward-pár („Folytasd, mert…" / „Jövőre
// próbáld…"). Egy beadás, a végén lépés-léptetés.
//
// UX (design-akciólista #2): sticky haladásjelző, személyenkénti
// kész-állapot, hiányzó mezők inline jelölése beküldési kísérletnél,
// és helyi (localStorage) piszkozat-mentés, hogy félbehagyva se
// vesszen el a szöveg.

interface Teammate {
  userId: string;
  name: string;
}

interface EntryState {
  appreciation: string;
  continueText: string;
  tryText: string;
}

const DRAFT_VERSION = 1;

function draftKey(campaignId: string) {
  return `trita-peerfb-draft-v${DRAFT_VERSION}-${campaignId}`;
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
  // Beküldési kísérlet után jelöljük vizuálisan is a hiányzó mezőket.
  const [attempted, setAttempted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Piszkozat betöltése (csak kliensen, hydration-biztos) ──
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey(campaignId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, Partial<EntryState>>;
      setEntries((prev) => {
        const next = { ...prev };
        for (const tm of teammates) {
          const saved = parsed[tm.userId];
          if (saved) {
            next[tm.userId] = {
              appreciation: saved.appreciation ?? "",
              continueText: saved.continueText ?? "",
              tryText: saved.tryText ?? "",
            };
          }
        }
        return next;
      });
      setDraftSaved(true);
    } catch {
      // sérült piszkozat — kezdjük tisztán
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- csak mountkor
  }, []);

  const persistDraft = useCallback(
    (next: Record<string, EntryState>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          window.localStorage.setItem(draftKey(campaignId), JSON.stringify(next));
          setDraftSaved(true);
        } catch {
          // pl. betelt tároló — a mentésjelzőt nem kapcsoljuk be
        }
      }, 400);
    },
    [campaignId],
  );

  const setEntry = (userId: string, patch: Partial<EntryState>) =>
    setEntries((prev) => {
      const next = { ...prev, [userId]: { ...prev[userId], ...patch } };
      persistDraft(next);
      return next;
    });

  const isComplete = useCallback(
    (tm: Teammate) =>
      entries[tm.userId].continueText.trim().length >= 3 &&
      entries[tm.userId].tryText.trim().length >= 3,
    [entries],
  );

  const incomplete = useMemo(() => teammates.filter((tm) => !isComplete(tm)), [teammates, isComplete]);
  const completedNow = teammates.length - incomplete.length;
  const allValid = incomplete.length === 0;

  const scrollToTeammate = (userId: string) => {
    document
      .getElementById(`peerfb-${userId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async () => {
    if (!allValid) {
      setAttempted(true);
      if (incomplete[0]) scrollToTeammate(incomplete[0].userId);
      return;
    }
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
      try {
        window.localStorage.removeItem(draftKey(campaignId));
      } catch {
        // nem kritikus
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

  const textareaClass = (missing: boolean) =>
    [
      "w-full rounded-lg border bg-white p-3 text-sm text-ink outline-none focus:border-sage-ring",
      attempted && missing
        ? "border-[var(--color-state-error-fg)]/60"
        : "border-sand",
    ].join(" ");

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

      {/* ── Sticky haladásjelző ── */}
      <div className="sticky top-0 z-10 -mx-4 mt-5 border-b border-sand/70 bg-cream/95 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-ink" aria-live="polite">
            {tf("peerFb.progressLabel", locale, {
              done: completedNow,
              total: teammates.length,
            })}
          </p>
          <div className="flex items-center gap-3">
            {draftSaved && (
              <span className="text-[11px] text-muted">{t("peerFb.draftSaved", locale)}</span>
            )}
            {!allValid && (
              <button
                type="button"
                onClick={() => incomplete[0] && scrollToTeammate(incomplete[0].userId)}
                className="text-[11px] font-semibold text-sage-dark underline-offset-2 hover:underline"
              >
                {t("peerFb.jumpToMissing", locale)}
              </button>
            )}
          </div>
        </div>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={teammates.length}
          aria-valuenow={completedNow}
        >
          <div
            className="h-full rounded-full bg-sage transition-all duration-300"
            style={{ width: `${(completedNow / teammates.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-5">
        {teammates.map((tm) => {
          const entry = entries[tm.userId];
          const complete = isComplete(tm);
          const missingContinue = entry.continueText.trim().length < 3;
          const missingTry = entry.tryText.trim().length < 3;
          const judgy =
            hasJudgmentTone(entry.continueText) ||
            hasJudgmentTone(entry.tryText) ||
            hasJudgmentTone(entry.appreciation);
          return (
            <section
              key={tm.userId}
              id={`peerfb-${tm.userId}`}
              className="scroll-mt-16 rounded-2xl border border-sand bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-ink">{tm.name}</h2>
                {complete ? (
                  <span className="rounded-full bg-sage/15 px-2.5 py-0.5 text-[11px] font-semibold text-sage-dark">
                    {t("peerFb.personDoneBadge", locale)}
                  </span>
                ) : (
                  <span className="rounded-full bg-sand/70 px-2.5 py-0.5 text-[11px] font-medium text-ink-body">
                    {tf("peerFb.personMissingBadge", locale, {
                      count: Number(missingContinue) + Number(missingTry),
                    })}
                  </span>
                )}
              </div>
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
                className={textareaClass(false)}
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
                className={textareaClass(missingContinue)}
                aria-invalid={attempted && missingContinue}
              />
              {attempted && missingContinue && (
                <p className="mt-1 text-[11px] text-state-error-fg">
                  {t("peerFb.fieldMissing", locale)}
                </p>
              )}
              <label className="mb-1 mt-3 block text-caption font-semibold text-ink-body">
                {t("peerFb.tryLabel", locale)}
              </label>
              <textarea
                rows={2}
                maxLength={400}
                value={entry.tryText}
                onChange={(e) => setEntry(tm.userId, { tryText: e.target.value })}
                placeholder={t("peerFb.tryPlaceholder", locale)}
                className={textareaClass(missingTry)}
                aria-invalid={attempted && missingTry}
              />
              {attempted && missingTry && (
                <p className="mt-1 text-[11px] text-state-error-fg">
                  {t("peerFb.fieldMissing", locale)}
                </p>
              )}
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

      <div className="mt-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            onClick={submit}
          >
            {t("peerFb.submit", locale)}
          </Button>
          {!allValid && (
            <span className="text-xs text-muted" aria-live="polite">
              {tf("peerFb.missingSummary", locale, {
                count: incomplete.length,
                names: incomplete.map((tm) => tm.name).join(", "),
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
