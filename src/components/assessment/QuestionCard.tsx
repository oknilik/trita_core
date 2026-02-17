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

export function QuestionCard(props: QuestionCardProps) {
  const { format, highlight } = props
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
          highlight ? 'border-rose-400' : 'border-gray-100'
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
