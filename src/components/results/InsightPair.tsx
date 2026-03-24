"use client";

import { useLocale } from "@/components/LocaleProvider";

interface InsightPairProps {
  strengths: string;
  watchAreas: string;
}

export function InsightPair({ strengths, watchAreas }: InsightPairProps) {
  const { locale } = useLocale();
  const isHu = locale === "hu";

  return (
    <div className="grid grid-cols-2 gap-2.5 py-5">
      <div className="rounded-xl border-[1.5px] border-[#3d6b5e]/[0.18] bg-[#e8f2f0] p-4 px-[18px]">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-[#1e3d34]">
          {isHu ? "Erősségeid" : "Your strengths"}
        </p>
        <p className="text-[13px] leading-relaxed text-[#4a4a5e]">
          {strengths}
        </p>
      </div>
      <div className="rounded-xl border-[1.5px] border-[#c17f4a]/[0.18] bg-[#fdf5ee] p-4 px-[18px]">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-[#8a5530]">
          {isHu ? "Figyelendő" : "Watch areas"}
        </p>
        <p className="text-[13px] leading-relaxed text-[#4a4a5e]">
          {watchAreas}
        </p>
      </div>
    </div>
  );
}
