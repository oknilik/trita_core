"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
// UX: LÉPTETETT kitöltés — egyszerre EGY csapattárs kártyája látszik,
// a „Tovább" a két kötelező mező kitöltése után enged; az utolsó lépésen
// „Beküldés". Sticky haladásjelző, helyi (localStorage) piszkozat-mentés,
// visszalépés az előző kártyákra.

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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Továbblépési kísérlet után jelöljük vizuálisan a hiányzó mezőket.
  const [attempted, setAttempted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  // Szerverre már beküldött címzettek (rész-haladás): a kész kártya a
  // továbblépéskor azonnal beküldésre kerül, így eszközváltásnál sem vész el.
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);

  const entryComplete = (e: EntryState) =>
    e.continueText.trim().length >= 3 && e.tryText.trim().length >= 3;

  // ── Piszkozat betöltése (csak kliensen, hydration-biztos) ──
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey(campaignId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, Partial<EntryState>>;
      const restored: Record<string, EntryState> = Object.fromEntries(
        teammates.map((tm) => {
          const saved = parsed[tm.userId];
          return [
            tm.userId,
            {
              appreciation: saved?.appreciation ?? "",
              continueText: saved?.continueText ?? "",
              tryText: saved?.tryText ?? "",
            },
          ];
        }),
      );
      setEntries(restored);
      setDraftSaved(true);
      // Visszatérő kitöltő: az első hiányos csapattársnál folytatjuk.
      const firstIncomplete = teammates.findIndex((tm) => !entryComplete(restored[tm.userId]));
      setCurrentIdx(firstIncomplete === -1 ? Math.max(teammates.length - 1, 0) : firstIncomplete);
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

  const completedCount = teammates.filter((tm) => entryComplete(entries[tm.userId])).length;
  const isLast = currentIdx >= teammates.length - 1;
  const current = teammates[currentIdx];

  const goTo = (idx: number) => {
    setAttempted(false);
    setError(null);
    setCurrentIdx(Math.min(Math.max(idx, 0), teammates.length - 1));
    // A kártya tetejére görgetünk, hogy a következő név látszódjon.
    window.setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  };

  const submit = async () => {
    // Ha visszalépkedés után maradt hiányos kártya, oda ugrunk vissza.
    const firstIncomplete = teammates.findIndex((tm) => !entryComplete(entries[tm.userId]));
    if (firstIncomplete !== -1) {
      goTo(firstIncomplete);
      setAttempted(true);
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

  // Egyetlen kész kártya beküldése (rész-mentés) — a szerver lefedettség
  // alapján lépteti a kampány-lépést, így a részleges beadás biztonságos.
  const saveEntryToServer = async (targetUserId: string) => {
    const e = entries[targetUserId];
    if (!entryComplete(e) || savedIds.has(targetUserId)) return;
    try {
      const res = await fetch("/api/peer-feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          entries: [
            {
              toUserId: targetUserId,
              ...(e.appreciation.trim().length >= 3
                ? { appreciation: e.appreciation.trim() }
                : {}),
              continueText: e.continueText.trim(),
              tryText: e.tryText.trim(),
            },
          ],
        }),
      });
      if (res.ok) setSavedIds((prev) => new Set(prev).add(targetUserId));
    } catch {
      // hálózati hiba — a localStorage-piszkozat őrzi, a záró beadás pótolja
    }
  };

  const next = () => {
    if (!current) return;
    if (!entryComplete(entries[current.userId])) {
      setAttempted(true);
      return;
    }
    if (isLast) {
      void submit();
    } else {
      // Rész-mentés a szerverre (fire-and-forget) + tovább a következőre.
      void saveEntryToServer(current.userId);
      goTo(currentIdx + 1);
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
            className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-action-primary-bg px-6 text-caption font-semibold text-white transition hover:brightness-110"
          >
            {t("peerFb.backToDashboard", locale)}
          </Link>
        </div>
      </div>
    );
  }

  const entry = entries[current.userId];
  const missingContinue = entry.continueText.trim().length < 3;
  const missingTry = entry.tryText.trim().length < 3;
  const judgy =
    hasJudgmentTone(entry.continueText) ||
    hasJudgmentTone(entry.tryText) ||
    hasJudgmentTone(entry.appreciation);

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
            {tf("peerFb.stepLabel", locale, {
              current: currentIdx + 1,
              total: teammates.length,
            })}
            <span className="ml-2 font-normal text-muted">
              {tf("peerFb.progressLabel", locale, {
                done: completedCount,
                total: teammates.length,
              })}
            </span>
          </p>
          {draftSaved && (
            <span className="text-[11px] text-muted">{t("peerFb.draftSaved", locale)}</span>
          )}
        </div>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={teammates.length}
          aria-valuenow={completedCount}
        >
          <div
            className="h-full rounded-full bg-sage transition-all duration-300"
            style={{ width: `${(completedCount / teammates.length) * 100}%` }}
          />
        </div>
        {/* Lépés-pöttyök: kész / aktuális / hátralévő — a készekre vissza
            lehet ugrani szerkeszteni. */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-hidden="true">
          {teammates.map((tm, i) => {
            const isCurrent = i === currentIdx;
            const isDone = entryComplete(entries[tm.userId]);
            return (
              <button
                key={tm.userId}
                type="button"
                tabIndex={-1}
                title={tm.name}
                onClick={() => goTo(i)}
                className={[
                  "h-2 rounded-full transition-all duration-200",
                  isCurrent ? "w-5 bg-ink" : isDone ? "w-2 bg-sage" : "w-2 bg-sand",
                ].join(" ")}
              />
            );
          })}
        </div>
      </div>

      {/* ── Az aktuális csapattárs kártyája ── */}
      <section
        ref={cardRef}
        key={current.userId}
        className="mt-5 scroll-mt-24 rounded-2xl border border-sand bg-white p-5 shadow-sm"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-body font-semibold text-ink">{current.name}</h2>
          {entryComplete(entry) && (
            <span className="rounded-full bg-sage/15 px-2.5 py-0.5 text-[11px] font-semibold text-sage-dark">
              {t("peerFb.personDoneBadge", locale)}
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
          onChange={(e) => setEntry(current.userId, { appreciation: e.target.value })}
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
          onChange={(e) => setEntry(current.userId, { continueText: e.target.value })}
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
          onChange={(e) => setEntry(current.userId, { tryText: e.target.value })}
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

      {error && <p className="mt-4 text-sm text-state-error-fg">{error}</p>}

      {/* ── Léptetés ── */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <div>
          {currentIdx > 0 && (
            <Button type="button" variant="ghost" onClick={() => goTo(currentIdx - 1)}>
              {t("peerFb.prevPerson", locale)}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {attempted && !entryComplete(entry) && (
            <span className="text-xs text-muted" aria-live="polite">
              {t("peerFb.nextPersonHint", locale)}
            </span>
          )}
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            onClick={next}
          >
            {isLast ? t("peerFb.submit", locale) : t("peerFb.nextPerson", locale)}
          </Button>
        </div>
      </div>
    </div>
  );
}
