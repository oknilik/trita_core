"use client";

import { useLocale } from "@/components/LocaleProvider";

interface InsightBullet {
  dimension?: string;
  text: string;
}

interface InsightPairProps {
  strengths: InsightBullet[];
  watchAreas: InsightBullet[];
}

export function InsightPair({ strengths, watchAreas }: InsightPairProps) {
  const { locale } = useLocale();
  const isHu = locale === "hu";

  return (
    <div className="grid grid-cols-2 gap-2.5 py-5">
      <div className="rounded-xl border-[1.5px] border-[#3d6b5e]/[0.18] bg-[#e8f2f0] p-4 px-[18px]">
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-[#1e3d34]">
          {isHu ? "Erősségeid" : "Your strengths"}
        </p>
        <div className="flex flex-col gap-1.5">
          {strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1 text-[10px] text-[#3d6b5e]">•</span>
              <span className="text-[13px] text-[#4a4a5e]">
                {s.dimension && (
                  <strong className="text-[#1e3d34]">{s.dimension}</strong>
                )}
                {s.dimension && " — "}
                {s.text}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border-[1.5px] border-[#c17f4a]/[0.18] bg-[#fdf5ee] p-4 px-[18px]">
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-[#8a5530]">
          {isHu ? "Figyelendő" : "Watch areas"}
        </p>
        <div className="flex flex-col gap-1.5">
          {watchAreas.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1 text-[10px] text-[#c17f4a]">•</span>
              <span className="text-[13px] text-[#4a4a5e]">
                {w.dimension && (
                  <strong className="text-[#8a5530]">{w.dimension}</strong>
                )}
                {w.dimension && " — "}
                {w.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
