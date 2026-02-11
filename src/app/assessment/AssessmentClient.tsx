'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ProgressBar } from '@/components/assessment/ProgressBar'
import { QuestionCard } from '@/components/assessment/QuestionCard'
import { AssessmentDoodle } from '@/components/illustrations/AssessmentDoodle'
import { EvaluatingScreen } from '@/components/assessment/EvaluatingScreen'
import { useToast } from '@/components/ui/Toast'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/i18n'
import type { TestType } from '@prisma/client'
type AssessmentQuestion = { id: number; text: string }

const QUESTIONS_PER_PAGE = 5

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

  const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE)
  const isLastPage = currentPage === totalPages - 1
  const answeredCount = Object.keys(answers).length

  // All questions on current page must be answered to proceed
  const canGoNext = pageQuestions.every((q) => answers[q.id] !== undefined)

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

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const saveDraftToServer = async (page: number) => {
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
  }

  const handleNextPage = async () => {
    if (!canGoNext) {
      const missing = pageQuestions.find((q) => answers[q.id] === undefined)
      if (missing) {
        const elementId = questionElementIds.get(missing.id)
        if (elementId) {
          const el = document.getElementById(elementId)
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        setHighlightQuestionId(missing.id)
        window.setTimeout(() => {
          setHighlightQuestionId((current) => (current === missing.id ? null : current))
        }, 1200)
      }
      return
    }
    if (isLastPage) return
    const nextPage = currentPage + 1
    await saveDraftToServer(nextPage)
    setCurrentPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFinish = async () => {
    if (!canGoNext) {
      const missing = pageQuestions.find((q) => answers[q.id] === undefined)
      if (missing) {
        const elementId = questionElementIds.get(missing.id)
        if (elementId) {
          const el = document.getElementById(elementId)
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        setHighlightQuestionId(missing.id)
        window.setTimeout(() => {
          setHighlightQuestionId((current) => (current === missing.id ? null : current))
        }, 1200)
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
  }

  if (isSubmitting) {
    return <EvaluatingScreen progress={evaluationProgress} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* Progress */}
        <div className="mb-8">
          <ProgressBar current={answeredCount} total={totalQuestions} />
          <p className="mt-2 text-center text-xs text-gray-400">
            {t('assessment.pageProgress', locale)
              .replace('{current}', String(currentPage + 1))
              .replace('{total}', String(totalPages))}
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-4">
          <div className="h-36 w-full">
            <AssessmentDoodle />
          </div>
        </div>

        {/* Questions for current page */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
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
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
              currentPage === 0
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'bg-white text-gray-700 shadow-md hover:shadow-lg'
            }`}
            whileHover={currentPage > 0 ? { scale: 1.02 } : {}}
            whileTap={currentPage > 0 ? { scale: 0.98 } : {}}
          >
            {t('assessment.prevPage', locale)}
          </motion.button>

          <div className="text-sm text-gray-600 md:hidden">
            {currentPage + 1} / {totalPages}
          </div>

          {!isLastPage ? (
            <motion.button
              onClick={handleNextPage}
              aria-disabled={!canGoNext || isSavingDraft}
              className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
                canGoNext && !isSavingDraft
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
              whileHover={canGoNext && !isSavingDraft ? { scale: 1.02 } : {}}
              whileTap={canGoNext && !isSavingDraft ? { scale: 0.98 } : {}}
            >
              {isSavingDraft ? t('actions.save', locale) : t('assessment.nextPage', locale)}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleFinish}
              aria-disabled={!canGoNext || isSubmitting}
              className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
                canGoNext && !isSubmitting
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                  : 'cursor-not-allowed bg-gray-200 text-gray-400'
              }`}
              whileHover={canGoNext && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={canGoNext && !isSubmitting ? { scale: 0.98 } : {}}
            >
              {t('actions.viewResults', locale)}
            </motion.button>
          )}
        </div>

        {/* Help text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          {t('assessment.helpLikert', locale)}
        </motion.p>
      </div>
    </div>
  )
}
