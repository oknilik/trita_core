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
import { ChevronRightIcon } from "@/components/ui/icons";
import {
  AssessmentFlowHeader,
  AssessmentFlowShell,
  AssessmentIntro,
  AssessmentStatus,
  assessmentPrimaryActionClass,
} from "@/components/assessment/AssessmentFlowShell";

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
  const answeredCount = TRUST_QUESTIONS.filter(
    (q) => typeof answers[q.id] === "number",
  ).length;
  const complete = TRUST_QUESTIONS.every(
    (q) => typeof answers[q.id] === "number",
  );
  const answerProgressLabel = tf("trustPeers.answerProgress", locale, {
    done: answeredCount,
    total: TRUST_QUESTION_COUNT,
  });

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
      <AssessmentIntro
        eyebrow={t("trustPeers.eyebrow", locale)}
        title={t("trustPeers.introTitle", locale)}
        campaignName={campaignName}
        body={tf("trustPeers.introBody", locale, { count: TRUST_QUESTION_COUNT })}
        notice={
          <>
            <span className="font-semibold text-ink">
              {t("trustPeers.consentTitle", locale)}
            </span>{" "}
            {t("trustPeers.consentBody", locale)}
          </>
        }
        action={
          <button type="button" onClick={() => setPhase("rating")} className={assessmentPrimaryActionClass}>
            {t("trustPeers.start", locale)}
          </button>
        }
        meta={tf("trustPeers.progress", locale, {
            done: doneCount,
            total: teammates.length,
        })}
      />
    );
  }

  if (phase === "done") {
    return (
      <AssessmentStatus
        tone="success"
        title={t("trustPeers.doneTitle", locale)}
        body={t("trustPeers.doneBody", locale)}
        action={<button type="button" onClick={() => router.push("/dashboard")} className={assessmentPrimaryActionClass}>{t("trustPeers.backToDashboard", locale)}</button>}
      />
    );
  }

  if (phase === "error") {
    return (
      <AssessmentStatus
        tone="error"
        title={t("trustPeers.errorTitle", locale)}
        body={t("trustPeers.errorBody", locale)}
        action={<button
          type="button"
          onClick={() => {
            setPhase("rating");
            if (lastFailed) {
              void submitOne(lastFailed.aboutUserId, lastFailed.answers);
            }
          }}
          className={assessmentPrimaryActionClass}
        >
          {t("trustPeers.retry", locale)}
        </button>}
      />
    );
  }

  // rating
  if (!current) return null;
  const isLast = pending.length === 1;

  return (
    <AssessmentFlowShell>
      <AssessmentFlowHeader
        eyebrow={t("trustPeers.eyebrow", locale)}
        progress={tf("trustPeers.progress", locale, {
            done: doneCount,
            total: teammates.length,
        })}
      />

      <section
        className="relative mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 overflow-hidden rounded-2xl border border-[var(--color-layer-team-accent)]/25 px-5 py-5 shadow-[var(--ui-shadow-sm)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-5 sm:px-6"
        style={{
          background:
            "linear-gradient(110deg, color-mix(in srgb, var(--color-layer-team-accent) 16%, var(--color-surface-card)), var(--color-surface-card) 74%)",
        }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1 bg-[var(--color-layer-team-accent)]"
        />
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-layer-team-accent)]/25 bg-surface-card font-fraunces text-2xl text-[var(--color-layer-team-accent)] shadow-[var(--ui-shadow-sm)]"
        >
          {current.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-label uppercase text-[var(--color-layer-team-accent)]">
            {t("trustPeers.aboutPerson", locale)}
          </p>
          <p className="mt-1 truncate font-fraunces text-3xl leading-tight text-ink">
            {current.name}
          </p>
          <p className="mt-1.5 text-note text-ink-body">
            {t("trustPeers.personReminder", locale)}
          </p>
        </div>
        <p className="col-span-2 text-note text-muted sm:col-span-1 sm:max-w-28 sm:text-right">
          {tf("trustPeers.currentPerson", locale, {
            current: doneCount + 1,
            total: teammates.length,
          })}
        </p>
      </section>

      <div className="mt-4 flex items-center gap-3 px-0.5">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-border-default)]"
          role="progressbar"
          aria-label={answerProgressLabel}
          aria-valuemin={0}
          aria-valuemax={TRUST_QUESTION_COUNT}
          aria-valuenow={answeredCount}
        >
          <div
            className="h-full rounded-full bg-[var(--color-layer-team-accent)] transition-[width]"
            style={{ width: `${(answeredCount / TRUST_QUESTION_COUNT) * 100}%` }}
          />
        </div>
        <p className="shrink-0 text-note text-muted">
          {answerProgressLabel}
        </p>
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
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold leading-snug text-ink">
                  {q.text[locale]}
                </p>
                {typeof value === "number" ? (
                  <span className="shrink-0 text-note font-semibold text-[var(--color-layer-team-accent)]">
                    {t("trustPeers.answered", locale)}
                  </span>
                ) : null}
              </div>
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
                            ? "border-[var(--color-layer-team-hero-from)] bg-[var(--color-layer-team-hero-from)] text-[var(--color-text-on-inverse)]"
                            : "border-sand bg-cream text-ink-body hover:border-[var(--color-layer-team-accent)]/45"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-note text-muted">
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
                          ? "border-[var(--color-layer-team-hero-from)] bg-[var(--color-layer-team-hero-from)] text-[var(--color-text-on-inverse)]"
                          : "border-sand bg-cream text-ink-body hover:border-[var(--color-layer-team-accent)]/45"
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
        <p className="mt-3 text-center text-xs font-semibold text-state-warning-fg">
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
        className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-[10px] bg-[var(--color-layer-team-hero-from)] px-8 text-sm font-semibold text-[var(--color-text-on-inverse)] transition hover:brightness-110 disabled:opacity-60"
      >
        {submitting
          ? t("trustPeers.submitting", locale)
          : isLast
            ? t("trustPeers.finish", locale)
            : t("trustPeers.next", locale)}
        {!isLast && !submitting ? <ChevronRightIcon /> : null}
      </button>
    </AssessmentFlowShell>
  );
}
