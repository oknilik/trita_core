'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
type AssessmentQuestion = { id: number; text: string }

const QUESTIONS_PER_PAGE = 5
const DOODLE_SOURCES = [
  '/doodles/chilling.svg',
  '/doodles/coffee.svg',
  '/doodles/float.svg',
  '/doodles/groovy.svg',
  '/doodles/jumping.svg',
  '/doodles/laying.svg',
  '/doodles/loving.svg',
  '/doodles/meditating.svg',
  '/doodles/plant.svg',
  '/doodles/reading-side.svg',
  '/doodles/roller-skating.svg',
  '/doodles/running.svg',
  '/doodles/selfie.svg',
  '/doodles/sitting-reading.svg',
  '/doodles/sleek.svg',
  '/doodles/strolling.svg',
  '/doodles/swinging.svg',
  '/doodles/unboxing.svg',
] as const

function pickRandomDoodle(current?: string) {
  const pool = current
    ? DOODLE_SOURCES.filter((src) => src !== current)
    : DOODLE_SOURCES
  return pool[Math.floor(Math.random() * pool.length)] ?? DOODLE_SOURCES[0]
}

interface AssessmentClientProps {
  testType: TestType
  testName: string
  totalQuestions: number
  initialDraft?: { answers: Record<string, number>; currentPage: number }
}

export function AssessmentClient({
  testType,
  testName,
  totalQuestions,
  initialDraft,
}: AssessmentClientProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const { locale } = useLocale()
  const draftKey = `trita_draft_${testType}`

  const [currentPage, setCurrentPage] = useState(initialDraft?.currentPage ?? 0)
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    // Server draft takes priority; localStorage is loaded after hydration
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
  const [highlightQuestionId, setHighlightQuestionId] = useState<number | null>(null)
  const [focusMode, setFocusMode] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [checkpoint, setCheckpoint] = useState<number | null>(null)
  const [doodleSrc, setDoodleSrc] = useState<string>(() => pickRandomDoodle())
  const reachedCheckpoints = useRef<Set<number>>(new Set())
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
  const canGoPrev = focusMode ? canGoBackWithinPage || currentPage > 0 : currentPage > 0
  const currentQuestionAnswered =
    !focusMode || !activeQuestion ? true : answers[activeQuestion.id] !== undefined

  // All questions on current page must be answered to proceed
  const canGoNext = pageQuestions.every((q) => answers[q.id] !== undefined)
  const checkpointActive = checkpoint !== null
  const canProceed = checkpointActive || (focusMode ? currentQuestionAnswered : canGoNext)
  const showEvaluateButton = checkpointActive
    ? false
    : focusMode
      ? isFullyCompleted
      : isLastPage

  const questionElementIds = useMemo(
    () => new Map(pageQuestions.map((q) => [q.id, `question-${q.id}`])),
    [pageQuestions],
  )

  // Load localStorage draft after hydration (only if no server draft)
  useEffect(() => {
    if (initialDraft?.answers && Object.keys(initialDraft.answers).length > 0) return
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Record<number, number>
        setAnswers(parsed)
      }
    } catch {
      // ignore
    }
  }, [draftKey, initialDraft?.answers])

  // Save draft to localStorage on every answer change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(draftKey, JSON.stringify(answers))
    }
  }, [answers, draftKey])

  // Warn before leaving if there are answers
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
        if (!res.ok) {
          throw new Error('Failed to load questions')
        }
        const data = await res.json()
        if (isMounted) {
          setPageQuestions(data.questions ?? [])
        }
      } catch (error) {
        console.error(error)
        showToast(t('assessment.loadQuestionsError', locale), 'error')
        if (isMounted) {
          setPageQuestions([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingQuestions(false)
        }
      }
    }
    loadQuestions()
    return () => {
      isMounted = false
    }
  }, [currentPage, showToast, locale])

  useEffect(() => {
    if (!focusMode) {
      initializedFocusPage.current = null
      return
    }
    if (initializedFocusPage.current === currentPage) return
    const firstUnanswered = pageQuestions.findIndex((q) => answers[q.id] === undefined)
    setActiveQuestionIndex(firstUnanswered === -1 ? 0 : firstUnanswered)
    initializedFocusPage.current = currentPage
  }, [focusMode, currentPage, pageQuestions, answers])

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
      if (focusMode) {
        const missingIdx = pageQuestions.findIndex((q) => q.id === missingId)
        if (missingIdx >= 0) setActiveQuestionIndex(missingIdx)
      } else {
        const elementId = questionElementIds.get(missingId)
        if (elementId) {
          const el = document.getElementById(elementId)
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      setHighlightQuestionId(missingId)
      window.setTimeout(() => {
        setHighlightQuestionId((current) => (current === missingId ? null : current))
      }, 1200)
    },
    [focusMode, pageQuestions, questionElementIds],
  )

  const handleAnswer = useCallback((questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    if (focusMode && autoAdvance && activeQuestion && activeQuestion.id === questionId && canGoForwardWithinPage) {
      window.setTimeout(() => {
        setActiveQuestionIndex((idx) => Math.min(idx + 1, pageQuestions.length - 1))
      }, 130)
    }
  }, [focusMode, autoAdvance, activeQuestion, canGoForwardWithinPage, pageQuestions.length])

  const saveDraftToServer = useCallback(async (page: number) => {
    setIsSavingDraft(true)
    try {
      await fetch('/api/assessment/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          currentPage: page,
        }),
      })
    } catch {
      // Silent fail — localStorage is the fallback
    } finally {
      setIsSavingDraft(false)
    }
  }, [answers])

  const handleNextPage = useCallback(async () => {
    if (!canGoNext) {
      const missing = pageQuestions.find((q) => answers[q.id] === undefined)
      if (missing) {
        highlightMissing(missing.id)
      }
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
    if (!canGoNext) {
      const missing = pageQuestions.find((q) => answers[q.id] === undefined)
      if (missing) {
        highlightMissing(missing.id)
      }
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
        answers: Object.entries(answers).map(([questionId, value]) => ({
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
        throw new Error(t('assessment.saveResultError', locale))
      }

      clearInterval(progressInterval)
      localStorage.removeItem(draftKey)

      const rampInterval = setInterval(() => {
        setEvaluationProgress((prev) => {
          if (prev >= 100) {
            clearInterval(rampInterval)
            return 100
          }
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
  }, [
    canGoNext,
    pageQuestions,
    answers,
    highlightMissing,
    isSubmitting,
    testType,
    locale,
    draftKey,
    router,
    showToast,
  ])

  const handlePrevStep = useCallback(() => {
    if (checkpointActive) {
      setCheckpoint(null)
      return
    }
    if (focusMode && canGoBackWithinPage) {
      setActiveQuestionIndex((idx) => idx - 1)
      return
    }
    handlePrevPage()
  }, [checkpointActive, focusMode, canGoBackWithinPage, handlePrevPage])

  const handleNextStep = useCallback(async () => {
    if (checkpointActive) {
      setDoodleSrc((prev) => pickRandomDoodle(prev))
      setCheckpoint(null)
      return
    }
    if (focusMode && activeQuestion && answers[activeQuestion.id] === undefined) {
      highlightMissing(activeQuestion.id)
      return
    }
    if (focusMode && canGoForwardWithinPage) {
      setActiveQuestionIndex((idx) => idx + 1)
      return
    }
    if (isLastPage) {
      await handleFinish()
      return
    }
    await handleNextPage()
  }, [
    checkpointActive,
    focusMode,
    activeQuestion,
    answers,
    highlightMissing,
    canGoForwardWithinPage,
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
              <p className="whitespace-nowrap rounded-md bg-gray-50 px-2 py-1">
                {t('assessment.pageProgress', locale)
                  .replace('{current}', String(currentPage + 1))
                  .replace('{total}', String(totalPages))}
              </p>
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
          <button
            type="button"
            onClick={() => setFocusMode((prev) => !prev)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              focusMode
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {focusMode ? t('assessment.showAllQuestions', locale) : t('assessment.focusMode', locale)}
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(event) => setAutoAdvance(event.target.checked)}
              disabled={!focusMode}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 disabled:opacity-40"
            />
            {t('assessment.autoAdvance', locale)}
          </label>
          <span className="text-xs text-gray-500">{t('assessment.keyboardHint', locale)}</span>
        </div>

        {/* Questions for current page */}
        <AnimatePresence mode="wait">
          <motion.div
            key={
              checkpointActive
                ? `checkpoint-${checkpoint}`
                : focusMode
                  ? `${currentPage}-${activeQuestion?.id ?? 'none'}`
                  : String(currentPage)
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
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  {t('assessment.journeyMilestone', locale)}
                </p>
                <p className="mt-3 text-xl font-bold text-emerald-800 md:text-2xl">
                  {tf('assessment.checkpointReached', locale, { percent: checkpoint ?? 0 })}
                </p>
                <p className="mt-3 text-sm text-emerald-700">
                  {t('assessment.journeyMilestoneHint', locale)}
                </p>
              </div>
            ) : focusMode ? (
              activeQuestion ? (
                <>
                  <p className="text-center text-xs font-medium text-gray-500">
                    {tf('assessment.pageQuestionCounter', locale, {
                      current: activeQuestionIndex + 1,
                      total: pageQuestions.length,
                    })}
                  </p>
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
                </>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
                  {t('assessment.loadingQuestions', locale)}
                </div>
              )
            ) : (
              pageQuestions.map((question) => (
                <div key={question.id} id={`question-${question.id}`}>
                  <QuestionCard
                    testName={testName}
                    format="likert"
                    question={question.text}
                    value={(answers[question.id] as number) ?? null}
                    onChange={(v) => handleAnswer(question.id, v)}
                    highlight={highlightQuestionId === question.id}
                  />
                </div>
              ))
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
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
              whileHover={canProceed && !isSavingDraft ? { scale: 1.02 } : {}}
              whileTap={canProceed && !isSavingDraft ? { scale: 0.98 } : {}}
            >
              {checkpointActive
                ? t('assessment.nextCta', locale)
                : focusMode && canGoForwardWithinPage
                ? t('assessment.nextCta', locale)
                : isSavingDraft
                  ? t('actions.save', locale)
                  : t('assessment.nextCta', locale)}
            </motion.button>
          ) : (
            <motion.button
              onClick={() => void handleNextStep()}
              aria-disabled={(!canGoNext && !checkpointActive) || isSubmitting}
              className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
                (canGoNext || checkpointActive) && !isSubmitting
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
              whileHover={(canGoNext || checkpointActive) && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={(canGoNext || checkpointActive) && !isSubmitting ? { scale: 0.98 } : {}}
            >
              {t('assessment.evaluateCta', locale)}
            </motion.button>
          )}
        </div>

        {/* Help text */}
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
