'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/i18n'

interface SliderSelectorProps {
  value: number | null
  onChange: (value: number) => void
}

export function SliderSelector({ value, onChange }: SliderSelectorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { locale } = useLocale()
  const hasValue = value !== null
  const currentValue = value ?? 3
  const labels = [
    t('assessment.scale1', locale),
    t('assessment.scale2', locale),
    t('assessment.scale3', locale),
    t('assessment.scale4', locale),
    t('assessment.scale5', locale),
  ]

  return (
    <div className="w-full space-y-6">
      {/* Current value display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{
            scale: isDragging ? 1.1 : 1
          }}
          className={`flex h-20 w-20 items-center justify-center rounded-full shadow-lg ${
            hasValue
              ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
              : 'bg-white border border-gray-200'
          }`}
        >
          <motion.span
            animate={
              hasValue
                ? { opacity: 1 }
                : { opacity: [0.4, 0.9, 0.4] }
            }
            transition={
              hasValue ? { duration: 0 } : { duration: 1.6, repeat: Infinity }
            }
            className={`text-4xl font-bold ${
              hasValue ? 'text-white' : 'text-gray-400'
            }`}
          >
            {hasValue ? currentValue : '–'}
          </motion.span>
        </motion.div>
        <motion.p
          key={hasValue ? currentValue : 'empty'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm font-medium text-gray-700"
        >
          {hasValue ? labels[currentValue - 1] : t('assessment.emptyValue', locale)}
        </motion.p>
      </motion.div>

      {/* Slider container */}
      <div className="relative px-4">
        {/* Track background */}
        <div className="absolute left-4 right-4 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-200" />

        {/* Active track (gradient fill) */}
        <motion.div
          className="absolute left-4 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
          style={{
            width: hasValue
              ? `calc((100% - 2rem) * ${(currentValue - 1) / 4})`
              : '0%'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        {/* Scale markers */}
        <div className="relative flex justify-between">
          {[1, 2, 3, 4, 5].map((mark) => (
            <div
              key={mark}
              className={`flex flex-col items-center transition-opacity ${
                hasValue ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <motion.button
                onClick={() => onChange(mark)}
                className={`
                  relative z-10 h-6 w-6 rounded-full border-4 transition-all
                  ${
                    hasValue && currentValue >= mark
                      ? 'border-white bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md'
                      : 'border-white bg-gray-300'
                  }
                `}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
              <span className="mt-2 text-xs font-medium text-gray-600">
                {mark}
              </span>
            </div>
          ))}
        </div>

        {/* Invisible slider input */}
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={currentValue}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      {/* End labels */}
      <div className="flex items-center justify-between px-2 text-xs text-gray-500">
        <span className="max-w-[45%] text-left">{t('assessment.endLeft', locale)}</span>
        <span className="max-w-[45%] text-right">{t('assessment.endRight', locale)}</span>
      </div>
    </div>
  )
}
