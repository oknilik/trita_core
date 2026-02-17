'use client'

import { motion } from 'framer-motion'
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

interface ScaleSelectorProps {
  value: number | null
  onChange: (value: number) => void
}

export function ScaleSelector({ value, onChange }: ScaleSelectorProps) {
  const { locale } = useLocale();
  const labels = [
    t("assessment.scale1", locale),
    t("assessment.scale2", locale),
    t("assessment.scale3", locale),
    t("assessment.scale4", locale),
    t("assessment.scale5", locale),
  ];

  return (
    <div className="w-full space-y-4">
      {/* Scale buttons */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-between">
        {[1, 2, 3, 4, 5].map((scale) => (
          <motion.button
            key={scale}
            onClick={() => onChange(scale)}
            className={`
              relative min-h-[48px] flex-1 rounded-lg border-2 px-4 py-3 text-center
              font-semibold transition-all
              ${
                value === scale
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg'
                  : 'border-gray-100 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold">{scale}</span>
              <span className="hidden text-xs md:block">
                {labels[scale - 1].split(' ').slice(0, 2).join(' ')}
              </span>
            </div>

            {/* Selected indicator */}
            {value === scale && (
              <motion.div
                layoutId="selected"
                className="absolute inset-0 rounded-lg border-2 border-indigo-600"
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Selected label (mobile) */}
      {value && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-gray-600 md:hidden"
        >
          {labels[value - 1]}
        </motion.div>
      )}

      {/* Scale labels (desktop) */}
      <div className="hidden items-center justify-between text-xs text-gray-500 md:flex">
        <span>{t("assessment.scale1", locale)}</span>
        <span>{t("assessment.scale5", locale)}</span>
      </div>
    </div>
  )
}
