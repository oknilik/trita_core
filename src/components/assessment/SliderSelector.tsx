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
    { bg: '#f7f2ea', border: '#e8dccf', text: '#6a5a4d', activeBg: '#f1e6d9' },
    { bg: '#f5eee4', border: '#e4d4c5', text: '#655447', activeBg: '#ebdccb' },
    { bg: '#f3e7d8', border: '#dfccb8', text: '#5f4c3f', activeBg: '#e5d0ba' },
    { bg: '#f5ddd0', border: '#e9bea8', text: '#7a3a1e', activeBg: '#dfb194' },
    { bg: '#f0c8b3', border: '#d8906f', text: '#6c2a0d', activeBg: '#c8410a' },
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
                borderColor: isSelected ? '#8b2f09' : isHovered ? '#c8410a' : color.border,
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
