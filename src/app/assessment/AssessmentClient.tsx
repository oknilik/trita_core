'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ProgressBar } from '@/components/assessment/ProgressBar'
import { QuestionCard } from '@/components/assessment/QuestionCard'
import { AssessmentDoodle } from '@/components/illustrations/AssessmentDoodle'
import { EvaluatingScreen } from '@/components/assessment/EvaluatingScreen'
import { useToast } from '@/components/ui/Toast'
import { useLocale } from '@/components/LocaleProvider'
import { t, tf } from '@/lib/i18n'
import type { TestType } from '@prisma/client'
import { DOODLE_SOURCES, pickRandomDoodle } from '@/lib/doodles'
type AssessmentQuestion = { id: number; text: string }

const QUESTIONS_PER_PAGE = 5

interface AssessmentClientProps {
  testType: TestType
  testName: string
  totalQuestions: number
  initialDraft?: { answers: Record<string, number>; currentPage: number }
  clearDraft?: boolean
}

export function AssessmentClient({
  testType,
  testName,
  totalQuestions,
  initialDraft,
  clearDraft = false,
}: AssessmentClientProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const { locale } = useLocale()
  const draftKey = `trita_draft_${testType}`

  const [currentPage, setCurrentPage] = useState(initialDraft?.currentPage ?? 0)
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [evaluationProgress, setEvaluationProgress] = useState(0)
  const [pageQuestions, setPageQuestions] = useState<AssessmentQuestion[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  // Tracks which page the currently loaded questions belong to.
  // Prevents stale-closure init: when currentPage changes the fetch is async,
  // so pageQuestions still holds the previous page's data for a moment.
  const [questionsPage, setQuestionsPage] = useState(-1)
  const [highlightQuestionId, setHighlightQuestionId] = useState<number | null>(null)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [checkpoint, setCheckpoint] = useState<number | null>(null)
  const [doodleSrc, setDoodleSrc] = useState<string>(DOODLE_SOURCES[0])
  const reachedCheckpoints = useRef<Set<number>>(new Set(
    initialDraft?.answers && Object.keys(initialDraft.answers).length > 0
      ? ([25, 50, 75] as const).filter(
          (m) => (Object.keys(initialDraft.answers).length / totalQuestions) * 100 >= m,
        )
      : [],
  ))
  const initializedFocusPage = useRef<number | null>(null)

  const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE)
  const isLastPage = currentPage === totalPages - 1
  const answeredCount = Object.keys(answers).length
  const isFullyCompleted = answeredCount >= totalQuestions
  const remainingQuestions = Math.max(totalQuestions - answeredCount, 0)
  const etaMinutes = Math.max(1, Math.ceil((remainingQuestions * 15) / 60))
  const activeQuestion = pageQuestions[activeQuestionIndex] ?? null
  const canGoForwardWithinPage = activeQuestionIndex < pageQuestions.length - 1
  const canGoBackWithinPage = activeQuestionIndex > 0
  const canGoPrev = canGoBackWithinPage || currentPage > 0
  const currentQuestionAnswered = !activeQuestion || answers[activeQuestion.id] !== undefined
  const canGoNext = pageQuestions.every((q) => answers[q.id] !== undefined)
  const checkpointActive = checkpoint !== null
  const canProceed = checkpointActive || currentQuestionAnswered
  const showEvaluateButton = !checkpointActive && isFullyCompleted

  // Refs to always have the latest values in async callbacks
  const latestAnswersRef = useRef(answers)
  const latestPageRef = useRef(currentPage)
  useEffect(() => { latestAnswersRef.current = answers }, [answers])
  useEffect(() => { latestPageRef.current = currentPage }, [currentPage])

  useEffect(() => { setDoodleSrc(pickRandomDoodle()) }, [])

  // Load localStorage draft after hydration (only if no server draft and not a fresh retake)
  useEffect(() => {
    if (clearDraft) {
      localStorage.removeItem(draftKey)
      return
    }
    if (initialDraft?.answers && Object.keys(initialDraft.answers).length > 0) {
      localStorage.removeItem(draftKey)
      return
    }
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved) as { answers?: Record<number, number>; currentPage?: number } | Record<number, number>
        if ('answers' in parsed && parsed.answers) {
          setAnswers(parsed.answers)
          if (typeof parsed.currentPage === 'number') {
            setCurrentPage(parsed.currentPage)
          }
          const pct = (Object.keys(parsed.answers).length / totalQuestions) * 100
          for (const m of [25, 50, 75] as const) {
            if (pct >= m) reachedCheckpoints.current.add(m)
          }
        } else {
          const legacyAnswers = parsed as Record<number, number>
          setAnswers(legacyAnswers)
          const pct = (Object.keys(legacyAnswers).length / totalQuestions) * 100
          for (const m of [25, 50, 75] as const) {
            if (pct >= m) reachedCheckpoints.current.add(m)
          }
        }
      }
    } catch {
      // ignore
    }
  }, [draftKey, initialDraft?.answers, clearDraft])

  // Save draft to localStorage on every answer/page change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(draftKey, JSON.stringify({ answers, currentPage }))
    }
  }, [answers, currentPage, draftKey])

  // Debounced server save (2 s)
  const serverSaveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (Object.keys(answers).length === 0) return
    if (serverSaveDebounce.current) clearTimeout(serverSaveDebounce.current)
    serverSaveDebounce.current = setTimeout(async () => {
      try {
        await fetch('/api/assessment/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: latestAnswersRef.current,
            currentPage: latestPageRef.current,
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

  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (Object.keys(answers).length > 0 && !isSubmitting) {
        e.preventDefault()
      }
    },
    [answers, isSubmitting],
  )

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [handleBeforeUnload])

  useEffect(() => {
    let isMounted = true
    const loadQuestions = async () => {
      setIsLoadingQuestions(true)
      try {
        const res = await fetch(
          `/api/assessment/questions?page=${currentPage}&perPage=${QUESTIONS_PER_PAGE}`,
        )
        if (!res.ok) throw new Error('Failed to load questions')
        const data = await res.json()
        if (isMounted) {
          setPageQuestions(data.questions ?? [])
          setQuestionsPage(currentPage)
        }
      } catch (error) {
        console.error(error)
        showToast(t('assessment.loadQuestionsError', locale), 'error')
        if (isMounted) setPageQuestions([])
      } finally {
        if (isMounted) setIsLoadingQuestions(false)
      }
    }
    loadQuestions()
    return () => { isMounted = false }
  }, [currentPage, showToast, locale])

  // Initialize active question index once the correct questions have loaded.
  // questionsPage guard ensures we never run with a stale (previous page's) pageQuestions.
  useEffect(() => {
    if (questionsPage !== currentPage) return  // questions not yet fetched for this page
    if (pageQuestions.length === 0) return
    if (initializedFocusPage.current === currentPage) return

    const firstUnanswered = pageQuestions.findIndex((q) => answers[q.id] === undefined)

    if (firstUnanswered === -1 && currentPage < totalPages - 1) {
      // Every question on this page is already answered (draft resume) — skip it.
      setCurrentPage((prev) => prev + 1)
      return  // initializedFocusPage stays unset for this page so the next page re-inits
    }

    setActiveQuestionIndex(firstUnanswered === -1 ? pageQuestions.length - 1 : firstUnanswered)
    initializedFocusPage.current = currentPage
  }, [currentPage, questionsPage, pageQuestions, answers, totalPages])

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
      const missingIdx = pageQuestions.findIndex((q) => q.id === missingId)
      if (missingIdx >= 0) setActiveQuestionIndex(missingIdx)
      setHighlightQuestionId(missingId)
      window.setTimeout(() => {
        setHighlightQuestionId((current) => (current === missingId ? null : current))
      }, 1200)
    },
    [pageQuestions],
  )

  const saveDraftToServer = useCallback(async (page: number) => {
    setIsSavingDraft(true)
    try {
      await fetch('/api/assessment/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, currentPage: page }),
      })
    } catch {
      // Silent fail
    } finally {
      setIsSavingDraft(false)
    }
  }, [answers])

  const handleNextPage = useCallback(async () => {
    if (!canGoNext) {
      const missing = pageQuestions.find((q) => answers[q.id] === undefined)
      if (missing) highlightMissing(missing.id)
      return
    }
    if (isLastPage) return
    const nextPage = currentPage + 1
    await saveDraftToServer(nextPage)
    setCurrentPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [canGoNext, pageQuestions, answers, highlightMissing, isLastPage, currentPage, saveDraftToServer])

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentPage])

  const handleFinish = useCallback(async () => {
    // Cancel any pending debounced draft save so it doesn't re-create the draft after submit deletes it
    if (serverSaveDebounce.current) {
      clearTimeout(serverSaveDebounce.current)
      serverSaveDebounce.current = null
    }

    const currentAnswers = latestAnswersRef.current
    const canGoNextNow = pageQuestions.every((q) => currentAnswers[q.id] !== undefined)
    if (!canGoNextNow) {
      const missing = pageQuestions.find((q) => currentAnswers[q.id] === undefined)
      if (missing) highlightMissing(missing.id)
      return
    }
    if (Object.keys(currentAnswers).length < totalQuestions) {
      setCurrentPage(0)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
      router.push('/dashboard')
    } catch (error) {
      clearInterval(progressInterval)
      setIsSubmitting(false)
      setEvaluationProgress(0)
      console.error(error)
      showToast(t('assessment.saveError', locale), 'error')
    }
  }, [pageQuestions, highlightMissing, isSubmitting, totalQuestions, testType, locale, draftKey, router, showToast])

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

      if (canGoForwardWithinPage) {
        const nextUnanswered = pageQuestions.findIndex(
          (q, i) => i > activeQuestionIndex && updatedAnswers[q.id] === undefined,
        )
        if (nextUnanswered !== -1) {
          setActiveQuestionIndex(nextUnanswered)
          return
        }
        const allPageAnswered = pageQuestions.every((q) => updatedAnswers[q.id] !== undefined)
        if (!allPageAnswered) return
        if (isLastPage) {
          void handleFinish()
        } else {
          const nextPage = currentPage + 1
          setIsSavingDraft(true)
          fetch('/api/assessment/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: updatedAnswers, currentPage: nextPage }),
          }).catch(() => {}).finally(() => { setIsSavingDraft(false) })
          setCurrentPage(nextPage)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        return
      }

      if (isLastPage) {
        void handleFinish()
        return
      }
      const nextPage = currentPage + 1
      setIsSavingDraft(true)
      fetch('/api/assessment/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: updatedAnswers, currentPage: nextPage }),
      }).catch(() => {}).finally(() => { setIsSavingDraft(false) })
      setCurrentPage(nextPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 130)
  }, [
    answers,
    autoAdvance,
    activeQuestion,
    answeredCount,
    totalQuestions,
    canGoForwardWithinPage,
    pageQuestions,
    activeQuestionIndex,
    isLastPage,
    currentPage,
    handleFinish,
  ])

  const handlePrevStep = useCallback(() => {
    if (checkpointActive) {
      setCheckpoint(null)
      return
    }
    if (canGoBackWithinPage) {
      setActiveQuestionIndex((idx) => idx - 1)
      return
    }
    handlePrevPage()
  }, [checkpointActive, canGoBackWithinPage, handlePrevPage])

  const handleNextStep = useCallback(async () => {
    if (checkpointActive) {
      setDoodleSrc((prev) => pickRandomDoodle(prev))
      setCheckpoint(null)
      const nextUnanswered = pageQuestions.findIndex(
        (q, i) => i > activeQuestionIndex && answers[q.id] === undefined,
      )
      if (nextUnanswered !== -1) {
        setActiveQuestionIndex(nextUnanswered)
      } else if (!isLastPage) {
        await handleNextPage()
      }
      // If isLastPage and nothing unanswered: showEvaluateButton becomes true
      return
    }
    if (activeQuestion && answers[activeQuestion.id] === undefined) {
      highlightMissing(activeQuestion.id)
      return
    }
    if (canGoForwardWithinPage) {
      const nextUnanswered = pageQuestions.findIndex(
        (q, i) => i > activeQuestionIndex && answers[q.id] === undefined,
      )
      if (nextUnanswered !== -1) {
        setActiveQuestionIndex(nextUnanswered)
      } else {
        if (isLastPage) {
          await handleFinish()
        } else {
          await handleNextPage()
        }
      }
      return
    }
    if (isLastPage) {
      await handleFinish()
      return
    }
    await handleNextPage()
  }, [
    checkpointActive,
    activeQuestion,
    activeQuestionIndex,
    answers,
    highlightMissing,
    canGoForwardWithinPage,
    pageQuestions,
    isLastPage,
    handleFinish,
    handleNextPage,
  ])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isSubmitting || isLoadingQuestions) return
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
  }, [checkpointActive, activeQuestion, isSubmitting, isLoadingQuestions, handleNextStep, handleAnswer])

  if (isSubmitting) {
    return <EvaluatingScreen progress={evaluationProgress} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <div className="sticky top-2 z-20 mb-6 rounded-2xl border border-indigo-100/60 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <ProgressBar current={answeredCount} total={totalQuestions} />
          <div className="mt-2 overflow-x-auto">
            <div className="flex min-w-max items-center gap-2 text-xs text-gray-600">
              <div className="whitespace-nowrap rounded-md bg-gray-50 px-2 py-1">
                {tf('assessment.etaRemaining', locale, { minutes: etaMinutes })}
              </div>
              <div className="whitespace-nowrap rounded-md bg-gray-50 px-2 py-1 font-medium text-indigo-700">
                {isSavingDraft ? t('actions.save', locale) : t('assessment.savedState', locale)}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 hidden rounded-2xl border border-gray-100 bg-white p-4 sm:block">
          <div className="h-36 w-full">
            <AssessmentDoodle src={doodleSrc} />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(event) => setAutoAdvance(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            {t('assessment.autoAdvance', locale)}
          </label>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={
              checkpointActive
                ? `checkpoint-${checkpoint}`
                : `${currentPage}-${activeQuestion?.id ?? 'none'}`
            }
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
          >
            {isLoadingQuestions ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
                {t('assessment.loadingQuestions', locale)}
              </div>
            ) : checkpointActive ? (
              <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center md:min-h-[19rem] md:p-8">
                <div className="text-5xl leading-none">
                  {checkpoint === 25 ? '🌱' : checkpoint === 50 ? '💡' : '🏁'}
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  {t('assessment.journeyMilestone', locale)}
                </p>
                <p className="mt-2 text-xl font-bold text-emerald-800 md:text-2xl">
                  {t(
                    checkpoint === 25 ? 'assessment.journeyMilestone25'
                    : checkpoint === 50 ? 'assessment.journeyMilestone50'
                    : 'assessment.journeyMilestone75',
                    locale
                  )}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-emerald-700">
                  {t(
                    checkpoint === 25 ? 'assessment.journeyMilestone25Hint'
                    : checkpoint === 50 ? 'assessment.journeyMilestone50Hint'
                    : 'assessment.journeyMilestone75Hint',
                    locale
                  )}
                </p>
              </div>
            ) : activeQuestion ? (
              <div key={activeQuestion.id} id={`question-${activeQuestion.id}`}>
                <QuestionCard
                  testName={testName}
                  format="likert"
                  question={activeQuestion.text}
                  value={(answers[activeQuestion.id] as number) ?? null}
                  onChange={(v) => handleAnswer(activeQuestion.id, v)}
                  highlight={highlightQuestionId === activeQuestion.id}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
                {t('assessment.loadingQuestions', locale)}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <motion.button
            onClick={handlePrevStep}
            disabled={!canGoPrev}
            className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
              !canGoPrev
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'bg-white text-gray-700 shadow-md hover:shadow-lg'
            }`}
            whileHover={canGoPrev ? { scale: 1.02 } : {}}
            whileTap={canGoPrev ? { scale: 0.98 } : {}}
          >
            {t('assessment.prevCta', locale)}
          </motion.button>

          {!showEvaluateButton ? (
            <motion.button
              onClick={() => void handleNextStep()}
              aria-disabled={!canProceed || isSavingDraft}
              className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
                canProceed && !isSavingDraft
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
              whileHover={canProceed && !isSavingDraft ? { scale: 1.02 } : {}}
              whileTap={canProceed && !isSavingDraft ? { scale: 0.98 } : {}}
            >
              {isSavingDraft ? t('actions.save', locale) : t('assessment.nextCta', locale)}
            </motion.button>
          ) : (
            <motion.button
              onClick={() => void handleFinish()}
              disabled={isSubmitting}
              className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
                !isSubmitting
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            >
              {t('assessment.evaluateCta', locale)}
            </motion.button>
          )}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          {t('assessment.helpLikert', locale)}
        </motion.p>
      </div>
    </div>
  )
}
