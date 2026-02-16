'use client'

import { motion } from 'framer-motion'
import { useLocale } from "@/components/LocaleProvider";
import { tf } from "@/lib/i18n";

interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const { locale } = useLocale();
  const percentage = (current / total) * 100

  return (
    <div className="w-full">
      {/* Progress text */}
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="truncate whitespace-nowrap font-medium text-gray-700">
          {tf("assessment.questionCounter", locale, { current, total })}
        </span>
        <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress bar track */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
