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
                "flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[2.5px] text-[15px] font-medium transition-all",
                isSelected
                  ? "border-[#3d6b5e] bg-[#3d6b5e] text-white shadow-md shadow-[#3d6b5e]/25"
                  : isHovered
                    ? "border-[#5a8f7f] bg-[#e8f2f0] text-[#3d6b5e]"
                    : "border-[#e8e0d3] bg-white text-[#8a8a9a] hover:border-[#5a8f7f] hover:bg-[#e8f2f0] hover:text-[#3d6b5e]",
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
        <span className="text-xs font-medium text-[#8a8a9a]">{t('assessment.endLeft', locale)}</span>
        <span className="text-[10px] text-[#e8e0d3]">·</span>
        <span className="text-xs font-medium text-[#8a8a9a]">{t('assessment.endRight', locale)}</span>
      </div>

      {/* Hover/selected label */}
      <div className="flex min-h-[1.25rem] items-center justify-center">
        {displayMark !== null ? (
          <motion.p
            key={`${displayMark}-${hoveredMark !== null ? 'hover' : 'selected'}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs font-medium text-[#4a4a5e]"
            style={{ opacity: hoveredMark !== null && hoveredMark !== value ? 0.6 : 1 }}
          >
            {labels[displayMark - 1]}
          </motion.p>
        ) : null}
      </div>
    </div>
  )
}
