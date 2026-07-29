"use client";

import { estimateAssessmentMinutes } from "@/lib/questions/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressBar } from "@/components/assessment/ProgressBar";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { TeamRoleQuestionnaire } from "@/components/assessment/TeamRoleQuestionnaire";
import { useToast } from "@/components/ui/Toast";
import { isLikertQuestion, type Question } from "@/lib/questions/types";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { createClientLogger } from "@/lib/client-logger";

const log = createClientLogger("candidate");

const QUESTIONS_PER_PAGE = 10;

interface CandidateClientProps {
  token: string;
  position?: string;
  testName: string;
  questions: Question[];
  locale: Locale;
  /** Opcionális 2. lépés: csapatszerep-kérdőív a TRITAN után (átugorható). */
  includeTeamRole?: boolean;
}

function sanitizeAnswers(
  raw: Record<string, unknown> | undefined,
  questions: Question[],
): Record<number, number> {
  if (!raw || typeof raw !== "object") return {};
  const validIds = new Set(questions.map((q) => q.id));
  const out: Record<number, number> = {};
  for (const [key, val] of Object.entries(raw)) {
    const qId = Number(key);
    if (!Number.isInteger(qId) || !validIds.has(qId)) continue;
    if (typeof val !== "number" || !Number.isInteger(val) || val < 1 || val > 5) continue;
    out[qId] = val;
  }
  return out;
}

function getResumePage(
  questions: Question[],
  answers: Record<number, number>,
): number {
  const totalPages = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE));
  const firstUnansweredIdx = questions.findIndex((q) => answers[q.id] === undefined);
  if (firstUnansweredIdx === -1) return totalPages - 1;
  return Math.min(Math.floor(firstUnansweredIdx / QUESTIONS_PER_PAGE), totalPages - 1);
}

export function CandidateClient({
  token,
  position,
  testName,
  questions,
  locale,
  includeTeamRole = false,
}: CandidateClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const DRAFT_KEY = `trita_candidate_draft_${token}`;

  const [phase, setPhase] = useState<"intro" | "assessment" | "teamRole" | "done" | "revoked">("intro");
  const [teamRoleSubmitting, setTeamRoleSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [highlightQuestionId, setHighlightQuestionId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initializedFocusPage = useRef<number | null>(null);
  const latestAnswersRef = useRef(answers);
  const questionAreaRef = useRef<HTMLDivElement>(null);
  const scrollMounted = useRef(false);
  const progressSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestAnswersRef.current = answers;
  }, [answers]);

  // Sync draft progress to server (debounced); detect revocation via response
  useEffect(() => {
    const count = Object.keys(answers).length;
    if (phase !== "assessment" || count === 0) return;
    if (progressSyncTimer.current) clearTimeout(progressSyncTimer.current);
    progressSyncTimer.current = setTimeout(() => {
      fetch(`/api/candidate/${token}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answeredCount: Object.keys(answers).length }),
      })
        .then((res) => res.json() as Promise<{ ok: boolean; revoked?: boolean }>)
        .then((data) => {
          if (!data.ok && data.revoked) {
            setPhase("revoked");
          }
        })
        .catch(() => {/* ignore */});
    }, 2000);
    return () => {
      if (progressSyncTimer.current) clearTimeout(progressSyncTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, phase]);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Record<string, unknown>;
      if (data.answers && typeof data.answers === "object") {
        const sanitized = sanitizeAnswers(data.answers as Record<string, unknown>, questions);
        setAnswers(sanitized);
        setCurrentPage(getResumePage(questions, sanitized));
        if (Object.keys(sanitized).length > 0) {
          setPhase("assessment");
        }
      }
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist answers to localStorage
  useEffect(() => {
    if (phase === "done") return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, currentPage }));
    } catch {
      // ignore
    }
  }, [DRAFT_KEY, answers, currentPage, phase]);

  // Smooth scroll on page change
  useEffect(() => {
    if (!scrollMounted.current) { scrollMounted.current = true; return; }
    questionAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  const totalQuestions = questions.length;
  const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
  const pageQuestions = questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE,
  );
  const isLastPage = currentPage === totalPages - 1;
  const answeredCount = Object.keys(answers).length;
  const canGoNext = pageQuestions.every((q) => answers[q.id] !== undefined);
  const activeQuestion = pageQuestions[activeQuestionIndex] ?? null;
  const canGoForwardWithinPage = activeQuestionIndex < pageQuestions.length - 1;
  const canGoPrev = currentPage > 0 || activeQuestionIndex > 0;

  // Initialize active question index per page
  useEffect(() => {
    if (initializedFocusPage.current === currentPage) return;
    if (pageQuestions.length === 0) return;
    const firstUnanswered = pageQuestions.findIndex((q) => answers[q.id] === undefined);
    if (firstUnanswered === -1 && currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1);
      return;
    }
    setActiveQuestionIndex(firstUnanswered === -1 ? pageQuestions.length - 1 : firstUnanswered);
    initializedFocusPage.current = currentPage;
  }, [currentPage, pageQuestions, answers, totalPages]);

  const highlightMissing = useCallback((missingId: number) => {
    const idx = pageQuestions.findIndex((q) => q.id === missingId);
    if (idx >= 0) setActiveQuestionIndex(idx);
    setHighlightQuestionId(missingId);
    window.setTimeout(() => {
      setHighlightQuestionId((cur) => (cur === missingId ? null : cur));
    }, 1200);
  }, [pageQuestions]);

  const handleAnswer = useCallback((questionId: number, value: number) => {
    const wasUnanswered = latestAnswersRef.current[questionId] === undefined;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (!autoAdvance || !activeQuestion || activeQuestion.id !== questionId) return;

    window.setTimeout(() => {
      if (canGoForwardWithinPage) {
        const updatedAnswers = { ...latestAnswersRef.current, [questionId]: value };
        const nextUnanswered = pageQuestions.findIndex(
          (q, i) => i > activeQuestionIndex && updatedAnswers[q.id] === undefined,
        );
        if (nextUnanswered !== -1) {
          setActiveQuestionIndex(nextUnanswered);
          return;
        }
        const allPageAnswered = pageQuestions.every((q) => updatedAnswers[q.id] !== undefined);
        if (!allPageAnswered) return;
        if (!isLastPage) setCurrentPage((p) => p + 1);
        return;
      }
      if (!isLastPage && wasUnanswered) {
        setCurrentPage((p) => p + 1);
      }
    }, 130);
  }, [
    autoAdvance, activeQuestion, activeQuestionIndex,
    canGoForwardWithinPage, pageQuestions, isLastPage,
  ]);

  const handleNextStep = useCallback(() => {
    if (activeQuestion && answers[activeQuestion.id] === undefined) {
      highlightMissing(activeQuestion.id);
      return;
    }
    if (canGoForwardWithinPage) {
      const nextUnanswered = pageQuestions.findIndex(
        (q, i) => i > activeQuestionIndex && answers[q.id] === undefined,
      );
      setActiveQuestionIndex(nextUnanswered !== -1 ? nextUnanswered : activeQuestionIndex + 1);
      return;
    }
    if (!canGoNext) {
      const missing = pageQuestions.find((q) => answers[q.id] === undefined);
      if (missing) highlightMissing(missing.id);
      return;
    }
    if (!isLastPage) {
      setCurrentPage((p) => p + 1);
    }
  }, [
    activeQuestion, answers, canGoForwardWithinPage,
    activeQuestionIndex, pageQuestions, canGoNext, isLastPage, highlightMissing,
  ]);

  const handlePrevStep = useCallback(() => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex((i) => i - 1);
      return;
    }
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
      initializedFocusPage.current = null;
    }
  }, [activeQuestionIndex, currentPage]);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== "assessment") return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (activeQuestion && ["1", "2", "3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        handleAnswer(activeQuestion.id, Number(e.key));
        return;
      }
      if (e.key === "Enter") { e.preventDefault(); handleNextStep(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, activeQuestion, handleAnswer, handleNextStep]);

  const handleSubmit = async () => {
    const missing = questions.find((q) => answers[q.id] === undefined);
    if (missing) {
      const targetPage = Math.floor(questions.indexOf(missing) / QUESTIONS_PER_PAGE);
      setCurrentPage(targetPage);
      initializedFocusPage.current = null;
      setHighlightQuestionId(missing.id);
      window.setTimeout(() => setHighlightQuestionId((c) => (c === missing.id ? null : c)), 1200);
      showToast(t("candidate.answerAllError", locale), "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([qId, val]) => ({
          questionId: Number(qId),
          value: val,
        })),
      };
      const res = await fetch(`/api/candidate/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        nextPath?: string | null;
      };
      if (!res.ok) {
        if (data.error === "ALREADY_USED") {
          setPhase("done");
          return;
        }
        throw new Error(data.error ?? "SUBMIT_ERROR");
      }
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
      // Opcionális 2. lépés: csapatszerep-kérdőív (átugorható) — a
      // nextPath-redirect előtt, hogy a válasz még ehhez a tokenhez kösse.
      if (includeTeamRole) {
        setPhase("teamRole");
        return;
      }
      if (data.nextPath) {
        router.push(data.nextPath);
        return;
      }
      setPhase("done");
    } catch (err) {
      log.warn({ event: "candidate.submit_failed", err }, "Candidate flow error");
      showToast(t("candidate.submitError", locale), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Intro screen
  if (phase === "intro") {
    return (
      <div className="min-h-dvh bg-cream">
        <div className="mx-auto max-w-2xl px-4 py-12 md:py-16">
          <div className="rounded-2xl border border-sand bg-white p-8 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-widest text-bronze">
              {t("candidate.introEyebrow", locale)}
            </p>
            <h1 className="mt-3 font-fraunces text-2xl text-ink md:text-3xl">
              {position
                ? tf("candidate.introTitlePosition", locale, { position })
                : t("candidate.introTitleGeneric", locale)}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ink-body">
              {tf("candidate.introBody", locale, { count: totalQuestions, minutes: estimateAssessmentMinutes(totalQuestions) })}
            </p>
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
              {t("candidate.introAutoSave", locale)}
            </div>
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-sand bg-cream p-4 text-sm text-ink-body">
              <div className="flex items-center gap-2">
                <span className="text-bronze">✓</span>
                {t("candidate.introNoReg", locale)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bronze">✓</span>
                {tf("candidate.introScale", locale, { count: totalQuestions })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bronze">✓</span>
                {t("candidate.introConfidential", locale)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPhase("assessment")}
              className="mt-6 min-h-[48px] w-full rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark"
            >
              {t("candidate.introStartCta", locale)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Opcionális csapatszerep-kérdőív (2. lépés) — átugorható
  if (phase === "teamRole") {
    const submitTeamRole = async (selections: Record<string, 1 | 2>) => {
      setTeamRoleSubmitting(true);
      try {
        const res = await fetch(`/api/candidate/${token}/team-role`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selections }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          // Már beküldött / visszavont állapotnál csendben zárunk —
          // a jelölt szempontjából a folyamat kész.
          if (data.error !== "ALREADY_USED" && data.error !== "REVOKED") {
            throw new Error(data.error ?? "SUBMIT_ERROR");
          }
        }
        setPhase("done");
      } catch (err) {
        log.warn({ event: "candidate.submit_failed", err }, "Candidate flow error");
        showToast(t("candidate.submitError", locale), "error");
      } finally {
        setTeamRoleSubmitting(false);
      }
    };

    return (
      <div className="min-h-dvh bg-cream">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <div className="mb-5 rounded-xl border border-sage-ring bg-sage-ghost px-4 py-3 text-sm leading-relaxed text-ink-body">
            {locale === "en"
              ? "Thanks — your assessment is in! One optional step remains: a short team-role questionnaire (~3 minutes). You can skip it."
              : "Köszönjük — a felmérésed megérkezett! Egy opcionális lépés maradt: egy rövid csapatszerep-kérdőív (~3 perc). Ki is hagyhatod."}
          </div>
          <TeamRoleQuestionnaire
            locale={locale}
            perspective="self"
            withIntro
            submitting={teamRoleSubmitting}
            onComplete={(selections) => void submitTeamRole(selections)}
            onSkip={() => setPhase("done")}
          />
        </div>
      </div>
    );
  }

  // Done screen
  if (phase === "done") {
    return (
      <div className="min-h-dvh bg-cream">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">🙏</div>
            <h1 className="mt-4 font-fraunces text-2xl text-ink">
              {t("candidate.doneTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {t("candidate.doneBody", locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Revoked screen
  if (phase === "revoked") {
    return (
      <div className="min-h-dvh bg-cream">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-sand bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">🔒</div>
            <h1 className="mt-4 font-fraunces text-2xl text-ink">
              {t("candidate.revokedTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {t("candidate.revokedBody", locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Assessment screen
  const remainingQuestions = Math.max(totalQuestions - answeredCount, 0);
  const etaMinutes = Math.max(1, Math.ceil((remainingQuestions * 15) / 60));
  const currentQuestionAnswered = !activeQuestion || answers[activeQuestion.id] !== undefined;

  return (
    <div className="min-h-dvh bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">

        {/* Sticky progress bar */}
        <div className="sticky top-2 z-20 mb-6 rounded-2xl border border-sand bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <ProgressBar current={answeredCount} total={totalQuestions} />
          <div className="mt-2 flex items-center gap-2 text-xs text-muted">
            <span className="rounded-md bg-warm-mid px-2 py-1 whitespace-nowrap">
              {tf("candidate.etaRemaining", locale, { minutes: etaMinutes })}
            </span>
            {position && (
              <span className="hidden truncate sm:block">
                {position}
              </span>
            )}
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-sand bg-cream px-4 py-2.5 text-center text-sm text-ink-body">
          {t("candidate.answerHint", locale)}
        </div>

        {/* Auto-advance toggle */}
        <div className="mb-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-sand bg-white px-3 py-2 text-xs text-ink-body">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="h-4 w-4 rounded border-sand"
            />
            {t("candidate.autoAdvance", locale)}
          </label>
        </div>

        {/* Questions */}
        <div ref={questionAreaRef}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`candidate-${currentPage}-${activeQuestion?.id ?? "none"}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {activeQuestion && isLikertQuestion(activeQuestion) && (
                <div key={activeQuestion.id} id={`candidate-question-${activeQuestion.id}`}>
                  <QuestionCard
                    testName={testName}
                    dimension={activeQuestion.dimension}
                    format="likert"
                    question={activeQuestion.text}
                    value={(answers[activeQuestion.id] as number) ?? null}
                    onChange={(v) => handleAnswer(activeQuestion.id, v)}
                    highlight={highlightQuestionId === activeQuestion.id}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <motion.button
            onClick={handlePrevStep}
            disabled={!canGoPrev}
            className={`min-h-[48px] rounded-lg px-6 text-sm font-semibold transition-all ${
              !canGoPrev
                ? "cursor-not-allowed bg-sand text-muted"
                : "border border-sand bg-white text-ink-body hover:border-sage/40 hover:text-bronze"
            }`}
            whileHover={canGoPrev ? { scale: 1.02 } : {}}
            whileTap={canGoPrev ? { scale: 0.98 } : {}}
          >
            {t("candidate.back", locale)}
          </motion.button>

          {isLastPage && canGoNext ? (
            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`min-h-[48px] rounded-lg px-6 text-sm font-semibold transition-all ${
                !isSubmitting
                  ? "bg-sage text-white hover:bg-sage-dark"
                  : "bg-sand text-muted"
              }`}
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            >
              {isSubmitting
                ? t("candidate.submitting", locale)
                : t("candidate.submit", locale)}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleNextStep}
              disabled={isSubmitting}
              aria-disabled={!currentQuestionAnswered || isSubmitting}
              className={`min-h-[48px] rounded-lg px-6 text-sm font-semibold transition-all ${
                currentQuestionAnswered && !isSubmitting
                  ? "bg-sage text-white hover:bg-sage-dark"
                  : "cursor-not-allowed bg-sand text-muted"
              }`}
              whileHover={currentQuestionAnswered && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={currentQuestionAnswered && !isSubmitting ? { scale: 0.98 } : {}}
            >
              {t("candidate.next", locale)}
            </motion.button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          {t("candidate.scaleHint", locale)}
        </p>
      </div>
    </div>
  );
}
