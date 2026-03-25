'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { QuestionCard } from '@/components/assessment/QuestionCard'
import { EvaluatingScreen } from '@/components/assessment/EvaluatingScreen'
import { useToast } from '@/components/ui/Toast'
import { useLocale } from '@/components/LocaleProvider'
import { t, tf } from '@/lib/i18n'
import type { TestType } from '@prisma/client'
type AssessmentQuestion = { id: number; text: string }


interface AssessmentClientProps {
  testType: TestType
  testName: string
  totalQuestions: number
  questions: AssessmentQuestion[]
  initialDraft?: { answers: Record<string, number>; currentPage: number }
  clearDraft?: boolean
  guestMode?: boolean
}

export function AssessmentClient({
  testType,
  testName,
  totalQuestions,
  questions,
  initialDraft,
  clearDraft = false,
  guestMode = false,
}: AssessmentClientProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const { locale } = useLocale()
  const draftKey = `trita_draft_${testType}`

  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    if (initialDraft?.answers && Object.keys(initialDraft.answers).length > 0) {
      const parsed: Record<number, number> = {}
      for (const [k, v] of Object.entries(initialDraft.answers)) {
        parsed[Number(k)] = v
      }
      return parsed
    }
    return {}
  })
  const [questionIndex, setQuestionIndex] = useState(0) // single flat index 0..totalQuestions-1
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [evaluationProgress, setEvaluationProgress] = useState(0)
  const [highlightQuestionId, setHighlightQuestionId] = useState<number | null>(null)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [checkpoint, setCheckpoint] = useState<number | null>(null)
  // null = not yet determined (avoid flash), true = show intro, false = skip
  const [showIntro, setShowIntro] = useState<boolean | null>(() => {
    const hasServerDraft = initialDraft && Object.keys(initialDraft.answers ?? {}).length > 0
    if (hasServerDraft) return false
    return null // will resolve in useEffect after hydration
  })

  // After hydration, check localStorage for guest draft and resolve showIntro
  useEffect(() => {
    if (showIntro !== null) return
    try {
      const saved = localStorage.getItem(`trita_draft_${testType}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        const draftAnswers = parsed?.answers ?? parsed
        if (draftAnswers && Object.keys(draftAnswers).length > 0) {
          setShowIntro(false)
          return
        }
      }
    } catch { /* ignore */ }
    setShowIntro(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const reachedCheckpoints = useRef<Set<number>>(new Set(
    initialDraft?.answers && Object.keys(initialDraft.answers).length > 0
      ? ([25, 50, 75] as const).filter(
          (m) => (Object.keys(initialDraft.answers).length / totalQuestions) * 100 >= m,
        )
      : [],
  ))

  const answeredCount = Object.keys(answers).length
  const isFullyCompleted = answeredCount >= totalQuestions
  const remainingQuestions = Math.max(totalQuestions - answeredCount, 0)
  const etaMinutes = Math.max(1, Math.ceil((remainingQuestions * 15) / 60))
  const activeQuestion = questions[questionIndex] ?? null
  const isLastQuestion = questionIndex === totalQuestions - 1
  const canGoPrev = questionIndex > 0
  const currentQuestionAnswered = !activeQuestion || answers[activeQuestion.id] !== undefined
  const checkpointActive = checkpoint !== null
  const canProceed = checkpointActive || currentQuestionAnswered
  const showEvaluateButton = !checkpointActive && isFullyCompleted

  // Refs to always have the latest values in async callbacks
  const latestAnswersRef = useRef(answers)
  useEffect(() => { latestAnswersRef.current = answers }, [answers])

  const questionAreaRef = useRef<HTMLDivElement>(null)

  // Load localStorage draft after hydration (only if no server draft and not a fresh retake)
  useEffect(() => {
    if (clearDraft) {
      localStorage.removeItem(draftKey)
      return
    }
    if (initialDraft?.answers && Object.keys(initialDraft.answers).length > 0) {
      localStorage.removeItem(draftKey)
      // Jump to last answered question from server draft
      const answeredIds = new Set(Object.keys(initialDraft.answers).map(Number))
      let lastAnswered = 0
      for (let i = questions.length - 1; i >= 0; i--) {
        if (answeredIds.has(questions[i].id)) { lastAnswered = i; break }
      }
      setQuestionIndex(lastAnswered)
      return
    }
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        const draftAnswers = parsed?.answers ?? (typeof parsed === 'object' ? parsed : {})
        if (draftAnswers && Object.keys(draftAnswers).length > 0) {
          const numericAnswers: Record<number, number> = {}
          for (const [k, v] of Object.entries(draftAnswers)) numericAnswers[Number(k)] = v as number
          setAnswers(numericAnswers)
          // Jump to first unanswered question
          // Jump to the last answered question so the user sees where they left off
          let lastAnswered = 0
          for (let i = questions.length - 1; i >= 0; i--) {
            if (numericAnswers[questions[i].id] !== undefined) { lastAnswered = i; break }
          }
          setQuestionIndex(lastAnswered)
          const pct = (Object.keys(numericAnswers).length / totalQuestions) * 100
          for (const m of [25, 50, 75] as const) {
            if (pct >= m) reachedCheckpoints.current.add(m)
          }
        }
      }
    } catch {
      // ignore
    }
  }, [draftKey, initialDraft?.answers, clearDraft]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save draft to localStorage on every answer change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(draftKey, JSON.stringify({ answers, questionIndex }))
    }
  }, [answers, questionIndex, draftKey])

  // Debounced server save (2 s) — skip for guest users
  const serverSaveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (guestMode) return
    if (Object.keys(answers).length === 0) return
    if (serverSaveDebounce.current) clearTimeout(serverSaveDebounce.current)
    serverSaveDebounce.current = setTimeout(async () => {
      try {
        await fetch('/api/assessment/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: latestAnswersRef.current,
            currentPage: 0,
          }),
        })
      } catch {
        // Silent fail
      }
    }, 2000)
    return () => {
      if (serverSaveDebounce.current) clearTimeout(serverSaveDebounce.current)
    }
  }, [answers])

  // No beforeunload warning — answers are auto-saved to localStorage

  useEffect(() => {
    const marks = [25, 50, 75]
    const percentage = (answeredCount / totalQuestions) * 100
    const nextMark = marks.find(
      (mark) => percentage >= mark && !reachedCheckpoints.current.has(mark),
    )
    if (!nextMark) return
    reachedCheckpoints.current.add(nextMark)
    setCheckpoint(nextMark)
  }, [answeredCount, totalQuestions])

  const highlightMissing = useCallback(
    (missingId: number) => {
      setHighlightQuestionId(missingId)
      window.setTimeout(() => {
        setHighlightQuestionId((current) => (current === missingId ? null : current))
      }, 1200)
    },
    [],
  )

  const handleFinish = useCallback(async () => {
    // Cancel any pending debounced draft save so it doesn't re-create the draft after submit deletes it
    if (serverSaveDebounce.current) {
      clearTimeout(serverSaveDebounce.current)
      serverSaveDebounce.current = null
    }

    const currentAnswers = latestAnswersRef.current
    if (Object.keys(currentAnswers).length < totalQuestions) {
      // Find first unanswered and go there
      const firstUnanswered = questions.findIndex((q) => currentAnswers[q.id] === undefined)
      if (firstUnanswered !== -1) setQuestionIndex(firstUnanswered)
      return
    }
    if (isSubmitting) return
    setIsSubmitting(true)
    setEvaluationProgress(0)

    const progressInterval = setInterval(() => {
      setEvaluationProgress((prev) => {
        if (prev >= 70) return prev
        return prev + Math.random() * 4 + 1
      })
    }, 300)

    try {
      if (guestMode) {
        // Guest mode: skip API submit, keep localStorage draft, redirect to registration gate
        clearInterval(progressInterval)
        const rampInterval = setInterval(() => {
          setEvaluationProgress((prev) => {
            if (prev >= 100) { clearInterval(rampInterval); return 100 }
            return prev + Math.random() * 4 + 2
          })
        }, 200)
        await new Promise((resolve) => setTimeout(resolve, 2500))
        clearInterval(rampInterval)
        setEvaluationProgress(100)
        await new Promise((resolve) => setTimeout(resolve, 400))
        router.push('/try/complete')
        return
      }

      const payload = {
        testType,
        answers: Object.entries(currentAnswers).map(([questionId, value]) => ({
          questionId: Number(questionId),
          value,
        })),
      }
      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errBody = await response.json().catch(() => null)
        console.error('[submit] API error', response.status, JSON.stringify(errBody))
        throw new Error(t('assessment.saveResultError', locale))
      }

      clearInterval(progressInterval)
      localStorage.removeItem(draftKey)

      const rampInterval = setInterval(() => {
        setEvaluationProgress((prev) => {
          if (prev >= 100) { clearInterval(rampInterval); return 100 }
          return prev + Math.random() * 3 + 1
        })
      }, 200)

      await new Promise((resolve) => setTimeout(resolve, 4000))
      clearInterval(rampInterval)
      setEvaluationProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 600))
      router.push('/assessment/belbin')
    } catch (error) {
      clearInterval(progressInterval)
      setIsSubmitting(false)
      setEvaluationProgress(0)
      console.error(error)
      showToast(t('assessment.saveError', locale), 'error')
    }
  }, [questions, isSubmitting, totalQuestions, testType, locale, draftKey, router, showToast])

  const handleAnswer = useCallback((questionId: number, value: number) => {
    const updatedAnswers = { ...answers, [questionId]: value }
    const wasUnanswered = answers[questionId] === undefined
    setAnswers(updatedAnswers)

    if (!autoAdvance || !activeQuestion || activeQuestion.id !== questionId) return

    const nextAnsweredCount = wasUnanswered ? answeredCount + 1 : answeredCount
    const nextProgress = (nextAnsweredCount / totalQuestions) * 100
    const willTriggerCheckpoint = [25, 50, 75].some(
      (mark) => nextProgress >= mark && !reachedCheckpoints.current.has(mark),
    )

    window.setTimeout(() => {
      if (willTriggerCheckpoint) return

      if (questionIndex < totalQuestions - 1) {
        setQuestionIndex((idx) => idx + 1)
      } else {
        void handleFinish()
      }
    }, 130)
  }, [answers, autoAdvance, activeQuestion, answeredCount, totalQuestions, questionIndex, handleFinish])

  const handlePrevStep = useCallback(() => {
    if (checkpointActive) {
      setCheckpoint(null)
      return
    }
    if (questionIndex > 0) {
      setQuestionIndex((idx) => idx - 1)
    }
  }, [checkpointActive, questionIndex])

  const handleNextStep = useCallback(async () => {
    if (checkpointActive) {
      setCheckpoint(null)
      if (questionIndex < totalQuestions - 1) {
        setQuestionIndex((idx) => idx + 1)
      }
      return
    }
    if (activeQuestion && answers[activeQuestion.id] === undefined) {
      highlightMissing(activeQuestion.id)
      return
    }
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex((idx) => idx + 1)
    } else {
      await handleFinish()
    }
  }, [checkpointActive, activeQuestion, answers, highlightMissing, questionIndex, totalQuestions, handleFinish])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isSubmitting) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return

      if (!checkpointActive && activeQuestion && ['1', '2', '3', '4', '5'].includes(event.key)) {
        event.preventDefault()
        handleAnswer(activeQuestion.id, Number(event.key))
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        void handleNextStep()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [checkpointActive, activeQuestion, isSubmitting, handleNextStep, handleAnswer])

  if (isSubmitting) {
    return <EvaluatingScreen progress={evaluationProgress} />
  }

  // Still resolving localStorage — show blank screen to avoid intro flash
  if (showIntro === null) {
    return <div className="min-h-dvh bg-[#f7f4ef]" />;
  }

  if (showIntro) {
    const steps = [
      { num: 1, style: "bg-[#3d6b5e] text-white", title: t("assessment.introStep1", locale), sub: t("assessment.introStep1Sub", locale) },
      { num: 2, style: "bg-[#fdf5ee] text-[#8a5530]", title: t("assessment.introStep2", locale), sub: t("assessment.introStep2Sub", locale) },
      { num: 3, style: "bg-[#f2ede6] text-[#8a8a9a]", title: t("assessment.introStep3", locale), sub: t("assessment.introStep3Sub", locale) },
    ]
    const previewDims = [
      { name: t("landing.selfDim1", locale), val: 79 },
      { name: t("landing.selfDim2", locale), val: 46 },
      { name: t("landing.selfDim3", locale), val: 34 },
    ]
    return (
      <div className="min-h-dvh bg-[#f7f4ef]">
        {/* Minimal nav */}
        <nav className="flex items-center justify-between bg-[rgba(250,249,246,0.95)] px-6 py-3 backdrop-blur-[12px] sm:px-10 lg:px-16">
          <a href="/" className="font-fraunces text-2xl font-black tracking-[-0.03em] text-[#1a1a2e]">
            <span className="text-[#3d6b5e]">t</span>rit<span className="text-[#c17f4a]">a</span>
          </a>
        </nav>

        {/* Two-column hero */}
        <div className="mx-auto max-w-4xl px-5 lg:px-10">
          <div className="grid grid-cols-1 items-start gap-8 py-10 lg:grid-cols-[1.2fr_1fr] lg:gap-10 lg:py-14">

            {/* Left column */}
            <div>
              <div className="mb-2.5 flex items-center gap-2">
                <div className="h-px w-4 bg-[#c17f4a]" />
                <span className="text-[9px] font-medium uppercase tracking-[2px] text-[#c17f4a]">
                  {t("assessment.introEyebrow", locale)}
                </span>
              </div>
              <h1 className="mb-3 font-fraunces text-[26px] leading-[1.15] tracking-tight text-[#1a1a2e] lg:text-[28px]">
                {t("assessment.introHeadline1", locale)}
                <em className="not-italic text-[#c17f4a]">{t("assessment.introHeadlineEm", locale)}</em>
              </h1>
              <p className="mb-5 max-w-[360px] text-sm leading-relaxed text-[#8a8a9a]">
                {t("assessment.introSub", locale)}
              </p>
              <div className="mb-5 rounded-r-lg border-l-2 border-[#3d6b5e] bg-[#e8f2f0] px-3.5 py-3">
                <p className="text-xs leading-relaxed text-[#1e3d34]">
                  {t("assessment.introInfo", locale)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIntro(false)}
                className="w-full rounded-[10px] bg-[#3d6b5e] px-8 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-[#3d6b5e]/20 transition-all hover:-translate-y-px hover:brightness-[1.06] hover:shadow-lg lg:w-auto"
              >
                {t("assessment.introStart", locale)}
              </button>
              <p className="mt-2.5 text-center text-[11px] text-[#8a8a9a] lg:text-left">
                {t("assessment.introMeta", locale)}
              </p>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-2.5">
              {steps.map((s) => (
                <div key={s.num} className="flex items-start gap-2.5 rounded-[10px] border border-[#e8e0d3] bg-white p-3 px-3.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-fraunces text-[13px] font-medium ${s.style}`}>
                    {s.num}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1a1a2e]">{s.title}</p>
                    <p className="text-[11px] leading-[1.4] text-[#8a8a9a]">{s.sub}</p>
                  </div>
                </div>
              ))}
              <div className="mt-1 rounded-[10px] bg-gradient-to-br from-[#2a5244] via-[#1e3d34] to-[#1a2e28] px-4 py-3.5">
                <p className="text-[6px] uppercase tracking-[1.5px] text-white/20">
                  {t("assessment.introPreviewEyebrow", locale)}
                </p>
                <p className="mt-0.5 font-fraunces text-sm font-medium italic text-[#e8a96a]">
                  {t("landing.selfPanelType", locale)}
                </p>
                <div className="mt-2 flex gap-1.5">
                  {previewDims.map((d) => (
                    <div key={d.name} className="flex-1 rounded bg-white/[0.05] px-1 py-1 text-center">
                      <p className="text-[5px] text-white/20">{d.name}</p>
                      <p className="font-fraunces text-xs text-white/[0.35]">{d.val}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-center text-[7px] text-white/[0.15]">
                  {t("assessment.introPreviewLabel", locale)}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f4ef]">
      {/* ═══ MINIMAL NAV ═══ */}
      <nav className="flex shrink-0 items-center justify-between bg-[rgba(250,249,246,0.95)] px-6 py-3 backdrop-blur-[12px] sm:px-10 lg:px-16">
        <a href="/" className="font-fraunces text-2xl font-black tracking-[-0.03em] text-[#1a1a2e]">
          <span className="text-[#3d6b5e]">t</span>rit<span className="text-[#c17f4a]">a</span>
        </a>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#3d6b5e]">
            ✓ {isSavingDraft ? t('actions.save', locale) : t('assessment.savedState', locale)}
          </span>
          <a
            href={guestMode ? "/" : "/profile/results"}
            className="rounded-md border border-[#e8e0d3] bg-white px-3 py-1.5 text-[11px] text-[#8a8a9a] transition-all hover:bg-[#f2ede6] hover:text-[#4a4a5e]"
          >
            {t('assessment.continueLater', locale)}
          </a>
        </div>
      </nav>

      {/* ═══ PROGRESS BAR — single row ═══ */}
      <div className="flex shrink-0 items-center gap-4 border-b border-[#e8e0d3] px-7 py-2.5">
        <div className="flex items-baseline gap-1">
          <span className="font-fraunces text-base font-medium text-[#1a1a2e]">{questionIndex + 1}</span>
          <span className="text-xs text-[#8a8a9a]">/ {totalQuestions}</span>
        </div>
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[#e8e0d3]">
          {/* Answered reach — light sage: up to last answered question position */}
          {(() => {
            let lastAnsweredIdx = -1;
            for (let i = questions.length - 1; i >= 0; i--) {
              if (answers[questions[i].id] !== undefined) { lastAnsweredIdx = i; break; }
            }
            const answeredReach = Math.max(lastAnsweredIdx + 1, questionIndex + 1);
            return (
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#3d6b5e]/30 transition-all duration-300"
                style={{ width: `${(answeredReach / totalQuestions) * 100}%` }}
              />
            );
          })()}
          {/* Current position — solid sage */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[#3d6b5e] transition-all duration-300"
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-[11px] text-[#8a8a9a]">
          {tf('assessment.etaRemaining', locale, { minutes: etaMinutes })}
        </span>
      </div>

      {/* ═══ QUESTION AREA (centered) ═══ */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 lg:py-12">
        <div ref={questionAreaRef} className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={
                checkpointActive
                  ? `checkpoint-${checkpoint}`
                  : `q-${activeQuestion?.id ?? 'none'}`
              }
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              {checkpointActive ? (
                <div className="flex flex-col items-center text-center">
                  {/* Sage pill badge */}
                  <div className="mb-4 inline-flex items-center gap-[5px] rounded-full bg-[#e8f2f0] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-[#3d6b5e]">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3d6b5e]" />
                    {t('assessment.journeyMilestone', locale)}
                  </div>

                  {/* Title */}
                  <h2 className="mb-3 font-fraunces text-[24px] leading-[1.25] text-[#1a1a2e] lg:text-[26px]">
                    {t(
                      checkpoint === 25 ? 'assessment.journeyMilestone25'
                      : checkpoint === 50 ? 'assessment.journeyMilestone50'
                      : 'assessment.journeyMilestone75',
                      locale
                    )}
                  </h2>

                  {/* Subtitle */}
                  <p className="mb-5 max-w-[400px] text-[14px] leading-relaxed text-[#8a8a9a]">
                    {t(
                      checkpoint === 25 ? 'assessment.journeyMilestone25Sub'
                      : checkpoint === 50 ? 'assessment.journeyMilestone50Sub'
                      : 'assessment.journeyMilestone75Sub',
                      locale
                    )}
                  </p>

                  {/* Segmented progress — 10 segments */}
                  <div className="mb-5 flex w-full max-w-[280px] gap-[3px]">
                    {Array.from({ length: 10 }, (_, i) => {
                      const filledSegments = Math.round((answeredCount / totalQuestions) * 10);
                      return (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full ${
                            i < filledSegments
                              ? "bg-[#3d6b5e]"
                              : i === filledSegments
                                ? "bg-[#c17f4a]"
                                : "bg-[#e8e0d3]"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Tip callout */}
                  <div className="flex w-full max-w-[400px] items-start gap-2 rounded-lg bg-[#e8f2f0] px-4 py-3 text-left">
                    <span className="mt-px shrink-0 text-sm">💡</span>
                    <p className="text-[13px] leading-[1.45] text-[#1e3d34]">
                      {t(
                        checkpoint === 25 ? 'assessment.journeyMilestone25Hint'
                        : checkpoint === 50 ? 'assessment.journeyMilestone50Hint'
                        : 'assessment.journeyMilestone75Hint',
                        locale
                      )}
                    </p>
                  </div>
                </div>
              ) : activeQuestion ? (
                <QuestionCard
                  testName={testName}
                  format="likert"
                  question={activeQuestion.text}
                  value={(answers[activeQuestion.id] as number) ?? null}
                  onChange={(v) => handleAnswer(activeQuestion.id, v)}
                  highlight={highlightQuestionId === activeQuestion.id}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hint */}
        <p className="mt-6 text-xs italic text-[#8a8a9a]">
          {t('assessment.helpLikert', locale)}
        </p>
      </div>

      {/* ═══ FOOTER BAR ═══ */}
      <div className="flex shrink-0 items-center justify-between border-t border-[#e8e0d3] bg-white px-7 py-3 shadow-[0_-1px_4px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={!canGoPrev}
          className={`min-h-[44px] rounded-lg border px-5 py-2.5 text-[13px] transition-all ${
            canGoPrev
              ? "border-[#e8e0d3] bg-white text-[#4a4a5e] hover:bg-[#f2ede6]"
              : "border-transparent bg-transparent text-transparent pointer-events-none"
          }`}
        >
          ← {t('assessment.prevCta', locale)}
        </button>

        <label className="flex cursor-pointer items-center gap-2">
          <div
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border-[1.5px] transition-all ${
              autoAdvance ? "border-[#3d6b5e] bg-[#3d6b5e]" : "border-[#e8e0d3] bg-white"
            }`}
          >
            {autoAdvance && <span className="text-[8px] leading-none text-white">✓</span>}
          </div>
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => setAutoAdvance(e.target.checked)}
            className="sr-only"
          />
          <span className="text-[11px] text-[#8a8a9a]">{t('assessment.autoAdvance', locale)}</span>
        </label>

        {!showEvaluateButton ? (
          <button
            type="button"
            onClick={() => void handleNextStep()}
            disabled={!canProceed || isSavingDraft}
            className={`min-h-[44px] rounded-lg px-6 py-2.5 text-[13px] font-semibold transition-all ${
              canProceed && !isSavingDraft
                ? "bg-[#3d6b5e] text-white shadow-sm shadow-[#3d6b5e]/15 hover:brightness-[1.06]"
                : "bg-[#3d6b5e]/30 text-white/50"
            }`}
          >
            {t('assessment.nextCta', locale)} →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleFinish()}
            disabled={isSubmitting}
            className={`min-h-[44px] rounded-lg px-6 py-2.5 text-[13px] font-semibold transition-all ${
              !isSubmitting
                ? "bg-[#3d6b5e] text-white shadow-sm shadow-[#3d6b5e]/15 hover:brightness-[1.06]"
                : "bg-[#3d6b5e]/30 text-white/50"
            }`}
          >
            {t('assessment.evaluateCta', locale)}
          </button>
        )}
      </div>
    </div>
  )
}
