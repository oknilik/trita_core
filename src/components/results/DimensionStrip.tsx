"use client";

import { getDimensionTier, getDimensionLabel, tierColors } from "@/lib/dimension-utils";
import { useLocale } from "@/components/LocaleProvider";

interface Dimension {
  name: string;
  shortName: string;
  value: number;
}

export function DimensionStrip({ dimensions }: { dimensions: Dimension[] }) {
  const { locale } = useLocale();

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Mobilon 3×2 rács: sorvégi cellán nincs jobb szegély, az első sor
          alsó szegélyt kap — md-től egysoros. */}
      <div className="grid grid-cols-3 max-md:[&>div:nth-child(-n+3)]:border-b max-md:[&>div:nth-child(3n)]:border-r-0 md:grid-cols-6">
        {dimensions.map((dim, i) => {
          const tier = getDimensionTier(dim.value);
          const colors = tierColors[tier];
          return (
            <div
              key={dim.name}
              className={`border-[var(--color-border-soft)] px-2 py-4 text-center transition-colors hover:bg-[var(--color-surface-subtle)] md:px-2.5 ${
                i < dimensions.length - 1 ? "border-r" : ""
              }`}
            >
              <p className="mb-1.5 text-[10px] text-[var(--color-text-muted)]">
                {dim.shortName}
              </p>
              <p
                className={`mb-1.5 font-fraunces text-[22px] leading-none ${colors.text}`}
              >
                {dim.value}
              </p>
              <span
                className={`inline-block rounded px-[7px] py-[2px] text-[8px] font-semibold ${colors.tagBg} ${colors.tagText}`}
              >
                {getDimensionLabel(dim.value, locale)}
              </span>
              <div className="mx-auto mt-2 h-[3px] w-4/5 overflow-hidden rounded-sm bg-[var(--color-border-default)]">
                <div
                  className={`h-full rounded-sm ${colors.fill}`}
                  style={{ width: `${dim.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
