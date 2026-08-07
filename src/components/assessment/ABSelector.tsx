'use client'

import { motion } from 'framer-motion'

interface ABSelectorProps {
  optionA: string
  optionB: string
  value: string | null // "A" or "B" or null
  onChange: (value: string) => void
}

export function ABSelector({ optionA, optionB, value, onChange }: ABSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <motion.button
        onClick={() => onChange('A')}
        className={`
          min-h-[44px] rounded-lg border-2 p-5 text-left text-sm font-medium transition-all
          ${
            value === 'A'
              ? 'border-sage bg-sage-soft text-ink shadow-md'
              : 'border-sand bg-surface-card text-ink-body hover:border-warm-dark hover:bg-[#faf5ef]'
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="mb-2 flex items-center gap-2">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
              value === 'A'
                ? 'border-sage bg-sage'
                : 'border-sand bg-surface-card'
            }`}
          >
            {value === 'A' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-2 w-2 rounded-full bg-surface-card"
              />
            )}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            A
          </span>
        </div>
        <p className="leading-relaxed">{optionA}</p>
      </motion.button>

      <motion.button
        onClick={() => onChange('B')}
        className={`
          min-h-[44px] rounded-lg border-2 p-5 text-left text-sm font-medium transition-all
          ${
            value === 'B'
              ? 'border-sage bg-[var(--color-sage-ghost)] text-ink shadow-md'
              : 'border-sand bg-surface-card text-ink-body hover:border-warm-dark hover:bg-[#faf5ef]'
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="mb-2 flex items-center gap-2">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
              value === 'B'
                ? 'border-sage bg-sage'
                : 'border-sand bg-surface-card'
            }`}
          >
            {value === 'B' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-2 w-2 rounded-full bg-surface-card"
              />
            )}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            B
          </span>
        </div>
        <p className="leading-relaxed">{optionB}</p>
      </motion.button>
    </div>
  )
}
