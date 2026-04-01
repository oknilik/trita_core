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
      <div className="grid grid-cols-3 md:grid-cols-6">
        {dimensions.map((dim, i) => {
          const tier = getDimensionTier(dim.value);
          const colors = tierColors[tier];
          return (
            <div
              key={dim.name}
              className={`px-2.5 py-4 text-center transition-colors hover:bg-[var(--color-surface-subtle)] ${
                i < dimensions.length - 1 ? "border-r border-[var(--color-border-soft)]" : ""
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
