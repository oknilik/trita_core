'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLocale } from '@/components/LocaleProvider'
import { t } from '@/lib/i18n'
import { FOCUS_RING_CLASS } from '@/lib/ui/focus'

interface SliderSelectorProps {
  value: number | null
  onChange: (value: number) => void
  ariaLabel: string
}

export function SliderSelector({ value, onChange, ariaLabel }: SliderSelectorProps) {
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
      <div className="mb-3 flex gap-1.5 md:gap-2.5 lg:gap-3" role="radiogroup" aria-label={ariaLabel}>
        {[1, 2, 3, 4, 5].map((mark) => {
          const isSelected = value === mark
          const isHovered = hoveredMark === mark
          return (
            <motion.button
              key={mark}
              type="button"
              onClick={() => onChange(mark)}
              onKeyDown={(event) => {
                const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown'
                  ? 1
                  : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                    ? -1
                    : 0
                if (!delta) return
                event.preventDefault()
                const next = Math.max(1, Math.min(5, (value ?? mark) + delta))
                onChange(next)
                const group = event.currentTarget.parentElement
                group?.querySelector<HTMLElement>(`[data-mark="${next}"]`)?.focus()
              }}
              onMouseEnter={() => setHoveredMark(mark)}
              onMouseLeave={() => setHoveredMark(null)}
              whileTap={{ scale: 0.94 }}
              className={[
                "flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-[2.5px] text-body font-medium transition-all md:h-14 md:w-14",
                FOCUS_RING_CLASS,
                isSelected
                  ? "border-[var(--color-action-primary-bg)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)] shadow-md shadow-[var(--color-action-primary-bg)]/25"
                  : isHovered
                    ? "border-[var(--color-accent-self)] bg-[var(--color-surface-self-accent-soft)] text-[var(--color-action-primary-bg)]"
                    : "border-[var(--color-border-default)] bg-surface-card text-[var(--color-text-muted)] hover:border-[var(--color-accent-self)] hover:bg-[var(--color-surface-self-accent-soft)] hover:text-[var(--color-action-primary-bg)]",
              ].join(" ")}
              animate={{ scale: isSelected ? 1.08 : 1 }}
              transition={{ duration: 0.15 }}
              aria-label={`${mark} - ${labels[mark - 1]}`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (value === null && mark === 1) ? 0 : -1}
              data-mark={mark}
            >
              {mark}
            </motion.button>
          )
        })}
      </div>

      {/* End labels with center dot */}
      <div className="mb-4 flex w-full max-w-[320px] items-center justify-between gap-2">
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
