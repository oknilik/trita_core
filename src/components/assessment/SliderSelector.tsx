'use client'

import { motion } from 'framer-motion'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/i18n'

interface SliderSelectorProps {
  value: number | null
  onChange: (value: number) => void
}

export function SliderSelector({ value, onChange }: SliderSelectorProps) {
  const { locale } = useLocale()
  const labels = [
    t('assessment.scale1', locale),
    t('assessment.scale2', locale),
    t('assessment.scale3', locale),
    t('assessment.scale4', locale),
    t('assessment.scale5', locale),
  ]

  return (
    <div className="w-full space-y-4">
      {/* Dots */}
      <div className="flex items-center justify-center gap-3 md:gap-4">
        {[1, 2, 3, 4, 5].map((mark) => {
          const isSelected = value === mark
          return (
            <motion.button
              key={mark}
              type="button"
              onClick={() => onChange(mark)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={`h-11 w-11 rounded-full transition-all md:h-12 md:w-12 ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-200'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            />
          )
        })}
      </div>

      {/* Selected label */}
      <div className="flex min-h-[2rem] items-center justify-center">
        {value !== null ? (
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm font-medium text-gray-700"
          >
            {labels[value - 1]}
          </motion.p>
        ) : (
          <p className="text-center text-sm text-gray-400">
            {t('assessment.emptyValue', locale)}
          </p>
        )}
      </div>

      {/* End labels */}
      <div className="flex items-center justify-between px-1 text-xs text-gray-400">
        <span className="max-w-[45%] text-left">{t('assessment.endLeft', locale)}</span>
        <span className="max-w-[45%] text-right">{t('assessment.endRight', locale)}</span>
      </div>
    </div>
  )
}
