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
      <motion.div
        animate={highlight ? { x: [0, -9, 9, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className={`rounded-2xl border bg-white p-6 shadow-md md:p-8 ${
          highlight ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-100'
        }`}
      >
        {/* Badge removed */}

        {format === 'likert' ? (
          <>
            <h2 className="mb-6 flex min-h-[7rem] items-start text-lg font-semibold leading-relaxed text-gray-700 md:mb-8 md:text-xl">
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
      </motion.div>
    </motion.div>
  )
}
