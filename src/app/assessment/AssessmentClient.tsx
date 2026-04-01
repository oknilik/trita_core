'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QuestionCard } from '@/components/assessment/QuestionCard'
import { EvaluatingScreen } from '@/components/assessment/EvaluatingScreen'
import { useToast } from '@/components/ui/Toast'
import { useLocale } from '@/components/LocaleProvider'
import { t, tf } from '@/lib/i18n'
import {
  clearAssessmentDraftFromStorage,
  getAssessmentDraftKey,
  getResumeQuestionIndex,
  readAssessmentDraftFromStorage,
  toAssessmentAnswerPayload,
  writeAssessmentDraftToStorage,
} from '@/lib/assessment-draft'
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
  const orderedQuestionIds = useMemo(() => questions.map((question) => question.id), [questions])
  const questionIdSet = useMemo(() => new Set(orderedQuestionIds), [orderedQuestionIds])
  const draftStorageKey = useMemo(() => getAssessmentDraftKey(testType), [testType])
  const maxQuestionIndex = Math.max(totalQuestions - 1, 0)
  const clampQuestionIndex = useCallback(
    (value: number) => Math.min(Math.max(value, 0), maxQuestionIndex),
    [maxQuestionIndex],
  )

  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    if (initialDraft?.answers && Object.keys(initialDraft.answers).length > 0) {
      const parsed: Record<number, number> = {}
      for (const [k, v] of Object.entries(initialDraft.answers)) {
        const questionId = Number(k)
        if (!Number.isInteger(questionId)) continue
        if (!Number.isInteger(v) || v < 1 || v > 5) continue
        parsed[questionId] = v
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
  const answersRef = useRef(answers)
  const questionIndexRef = useRef(questionIndex)
  const checkpointRef = useRef<number | null>(checkpoint)
  const isSubmittingRef = useRef(isSubmitting)
  const localDraftRevisionRef = useRef(0)
  const autoAdvanceTimerRef = useRef<number | null>(null)
  const stepTransitionLockRef = useRef(false)

  // After hydration, check localStorage for guest draft and resolve showIntro
  useEffect(() => {
    if (showIntro !== null) return
    if (readAssessmentDraftFromStorage({ testType })) {
      setShowIntro(false)
      return
    }
    setShowIntro(true)
  }, [showIntro, testType])
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
  const canGoPrev = questionIndex > 0
  const currentQuestionAnswered = !activeQuestion || answers[activeQuestion.id] !== undefined
  const checkpointActive = checkpoint !== null
  const canProceed = checkpointActive || currentQuestionAnswered
  const showEvaluateButton = !checkpointActive && isFullyCompleted

  // Refs to always have the latest values in async callbacks
  const latestAnswersRef = useRef(answers)
  useEffect(() => {
    latestAnswersRef.current = answers
    answersRef.current = answers
  }, [answers])
  useEffect(() => {
    questionIndexRef.current = questionIndex
  }, [questionIndex])
  useEffect(() => {
    checkpointRef.current = checkpoint
  }, [checkpoint])
  useEffect(() => {
    isSubmittingRef.current = isSubmitting
  }, [isSubmitting])

  const questionAreaRef = useRef<HTMLDivElement>(null)

  const setQuestionIndexSafe = useCallback(
    (updater: number | ((current: number) => number)) => {
      setQuestionIndex((current) => {
        const rawNext = typeof updater === 'function' ? updater(current) : updater
        return clampQuestionIndex(rawNext)
      })
    },
    [clampQuestionIndex],
  )

  // Load localStorage draft after hydration (only if no server draft and not a fresh retake)
  useEffect(() => {
    if (clearDraft) {
      clearAssessmentDraftFromStorage(testType)
      return
    }
    if (initialDraft?.answers && Object.keys(initialDraft.answers).length > 0) {
      clearAssessmentDraftFromStorage(testType)
      localDraftRevisionRef.current = 0
      const parsedAnswers: Record<number, number> = {}
      for (const [key, rawValue] of Object.entries(initialDraft.answers)) {
        const questionId = Number(key)
        const value = Number(rawValue)
        if (!questionIdSet.has(questionId)) continue
        if (!Number.isInteger(value) || value < 1 || value > 5) continue
        parsedAnswers[questionId] = value
      }
      const resumeIndex = getResumeQuestionIndex(orderedQuestionIds, parsedAnswers)
      setQuestionIndexSafe(resumeIndex)
      return
    }
    const localDraft = readAssessmentDraftFromStorage({
      testType,
      questionIds: questionIdSet,
      totalQuestions,
    })
    if (!localDraft) return

    setAnswers(localDraft.answers)
    latestAnswersRef.current = localDraft.answers
    answersRef.current = localDraft.answers
    localDraftRevisionRef.current = localDraft.revision
    const resumeIndex = getResumeQuestionIndex(orderedQuestionIds, localDraft.answers)
    setQuestionIndexSafe(resumeIndex)
    const pct = (Object.keys(localDraft.answers).length / totalQuestions) * 100
    for (const checkpointMark of [25, 50, 75] as const) {
      if (pct >= checkpointMark) reachedCheckpoints.current.add(checkpointMark)
    }
  }, [
    clearDraft,
    initialDraft?.answers,
    orderedQuestionIds,
    questionIdSet,
    setQuestionIndexSafe,
    testType,
    totalQuestions,
  ])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== draftStorageKey) return
      if (!event.newValue) return

      const nextSnapshot = readAssessmentDraftFromStorage({
        testType,
        questionIds: questionIdSet,
        totalQuestions,
      })
      if (!nextSnapshot) return
      if (nextSnapshot.revision < localDraftRevisionRef.current) return

      localDraftRevisionRef.current = nextSnapshot.revision
      setAnswers(nextSnapshot.answers)
      latestAnswersRef.current = nextSnapshot.answers
      answersRef.current = nextSnapshot.answers
      const resumeIndex = getResumeQuestionIndex(orderedQuestionIds, nextSnapshot.answers)
      setQuestionIndexSafe(resumeIndex)
      setShowIntro(false)

      const pct = (Object.keys(nextSnapshot.answers).length / totalQuestions) * 100
      for (const checkpointMark of [25, 50, 75] as const) {
        if (pct >= checkpointMark) reachedCheckpoints.current.add(checkpointMark)
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [draftStorageKey, orderedQuestionIds, questionIdSet, setQuestionIndexSafe, testType, totalQuestions])

  // Save draft to localStorage on every meaningful change.
  useEffect(() => {
    if (answeredCount === 0) {
      clearAssessmentDraftFromStorage(testType)
      return
    }
    localDraftRevisionRef.current += 1
    writeAssessmentDraftToStorage({
      testType,
      answers,
      questionIndex,
      questionIds: questionIdSet,
      totalQuestions,
      revision: localDraftRevisionRef.current,
    })
  }, [answers, answeredCount, questionIdSet, questionIndex, testType, totalQuestions])

  // Debounced server save (2 s) — skip for guest users.
  const serverSaveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const serverSaveAbortRef = useRef<AbortController | null>(null)
  useEffect(() => {
    if (guestMode || answeredCount === 0) return
    if (serverSaveDebounce.current) clearTimeout(serverSaveDebounce.current)
    serverSaveDebounce.current = setTimeout(async () => {
      serverSaveAbortRef.current?.abort()
      const abortController = new AbortController()
      serverSaveAbortRef.current = abortController
      setIsSavingDraft(true)
      try {
        await fetch('/api/assessment/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: latestAnswersRef.current,
            currentPage: questionIndexRef.current,
          }),
          signal: abortController.signal,
        })
      } catch {
        // Silent fail
      } finally {
        if (serverSaveAbortRef.current === abortController) {
          serverSaveAbortRef.current = null
          setIsSavingDraft(false)
        }
      }
    }, 2000)
    return () => {
      if (serverSaveDebounce.current) clearTimeout(serverSaveDebounce.current)
      serverSaveDebounce.current = null
      serverSaveAbortRef.current?.abort()
      serverSaveAbortRef.current = null
      setIsSavingDraft(false)
    }
  }, [answeredCount, guestMode, questionIndex, setIsSavingDraft])

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current)
        autoAdvanceTimerRef.current = null
      }
    }
  }, [])

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
    serverSaveAbortRef.current?.abort()
    serverSaveAbortRef.current = null
    setIsSavingDraft(false)

    const currentAnswers = latestAnswersRef.current
    const firstUnanswered = questions.findIndex((q) => currentAnswers[q.id] === undefined)
    if (firstUnanswered !== -1) {
      setQuestionIndexSafe(firstUnanswered)
      return
    }
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setEvaluationProgress(0)

    const progressInterval = setInterval(() => {
      setEvaluationProgress((prev) => {
        if (prev >= 70) return prev
        return Math.min(prev + Math.random() * 4 + 1, 70)
      })
    }, 300)

    try {
      if (guestMode) {
        // Guest mode: skip API submit, keep localStorage draft, redirect to registration gate
        clearInterval(progressInterval)
        const rampInterval = setInterval(() => {
          setEvaluationProgress((prev) => {
            if (prev >= 100) { clearInterval(rampInterval); return 100 }
            return Math.min(prev + Math.random() * 4 + 2, 100)
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
        answers: toAssessmentAnswerPayload(currentAnswers),
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
      clearAssessmentDraftFromStorage(testType)

      const rampInterval = setInterval(() => {
        setEvaluationProgress((prev) => {
          if (prev >= 100) { clearInterval(rampInterval); return 100 }
          return Math.min(prev + Math.random() * 3 + 1, 100)
        })
      }, 200)

      await new Promise((resolve) => setTimeout(resolve, 4000))
      clearInterval(rampInterval)
      setEvaluationProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 600))
      router.push('/assessment/belbin')
    } catch (error) {
      clearInterval(progressInterval)
      isSubmittingRef.current = false
      setIsSubmitting(false)
      setEvaluationProgress(0)
      console.error(error)
      showToast(t('assessment.saveError', locale), 'error')
    }
  }, [questions, setQuestionIndexSafe, testType, locale, router, showToast, guestMode])

  const scheduleAutoAdvance = useCallback((questionId: number, nextAnsweredCount: number) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current)
      autoAdvanceTimerRef.current = null
    }
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      const liveQuestion = questions[questionIndexRef.current]
      if (!liveQuestion || liveQuestion.id !== questionId) return

      const nextProgress = (nextAnsweredCount / totalQuestions) * 100
      const willTriggerCheckpoint = [25, 50, 75].some(
        (mark) => nextProgress >= mark && !reachedCheckpoints.current.has(mark),
      )
      if (willTriggerCheckpoint || checkpointRef.current !== null) return

      if (questionIndexRef.current < totalQuestions - 1) {
        setQuestionIndexSafe((current) => current + 1)
      } else {
        void handleFinish()
      }
    }, 130)
  }, [handleFinish, questions, setQuestionIndexSafe, totalQuestions])

  const handleAnswer = useCallback((questionId: number, value: number) => {
    if (isSubmittingRef.current) return
    if (questions[questionIndexRef.current]?.id !== questionId) return

    let nextAnsweredCount = 0
    setAnswers((current) => {
      const next = { ...current, [questionId]: value }
      latestAnswersRef.current = next
      answersRef.current = next
      nextAnsweredCount = Object.keys(next).length
      return next
    })

    if (!autoAdvance) return
    scheduleAutoAdvance(questionId, nextAnsweredCount)
  }, [autoAdvance, questions, scheduleAutoAdvance])

  const runStepTransition = useCallback((action: () => void) => {
    if (stepTransitionLockRef.current) return
    stepTransitionLockRef.current = true
    action()
    window.setTimeout(() => {
      stepTransitionLockRef.current = false
    }, 120)
  }, [])

  const handlePrevStep = useCallback(() => {
    if (checkpointRef.current !== null) {
      setCheckpoint(null)
      return
    }
    if (questionIndexRef.current > 0) {
      runStepTransition(() => {
        setQuestionIndexSafe((current) => current - 1)
      })
    }
  }, [runStepTransition, setQuestionIndexSafe])

  const handleNextStep = useCallback(async () => {
    if (checkpointRef.current !== null) {
      setCheckpoint(null)
      if (questionIndexRef.current < totalQuestions - 1) {
        runStepTransition(() => {
          setQuestionIndexSafe((current) => current + 1)
        })
      }
      return
    }
    const liveQuestion = questions[questionIndexRef.current]
    const liveAnswers = answersRef.current
    if (liveQuestion && liveAnswers[liveQuestion.id] === undefined) {
      highlightMissing(liveQuestion.id)
      return
    }

    if (questionIndexRef.current < totalQuestions - 1) {
      runStepTransition(() => {
        setQuestionIndexSafe((current) => current + 1)
      })
      return
    }

    if (isSubmittingRef.current) return
    await handleFinish()
  }, [highlightMissing, handleFinish, questions, runStepTransition, setQuestionIndexSafe, totalQuestions])

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
    return <div className="min-h-dvh bg-[var(--color-surface-canvas)]" />;
  }

  if (showIntro) {
    const steps = [
      { num: 1, style: "bg-[var(--color-action-primary-bg)] text-white", title: t("assessment.introStep1", locale), sub: t("assessment.introStep1Sub", locale) },
      { num: 2, style: "bg-[var(--color-surface-highlight-warm)] text-[var(--color-accent-primary-strong)]", title: t("assessment.introStep2", locale), sub: t("assessment.introStep2Sub", locale) },
      { num: 3, style: "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]", title: t("assessment.introStep3", locale), sub: t("assessment.introStep3Sub", locale) },
    ]
    const previewDims = [
      { name: t("landing.selfDim1", locale), val: 79 },
      { name: t("landing.selfDim2", locale), val: 46 },
      { name: t("landing.selfDim3", locale), val: 34 },
    ]
    return (
      <div className="min-h-dvh bg-[var(--color-surface-canvas)]">
        {/* Minimal nav */}
        <nav className="flex items-center justify-between bg-[rgba(250,249,246,0.95)] px-6 py-3 backdrop-blur-[12px] sm:px-10 lg:px-16">
          <Link href="/" className="font-fraunces text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
            <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
          </Link>
        </nav>

        {/* Two-column hero */}
        <div className="mx-auto max-w-4xl px-5 lg:px-10">
          <div className="grid grid-cols-1 items-start gap-8 py-10 lg:grid-cols-[1.2fr_1fr] lg:gap-10 lg:py-14">

            {/* Left column */}
            <div>
              <div className="mb-2.5 flex items-center gap-2">
                <div className="h-px w-4 bg-[var(--color-accent-primary)]" />
                <span className="text-[9px] font-medium uppercase tracking-[2px] text-[var(--color-accent-primary)]">
                  {t("assessment.introEyebrow", locale)}
                </span>
              </div>
              <h1 className="mb-3 font-fraunces text-[26px] leading-[1.15] tracking-tight text-[var(--color-text-primary)] lg:text-[28px]">
                {t("assessment.introHeadline1", locale)}
                <em className="not-italic text-[var(--color-accent-primary)]">{t("assessment.introHeadlineEm", locale)}</em>
              </h1>
              <p className="mb-5 max-w-[360px] text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t("assessment.introSub", locale)}
              </p>
              <div className="mb-5 rounded-r-lg border-l-2 border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] px-3.5 py-3">
                <p className="text-xs leading-relaxed text-[var(--color-accent-self-deep)]">
                  {t("assessment.introInfo", locale)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIntro(false)}
                className="w-full rounded-[10px] bg-[var(--color-action-primary-bg)] px-8 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-[var(--color-action-primary-bg)]/20 transition-all hover:-translate-y-px hover:brightness-[1.06] hover:shadow-lg lg:w-auto"
              >
                {t("assessment.introStart", locale)}
              </button>
              <p className="mt-2.5 text-center text-[11px] text-[var(--color-text-muted)] lg:text-left">
                {t("assessment.introMeta", locale)}
              </p>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-2.5">
              {steps.map((s) => (
                <div key={s.num} className="flex items-start gap-2.5 rounded-[10px] border border-[var(--color-border-default)] bg-white p-3 px-3.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-fraunces text-[13px] font-medium ${s.style}`}>
                    {s.num}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{s.title}</p>
                    <p className="text-[11px] leading-[1.4] text-[var(--color-text-muted)]">{s.sub}</p>
                  </div>
                </div>
              ))}
              <div className="mt-1 rounded-[10px] bg-gradient-to-br from-[var(--color-accent-self-strong)] via-[var(--color-accent-self-deep)] to-[var(--color-accent-self-deeper)] px-4 py-3.5">
                <p className="text-[6px] uppercase tracking-[1.5px] text-white/20">
                  {t("assessment.introPreviewEyebrow", locale)}
                </p>
                <p className="mt-0.5 font-fraunces text-sm font-medium italic text-[var(--color-accent-primary-soft)]">
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
    <div className="flex min-h-dvh flex-col bg-[var(--color-surface-canvas)]">
      {/* ═══ MINIMAL NAV ═══ */}
      <nav className="flex shrink-0 items-center justify-between bg-[rgba(250,249,246,0.95)] px-6 py-3 backdrop-blur-[12px] sm:px-10 lg:px-16">
        <Link href="/" className="font-fraunces text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">
          <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--color-action-primary-bg)]">
            ✓ {isSavingDraft ? t('actions.save', locale) : t('assessment.savedState', locale)}
          </span>
          <a
            href={guestMode ? "/" : "/profile/results"}
            className="rounded-md border border-[var(--color-border-default)] bg-white px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-secondary)]"
          >
            {t('assessment.continueLater', locale)}
          </a>
        </div>
      </nav>

      {/* ═══ PROGRESS BAR — single row ═══ */}
      <div className="flex shrink-0 items-center gap-4 border-b border-[var(--color-border-default)] px-7 py-2.5">
        <div className="flex items-baseline gap-1">
          <span className="font-fraunces text-base font-medium text-[var(--color-text-primary)]">{questionIndex + 1}</span>
          <span className="text-xs text-[var(--color-text-muted)]">/ {totalQuestions}</span>
        </div>
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-border-default)]">
          {/* Answered reach — light sage: up to last answered question position */}
          {(() => {
            let lastAnsweredIdx = -1;
            for (let i = questions.length - 1; i >= 0; i--) {
              if (answers[questions[i].id] !== undefined) { lastAnsweredIdx = i; break; }
            }
            const answeredReach = Math.max(lastAnsweredIdx + 1, questionIndex + 1);
            return (
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-action-primary-bg)]/30 transition-all duration-300"
                style={{ width: `${(answeredReach / totalQuestions) * 100}%` }}
              />
            );
          })()}
          {/* Current position — solid sage */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-action-primary-bg)] transition-all duration-300"
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-[11px] text-[var(--color-text-muted)]">
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
                  <div className="mb-4 inline-flex items-center gap-[5px] rounded-full bg-[var(--color-surface-self-accent-soft)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-[var(--color-action-primary-bg)]">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-action-primary-bg)]" />
                    {t('assessment.journeyMilestone', locale)}
                  </div>

                  {/* Title */}
                  <h2 className="mb-3 font-fraunces text-[24px] leading-[1.25] text-[var(--color-text-primary)] lg:text-[26px]">
                    {t(
                      checkpoint === 25 ? 'assessment.journeyMilestone25'
                      : checkpoint === 50 ? 'assessment.journeyMilestone50'
                      : 'assessment.journeyMilestone75',
                      locale
                    )}
                  </h2>

                  {/* Subtitle */}
                  <p className="mb-5 max-w-[400px] text-[14px] leading-relaxed text-[var(--color-text-muted)]">
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
                              ? "bg-[var(--color-action-primary-bg)]"
                              : i === filledSegments
                                ? "bg-[var(--color-accent-primary)]"
                                : "bg-[var(--color-border-default)]"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Tip callout */}
                  <div className="flex w-full max-w-[400px] items-start gap-2 rounded-lg bg-[var(--color-surface-self-accent-soft)] px-4 py-3 text-left">
                    <span className="mt-px shrink-0 text-sm">💡</span>
                    <p className="text-[13px] leading-[1.45] text-[var(--color-accent-self-deep)]">
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
        <p className="mt-6 text-xs italic text-[var(--color-text-muted)]">
          {t('assessment.helpLikert', locale)}
        </p>
      </div>

      {/* ═══ FOOTER BAR ═══ */}
      <div className="flex shrink-0 items-center justify-between border-t border-[var(--color-border-default)] bg-white px-7 py-3 shadow-[0_-1px_4px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={!canGoPrev}
          className={`min-h-[44px] rounded-lg border px-5 py-2.5 text-[13px] transition-all ${
            canGoPrev
              ? "border-[var(--color-border-default)] bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
              : "border-transparent bg-transparent text-transparent pointer-events-none"
          }`}
        >
          ← {t('assessment.prevCta', locale)}
        </button>

        <label className="flex cursor-pointer items-center gap-2">
          <div
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border-[1.5px] transition-all ${
              autoAdvance ? "border-[var(--color-action-primary-bg)] bg-[var(--color-action-primary-bg)]" : "border-[var(--color-border-default)] bg-white"
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
          <span className="text-[11px] text-[var(--color-text-muted)]">{t('assessment.autoAdvance', locale)}</span>
        </label>

        {!showEvaluateButton ? (
          <button
            type="button"
            onClick={() => void handleNextStep()}
            disabled={!canProceed || isSavingDraft}
            className={`min-h-[44px] rounded-lg px-6 py-2.5 text-[13px] font-semibold transition-all ${
              canProceed && !isSavingDraft
                ? "bg-[var(--color-action-primary-bg)] text-white shadow-sm shadow-[var(--color-action-primary-bg)]/15 hover:brightness-[1.06]"
                : "bg-[var(--color-action-primary-bg)]/30 text-white/50"
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
                ? "bg-[var(--color-action-primary-bg)] text-white shadow-sm shadow-[var(--color-action-primary-bg)]/15 hover:brightness-[1.06]"
                : "bg-[var(--color-action-primary-bg)]/30 text-white/50"
            }`}
          >
            {t('assessment.evaluateCta', locale)}
          </button>
        )}
      </div>
    </div>
  )
}
