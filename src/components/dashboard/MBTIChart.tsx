"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface MBTIDichotomy {
  code: string;
  label: string;
  color: string;
  poleA: string;
  poleB: string;
  percentage: number;
}

interface MBTIChartProps {
  dichotomies: MBTIDichotomy[];
  typeCode: string;
  locale: Locale;
}

export function MBTIChart({ dichotomies, typeCode, locale }: MBTIChartProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setAnimated(true));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Type code */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          {t("comparison.typeLabel", locale)}
        </p>
        <motion.p
          className="mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-5xl font-black tracking-widest text-transparent"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {typeCode}
        </motion.p>
      </div>

      {/* Dichotomy bars */}
      <div className="flex flex-col gap-5">
        {dichotomies.map((d, i) => {
          const realPctA = d.percentage;
          const realPctB = 100 - d.percentage;
          const dominant = realPctA >= 50 ? "A" : "B";
          const pctA = animated ? realPctA : 50;
          const pctB = 100 - pctA;

          return (
            <div key={d.code} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span
                  className={`font-semibold ${dominant === "A" ? "text-gray-900" : "text-gray-400"}`}
                >
                  {d.poleA} ({realPctA}%)
                </span>
                <span className="text-xs font-medium text-gray-400">
                  {d.label}
                </span>
                <span
                  className={`font-semibold ${dominant === "B" ? "text-gray-900" : "text-gray-400"}`}
                >
                  {d.poleB} ({realPctB}%)
                </span>
              </div>
              <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-l-full"
                  style={{
                    width: `${pctA}%`,
                    backgroundColor: d.color,
                    opacity: dominant === "A" ? 1 : 0.35,
                    transition: `width 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.1}s`,
                  }}
                />
                <div
                  className="h-full rounded-r-full"
                  style={{
                    width: `${pctB}%`,
                    backgroundColor: d.color,
                    opacity: dominant === "B" ? 1 : 0.35,
                    transition: `width 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.1}s`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
