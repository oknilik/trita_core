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
          min-h-[44px] rounded-xl border-2 p-5 text-left text-sm font-medium transition-all
          ${
            value === 'A'
              ? 'border-indigo-500 bg-indigo-50 text-gray-900 shadow-md'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="mb-2 flex items-center gap-2">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
              value === 'A'
                ? 'border-indigo-500 bg-indigo-500'
                : 'border-gray-300 bg-white'
            }`}
          >
            {value === 'A' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-2 w-2 rounded-full bg-white"
              />
            )}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            A
          </span>
        </div>
        <p className="leading-relaxed">{optionA}</p>
      </motion.button>

      <motion.button
        onClick={() => onChange('B')}
        className={`
          min-h-[44px] rounded-xl border-2 p-5 text-left text-sm font-medium transition-all
          ${
            value === 'B'
              ? 'border-purple-500 bg-purple-50 text-gray-900 shadow-md'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="mb-2 flex items-center gap-2">
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
              value === 'B'
                ? 'border-purple-500 bg-purple-500'
                : 'border-gray-300 bg-white'
            }`}
          >
            {value === 'B' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-2 w-2 rounded-full bg-white"
              />
            )}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            B
          </span>
        </div>
        <p className="leading-relaxed">{optionB}</p>
      </motion.button>
    </div>
  )
}
