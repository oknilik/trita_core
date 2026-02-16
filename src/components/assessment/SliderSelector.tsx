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
  const palette = [
    { bg: '#F2EEFF', border: '#DDD1FF', text: '#5B4A85', activeBg: '#D9C9FF' }, // very light lavender
    { bg: '#E8DEFF', border: '#CDB8FF', text: '#533F83', activeBg: '#C5A7FF' }, // light lilac
    { bg: '#DAC7FF', border: '#B695FF', text: '#4B347E', activeBg: '#AE84FF' }, // mid lilac
    { bg: '#C8A8FF', border: '#9965F6', text: '#412872', activeBg: '#915BEE' }, // stronger purple
    { bg: '#B386FF', border: '#7C3AED', text: '#351D61', activeBg: '#7C3AED' }, // vivid purple
  ]

  return (
    <div className="w-full space-y-4">
      {/* Dots */}
      <div className="flex items-center justify-center gap-3 md:gap-4">
        {[1, 2, 3, 4, 5].map((mark) => {
          const isSelected = value === mark
          const color = palette[mark - 1]
          return (
            <motion.button
              key={mark}
              type="button"
              onClick={() => onChange(mark)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-all md:h-12 md:w-12"
              style={{
                backgroundColor: isSelected ? color.activeBg : color.bg,
                borderColor: isSelected ? '#5B21B6' : color.border,
                borderWidth: isSelected ? '3px' : '1.5px',
                color: isSelected ? '#FFFFFF' : color.text,
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

      {/* Selected label */}
      <div className="flex min-h-[2rem] items-center justify-center">
        {value !== null ? (
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm font-medium"
            style={{ color: palette[value - 1]?.text ?? '#374151' }}
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
