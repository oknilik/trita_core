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
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25 }}
      className="flex w-full flex-col items-center"
    >
      <motion.div
        animate={highlight ? { x: [0, -8, 8, -5, 5, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex w-full flex-col items-center"
      >
        {format === 'likert' ? (
          <>
            <p className="mb-8 max-w-[500px] text-center font-fraunces text-[22px] leading-[1.3] tracking-tight text-[#1a1a2e] lg:text-[24px]">
              {props.question}
            </p>
            <SliderSelector value={props.value} onChange={props.onChange} />
          </>
        ) : (
          <>
            <p className="mb-6 text-center font-fraunces text-lg text-[#1a1a2e]">
              {t('assessment.helpBinary', locale)}
            </p>
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
