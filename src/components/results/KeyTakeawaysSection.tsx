"use client";

import { useLocale } from "@/components/LocaleProvider";

interface KeyTakeawaysSectionProps {
  paragraphs: string[];
  closingText: string;
  isUnlocked: boolean;
}

export function KeyTakeawaysSection({ paragraphs, closingText, isUnlocked }: KeyTakeawaysSectionProps) {
  if (!isUnlocked || paragraphs.length === 0) return null;

  const { locale } = useLocale();
  const isHu = locale === "hu";

  return (
    <div
      className="mt-6 rounded-2xl p-6 px-7"
      style={{ background: "linear-gradient(135deg, #1a1a2e, #2a2740)" }}
    >
      <p className="mb-3 text-[9px] uppercase tracking-widest" style={{ color: "#e8a96a" }}>
        {isHu ? "A legfontosabbak" : "Key takeaways"}
      </p>
      <div className="flex flex-col gap-3">
        {paragraphs.map((t, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-[6px] h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#3d6b5e" }} />
            <p className="text-[13px] leading-[1.7] text-white/[0.55]">{t}</p>
          </div>
        ))}
      </div>
      {closingText && (
        <p className="mt-4 border-t border-white/[0.06] pt-3.5 font-fraunces text-sm italic leading-relaxed text-white/[0.35]">
          {closingText}
        </p>
      )}
    </div>
  );
}
