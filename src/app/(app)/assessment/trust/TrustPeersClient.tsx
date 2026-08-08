"use client";

// Bizalmi háló kitöltő — kártya-carousel csapattársanként, 5 rövid
// kérdés/fő. Minden kész személy után azonnal beküldünk (személyenkénti
// batch), így megszakadásnál nem vész el a már beadott visszajelzés.
// Minta: TeamRolePeersClient.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TRUST_QUESTIONS,
  TRUST_QUESTION_COUNT,
  type TrustAnswerSet,
} from "@/lib/trust-network";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

interface Teammate {
  userId: string;
  name: string;
  done: boolean;
}

interface TrustPeersClientProps {
  locale: Locale;
  campaignId: string;
  campaignName: string;
  teammates: Teammate[];
}

type Phase = "intro" | "rating" | "done" | "error";

export function TrustPeersClient({
  locale,
  campaignId,
  campaignName,
  teammates,
}: TrustPeersClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(
    teammates.every((m) => m.done) ? "done" : "intro",
  );
  const [doneIds, setDoneIds] = useState<Set<string>>(
    () => new Set(teammates.filter((m) => m.done).map((m) => m.userId)),
  );
  const [answers, setAnswers] = useState<TrustAnswerSet>({});
  const [showMissing, setShowMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastFailed, setLastFailed] = useState<{
    aboutUserId: string;
    answers: TrustAnswerSet;
  } | null>(null);

  const pending = teammates.filter((m) => !doneIds.has(m.userId));
  const current = pending[0] ?? null;
  const doneCount = doneIds.size;
  const complete = TRUST_QUESTIONS.every(
    (q) => typeof answers[q.id] === "number",
  );

  const submitOne = useCallback(
    async (aboutUserId: string, answerSet: TrustAnswerSet) => {
      setSubmitting(true);
      try {
        const res = await fetch("/api/trust/peers/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId,
            observations: [{ aboutUserId, answers: answerSet }],
          }),
        });
        if (!res.ok) throw new Error("submit failed");
        setLastFailed(null);
        setAnswers({});
        setShowMissing(false);
        setDoneIds((prev) => {
          const next = new Set(prev);
          next.add(aboutUserId);
          if (next.size >= teammates.length) setPhase("done");
          return next;
        });
      } catch {
        setLastFailed({ aboutUserId, answers: answerSet });
        setPhase("error");
      } finally {
        setSubmitting(false);
      }
    },
    [campaignId, teammates.length],
  );

  if (phase === "intro") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-4 py-12">
        <SectionEyebrow>
          {t("trustPeers.eyebrow", locale)}
        </SectionEyebrow>
        <h1 className="mt-3 text-center font-fraunces text-3xl leading-tight text-ink">
          {t("trustPeers.introTitle", locale)}
        </h1>
        <p className="mt-2 text-center text-sm text-muted">{campaignName}</p>
        <p className="mt-5 max-w-md text-center text-[14px] leading-relaxed text-ink-body">
          {tf("trustPeers.introBody", locale, { count: TRUST_QUESTION_COUNT })}
        </p>
        <div className="mt-6 w-full rounded-xl border border-sage/30 bg-sage/5 px-4 py-3.5">
          <p className="text-caption leading-relaxed text-ink-body">
            <span className="font-semibold text-ink">
              {t("trustPeers.consentTitle", locale)}
            </span>{" "}
            {t("trustPeers.consentBody", locale)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPhase("rating")}
          className="mt-8 inline-flex min-h-[48px] items-center rounded-[10px] bg-action-primary-bg px-8 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
        >
          {t("trustPeers.start", locale)}
        </button>
        <p className="mt-3 font-mono text-micro uppercase tracking-wide text-muted">
          {tf("trustPeers.progress", locale, {
            done: doneCount,
            total: teammates.length,
          })}
        </p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="text-4xl">🤝</div>
        <h1 className="mt-4 font-fraunces text-2xl text-ink">
          {t("trustPeers.doneTitle", locale)}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">
          {t("trustPeers.doneBody", locale)}
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-action-primary-bg px-6 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
        >
          {t("trustPeers.backToDashboard", locale)}
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="font-fraunces text-2xl text-ink">
          {t("trustPeers.errorTitle", locale)}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">
          {t("trustPeers.errorBody", locale)}
        </p>
        <button
          type="button"
          onClick={() => {
            setPhase("rating");
            if (lastFailed) {
              void submitOne(lastFailed.aboutUserId, lastFailed.answers);
            }
          }}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-action-primary-bg px-6 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
        >
          {t("trustPeers.retry", locale)}
        </button>
      </div>
    );
  }

  // rating
  if (!current) return null;
  const isLast = pending.length === 1;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-8 pb-20">
      <div className="flex items-center justify-between">
        <SectionEyebrow>
          {t("trustPeers.eyebrow", locale)}
        </SectionEyebrow>
        <p className="font-mono text-[11px] text-muted">
          {tf("trustPeers.progress", locale, {
            done: doneCount,
            total: teammates.length,
          })}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-sand bg-surface-card px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/15 font-fraunces text-lg text-sage">
          {current.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted">
            {t("trustPeers.aboutPerson", locale)}
          </p>
          <p className="truncate font-fraunces text-lg text-ink">{current.name}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {TRUST_QUESTIONS.map((q) => {
          const value = answers[q.id];
          const missing = showMissing && typeof value !== "number";
          const low = q.options[0];
          const high = q.options[q.options.length - 1];
          const isScale = q.max === 5;
          return (
            <div
              key={q.id}
              className={`rounded-2xl border bg-surface-card px-5 py-4 ${
                missing ? "border-state-warning-border" : "border-sand"
              }`}
            >
              <p className="text-[14px] font-semibold leading-snug text-ink">
                {q.text[locale]}
              </p>
              {isScale ? (
                <>
                  <div className="mt-3 flex gap-2">
                    {Array.from({ length: q.max }, (_, i) => i + 1).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: v }))
                        }
                        className={`flex min-h-[44px] flex-1 items-center justify-center rounded-[10px] border text-sm font-semibold transition ${
                          value === v
                            ? "border-[var(--color-surface-inverse)] bg-[var(--color-surface-inverse)] text-[var(--color-text-on-inverse)]"
                            : "border-sand bg-cream text-ink-body hover:border-ink/40"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted">
                    {tf("trustPeers.scaleHint", locale, {
                      low: low[locale],
                      max: q.max,
                      high: high[locale],
                    })}
                  </p>
                </>
              ) : (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))
                      }
                      className={`flex min-h-[44px] flex-1 items-center justify-center rounded-[10px] border px-3 text-sm font-semibold transition ${
                        value === opt.value
                          ? "border-[var(--color-surface-inverse)] bg-[var(--color-surface-inverse)] text-[var(--color-text-on-inverse)]"
                          : "border-sand bg-cream text-ink-body hover:border-ink/40"
                      }`}
                    >
                      {opt[locale]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showMissing && !complete ? (
        <p className="mt-3 text-center text-[12px] font-semibold text-state-warning-fg">
          {t("trustPeers.missingAnswers", locale)}
        </p>
      ) : null}

      <button
        type="button"
        disabled={submitting}
        onClick={() => {
          if (!complete) {
            setShowMissing(true);
            return;
          }
          void submitOne(current.userId, answers);
        }}
        className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-[10px] bg-action-primary-bg px-8 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110 disabled:opacity-60"
      >
        {submitting
          ? t("trustPeers.submitting", locale)
          : isLast
            ? t("trustPeers.finish", locale)
            : t("trustPeers.next", locale)}
      </button>
    </div>
  );
}
