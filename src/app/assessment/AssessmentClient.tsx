'use client'

import { useState, useEffect, useCallback } from 'react'
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
import type { Question } from '@/lib/questions'
import { isMBTIQuestion, isLikertQuestion } from '@/lib/questions'

interface AssessmentClientProps {
  testType: TestType
  testName: string
  format: 'likert' | 'binary'
  questions: Question[]
}

export function AssessmentClient({
  testType,
  testName,
  format,
  questions,
}: AssessmentClientProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const { locale } = useLocale()
  const draftKey = `trita_draft_${testType}`
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number | string>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const saved = localStorage.getItem(draftKey)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evaluationProgress, setEvaluationProgress] = useState(0)

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

  const question = questions[currentQuestion]
  const totalQuestions = questions.length
  const isLastQuestion = currentQuestion === totalQuestions - 1

  const handleAnswer = (value: number | string) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: value,
    }))
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleFinish = async () => {
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
        throw new Error(t("assessment.saveResultError", locale))
      }

      clearInterval(progressInterval)
      localStorage.removeItem(draftKey)

      // Slowly ramp from current to 100% over ~3-4 seconds
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
      showToast(t("assessment.saveError", locale), 'error')
    }
  }

  const canGoNext = answers[question.id] !== undefined

  const helpText =
    format === 'likert'
      ? t('assessment.helpLikert', locale)
      : t('assessment.helpBinary', locale)

  if (isSubmitting) {
    return <EvaluatingScreen progress={evaluationProgress} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <ProgressBar current={currentQuestion + 1} total={totalQuestions} />
        </div>
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-4">
          <div className="h-36 w-full">
            <AssessmentDoodle />
          </div>
        </div>

        {/* Question card with animation */}
        <div className="mb-8">
          <AnimatePresence mode="wait">
            {isLikertQuestion(question) ? (
              <QuestionCard
                key={question.id}
                testName={testName}
                dimension={question.dimension}
                format="likert"
                question={question.text}
                value={(answers[question.id] as number) ?? null}
                onChange={(v) => handleAnswer(v)}
              />
            ) : isMBTIQuestion(question) ? (
              <QuestionCard
                key={question.id}
                testName={testName}
                dimension={question.dichotomy}
                format="binary"
                optionA={question.optionA.text}
                optionB={question.optionB.text}
                value={(answers[question.id] as string) ?? null}
                onChange={(v) => handleAnswer(v)}
              />
            ) : null}
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4">
          <motion.button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`
              min-h-[48px] rounded-lg px-6 font-semibold transition-all
              ${
                currentQuestion === 0
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-white text-gray-700 shadow-md hover:shadow-lg'
              }
            `}
            whileHover={currentQuestion > 0 ? { scale: 1.02 } : {}}
            whileTap={currentQuestion > 0 ? { scale: 0.98 } : {}}
          >
            {t('actions.prev', locale)}
          </motion.button>

          <div className="text-sm text-gray-600 md:hidden">
            {currentQuestion + 1} / {totalQuestions}
          </div>

          {!isLastQuestion ? (
            <motion.button
              onClick={handleNext}
              disabled={!canGoNext || isSubmitting}
              className={`
                min-h-[48px] rounded-lg px-6 font-semibold transition-all
                ${
                  canGoNext && !isSubmitting
                    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg'
                    : 'cursor-not-allowed bg-gray-200 text-gray-400'
                }
              `}
              whileHover={canGoNext && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={canGoNext && !isSubmitting ? { scale: 0.98 } : {}}
            >
              {t('actions.next', locale)}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleFinish}
              disabled={!canGoNext || isSubmitting}
              className={`
                min-h-[48px] rounded-lg px-6 font-semibold transition-all
                ${
                  canGoNext && !isSubmitting
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                    : 'cursor-not-allowed bg-gray-200 text-gray-400'
                }
              `}
              whileHover={canGoNext && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={canGoNext && !isSubmitting ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? t('actions.save', locale) : t('actions.viewResults', locale)}
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
          {helpText}
        </motion.p>
      </div>
    </div>
  )
}
