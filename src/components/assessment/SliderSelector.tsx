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

  const displayMark = hoveredMark ?? value

  return (
    <div className="flex w-full flex-col items-center">
      {/* Circles */}
      <div className="mb-3 flex gap-2.5 lg:gap-3">
        {[1, 2, 3, 4, 5].map((mark) => {
          const isSelected = value === mark
          const isHovered = hoveredMark === mark
          return (
            <motion.button
              key={mark}
              type="button"
              onClick={() => onChange(mark)}
              onMouseEnter={() => setHoveredMark(mark)}
              onMouseLeave={() => setHoveredMark(null)}
              whileTap={{ scale: 0.94 }}
              className={[
                "flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[2.5px] text-body font-medium transition-all",
                isSelected
                  ? "border-[var(--color-action-primary-bg)] bg-[var(--color-action-primary-bg)] text-white shadow-md shadow-[var(--color-action-primary-bg)]/25"
                  : isHovered
                    ? "border-[var(--color-accent-self)] bg-[var(--color-surface-self-accent-soft)] text-[var(--color-action-primary-bg)]"
                    : "border-[var(--color-border-default)] bg-white text-[var(--color-text-muted)] hover:border-[var(--color-accent-self)] hover:bg-[var(--color-surface-self-accent-soft)] hover:text-[var(--color-action-primary-bg)]",
              ].join(" ")}
              animate={{ scale: isSelected ? 1.08 : 1 }}
              transition={{ duration: 0.15 }}
              aria-label={`${mark} - ${labels[mark - 1]}`}
            >
              {mark}
            </motion.button>
          )
        })}
      </div>

      {/* End labels with center dot */}
      <div className="mb-4 flex w-[320px] items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-muted)]">{t('assessment.endLeft', locale)}</span>
        <span className="text-micro text-[var(--color-border-default)]">·</span>
        <span className="text-xs font-medium text-[var(--color-text-muted)]">{t('assessment.endRight', locale)}</span>
      </div>

      {/* Hover/selected label */}
      <div className="flex min-h-[1.25rem] items-center justify-center">
        {displayMark !== null ? (
          <motion.p
            key={`${displayMark}-${hoveredMark !== null ? 'hover' : 'selected'}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs font-medium text-[var(--color-text-secondary)]"
            style={{ opacity: hoveredMark !== null && hoveredMark !== value ? 0.6 : 1 }}
          >
            {labels[displayMark - 1]}
          </motion.p>
        ) : null}
      </div>
    </div>
  )
}
