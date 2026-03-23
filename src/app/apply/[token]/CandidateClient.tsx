"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressBar } from "@/components/assessment/ProgressBar";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { useToast } from "@/components/ui/Toast";
import type { Question } from "@/lib/questions";
import { isLikertQuestion } from "@/lib/questions";
import type { Locale } from "@/lib/i18n";

const QUESTIONS_PER_PAGE = 10;

interface CandidateClientProps {
  token: string;
  position?: string;
  testName: string;
  questions: Question[];
  locale: Locale;
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
}: CandidateClientProps) {
  const { showToast } = useToast();
  const isHu = locale !== "en";

  const DRAFT_KEY = `trita_candidate_draft_${token}`;

  const [phase, setPhase] = useState<"intro" | "assessment" | "done" | "revoked">("intro");
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
      showToast(isHu ? "Kérjük, válaszolj minden kérdésre." : "Please answer all questions.", "error");
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
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        if (data.error === "ALREADY_USED") {
          setPhase("done");
          return;
        }
        throw new Error(data.error ?? "SUBMIT_ERROR");
      }
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
      setPhase("done");
    } catch (err) {
      console.error(err);
      showToast(
        isHu
          ? "Hiba történt a beküldés során. Kérjük, próbáld újra."
          : "An error occurred while submitting. Please try again.",
        "error",
      );
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
              {isHu ? "// személyiségfelmérés" : "// personality assessment"}
            </p>
            <h1 className="mt-3 font-fraunces text-2xl text-ink md:text-3xl">
              {position
                ? (isHu ? `${position} pozíció` : `${position} position`)
                : (isHu ? "Személyiségfelmérés" : "Personality Assessment")}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ink-body">
              {isHu
                ? `Ez a felmérés ${totalQuestions} kérdésből áll, és körülbelül 15–20 percet vesz igénybe. Kérjük, válaszolj őszintén, az első benyomásod alapján.`
                : `This assessment contains ${totalQuestions} questions and takes approximately 15–20 minutes. Please answer honestly based on your first impression.`}
            </p>
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
              {isHu
                ? "A válaszaidat automatikusan mentjük — ha megszakad a kitöltés, onnan folytathatod, ahol abbahagytad."
                : "Your answers are saved automatically — if you stop and return, you can continue where you left off."}
            </div>
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-sand bg-cream p-4 text-sm text-ink-body">
              <div className="flex items-center gap-2">
                <span className="text-bronze">✓</span>
                {isHu ? "Regisztráció nem szükséges" : "No registration required"}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bronze">✓</span>
                {isHu
                  ? `${totalQuestions} kérdés, 1–5-ös skálán`
                  : `${totalQuestions} questions, rated on a 1–5 scale`}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-bronze">✓</span>
                {isHu ? "Bizalmas adatkezelés" : "Confidential data handling"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPhase("assessment")}
              className="mt-6 min-h-[48px] w-full rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark"
            >
              {isHu ? "Felmérés megkezdése" : "Start assessment"}
            </button>
          </div>
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
              {isHu ? "Köszönjük a kitöltést!" : "Thank you for completing the assessment!"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {isHu
                ? "A válaszaid sikeresen beküldtük. A szervező hamarosan értesítést kap az eredményekről."
                : "Your answers have been successfully submitted. The organiser will be notified of the results shortly."}
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
              {isHu ? "A meghívó visszavonva" : "Invitation revoked"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {isHu
                ? "Ezt a meghívót visszavonták. Ha kérdésed van, vedd fel a kapcsolatot a szervezővel."
                : "This invitation has been revoked. Please contact the organiser if you have any questions."}
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
              {isHu ? `~${etaMinutes} perc hátra` : `~${etaMinutes} min remaining`}
            </span>
            {position && (
              <span className="hidden truncate sm:block">
                {position}
              </span>
            )}
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-sand bg-cream px-4 py-2.5 text-center text-sm text-ink-body">
          {isHu
            ? "Válaszolj úgy, ahogy általában gondolkodsz és viselkedsz."
            : "Answer based on how you generally think and behave."}
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
            {isHu ? "Automatikus továbblépés" : "Auto-advance"}
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
            {isHu ? "Vissza" : "Back"}
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
                ? (isHu ? "Beküldés..." : "Submitting...")
                : (isHu ? "Beküldés" : "Submit")}
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
              {isHu ? "Tovább" : "Next"}
            </motion.button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          {isHu
            ? "Az 1–5 skálán: 1 = Egyáltalán nem értek egyet, 5 = Teljes mértékben egyetértek"
            : "On the 1–5 scale: 1 = Strongly disagree, 5 = Strongly agree"}
        </p>
      </div>
    </div>
  );
}
