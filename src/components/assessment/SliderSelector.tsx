'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/i18n'

interface SliderSelectorProps {
  value: number | null
  onChange: (value: number) => void
}

export function SliderSelector({ value, onChange }: SliderSelectorProps) {
  const { locale } = useLocale()
  const [hoveredMark, setHoveredMark] = useState<number | null>(null)

  const labels = [
    t('assessment.scale1', locale),
    t('assessment.scale2', locale),
    t('assessment.scale3', locale),
    t('assessment.scale4', locale),
    t('assessment.scale5', locale),
  ]
  const palette = [
    { bg: '#F2EEFF', border: '#DDD1FF', text: '#5B4A85', activeBg: '#D9C9FF' },
    { bg: '#E8DEFF', border: '#CDB8FF', text: '#533F83', activeBg: '#C5A7FF' },
    { bg: '#DAC7FF', border: '#B695FF', text: '#4B347E', activeBg: '#AE84FF' },
    { bg: '#C8A8FF', border: '#9965F6', text: '#412872', activeBg: '#915BEE' },
    { bg: '#B386FF', border: '#7C3AED', text: '#351D61', activeBg: '#7C3AED' },
  ]

  const displayMark = hoveredMark ?? value

  return (
    <div className="w-full space-y-4">
      {/* Dots */}
      <div className="flex items-center justify-center gap-3 md:gap-4">
        {[1, 2, 3, 4, 5].map((mark) => {
          const isSelected = value === mark
          const isHovered = hoveredMark === mark
          const color = palette[mark - 1]
          return (
            <motion.button
              key={mark}
              type="button"
              onClick={() => onChange(mark)}
              onMouseEnter={() => setHoveredMark(mark)}
              onMouseLeave={() => setHoveredMark(null)}
              whileHover={{ scale: 1.18 }}
              whileTap={{ scale: 0.94 }}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border text-sm font-semibold transition-colors md:h-12 md:w-12"
              style={{
                backgroundColor: isSelected ? color.activeBg : isHovered ? color.border : color.bg,
                borderColor: isSelected ? '#5B21B6' : isHovered ? '#7C3AED' : color.border,
                borderWidth: isSelected || isHovered ? '3px' : '1.5px',
                color: isSelected || isHovered ? '#FFFFFF' : color.text,
                opacity: isSelected ? 1 : 0.95,
              }}
              animate={{ scale: isSelected ? 1.12 : 1 }}
              transition={{ duration: 0.18 }}
              aria-label={`${mark} - ${labels[mark - 1]}`}
            >
              {mark}
            </motion.button>
          )
        })}
      </div>

      {/* Hover preview or selected label */}
      <div className="flex min-h-[2rem] items-center justify-center">
        {displayMark !== null ? (
          <motion.p
            key={`${displayMark}-${hoveredMark !== null ? 'hover' : 'selected'}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm font-medium"
            style={{
              color: palette[displayMark - 1]?.text ?? '#374151',
              opacity: hoveredMark !== null && hoveredMark !== value ? 0.65 : 1,
            }}
          >
            {labels[displayMark - 1]}
          </motion.p>
        ) : (
          <p className="text-center text-sm text-gray-400">
            {t('assessment.emptyValue', locale)}
          </p>
        )}
      </div>

      {/* End labels */}
      <div className="flex items-center justify-between px-1 text-xs text-gray-500">
        <span className="max-w-[45%] text-left">{t('assessment.endLeft', locale)}</span>
        <span className="max-w-[45%] text-right">{t('assessment.endRight', locale)}</span>
      </div>
    </div>
  )
}
