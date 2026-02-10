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
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          {tf("assessment.questionCounter", locale, { current, total })}
        </span>
        <span className="text-indigo-600 font-semibold">{Math.round(percentage)}%</span>
      </div>

      {/* Progress bar track */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
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
