'use client'

import { motion } from 'framer-motion'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/i18n'
import { SliderSelector } from './SliderSelector'
import { ABSelector } from './ABSelector'

interface LikertCardProps {
  question: string
  testName: string
  dimension?: string
  format: 'likert'
  value: number | null
  onChange: (value: number) => void
  highlight?: boolean
}

interface BinaryCardProps {
  question?: undefined
  testName: string
  dimension?: string
  format: 'binary'
  optionA: string
  optionB: string
  value: string | null
  onChange: (value: string) => void
  highlight?: boolean
}

type QuestionCardProps = LikertCardProps | BinaryCardProps

const dimensionColors: Record<string, string> = {
  // HEXACO
  H: 'bg-indigo-100 text-indigo-700',
  E: 'bg-purple-100 text-purple-700',
  X: 'bg-blue-100 text-blue-700',
  A: 'bg-green-100 text-green-700',
  C: 'bg-orange-100 text-orange-700',
  O: 'bg-pink-100 text-pink-700',
  // Big Five extra
  N: 'bg-rose-100 text-rose-700',
}

export function QuestionCard(props: QuestionCardProps) {
  const { testName, dimension, format, highlight } = props
  const { locale } = useLocale()

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div
        className={`rounded-2xl border bg-white p-6 shadow-xl transition-colors md:p-8 ${
          highlight ? 'border-rose-400' : 'border-gray-200'
        }`}
      >
        {/* Badge removed */}

        {format === 'likert' ? (
          <>
            <h2 className="mb-8 text-xl font-semibold leading-relaxed text-gray-900 md:text-2xl">
              {props.question}
            </h2>
            <SliderSelector value={props.value} onChange={props.onChange} />
          </>
        ) : (
          <>
            <h2 className="mb-6 text-lg font-semibold text-gray-900 md:text-xl">
              {t('assessment.helpBinary', locale)}
            </h2>
            <ABSelector
              optionA={props.optionA}
              optionB={props.optionB}
              value={props.value}
              onChange={props.onChange}
            />
          </>
        )}
      </div>
    </motion.div>
  )
}
