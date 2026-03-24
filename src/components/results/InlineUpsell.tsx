"use client";

import { useLocale } from "@/components/LocaleProvider";

export function InlineUpsell() {
  const { locale } = useLocale();
  const isHu = locale === "hu";

  const features = isHu
    ? ["25 alskála", "Fejlődési fókusz", "Karrierillesztés"]
    : ["25 subscales", "Growth focus", "Career fit"];

  return (
    <div
      className="mt-8 flex flex-col items-center gap-6 rounded-[18px] px-8 py-7 sm:flex-row"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2a2740 100%)" }}
    >
      <div className="flex-1">
        <p className="mb-1.5 text-[9px] uppercase tracking-widest text-[#e8a96a]">
          Self Plus
        </p>
        <h3 className="mb-1.5 font-fraunces text-xl leading-tight text-white">
          {isHu ? "Nézz a fő dimenziók mögé." : "Look behind the key dimensions."}
        </h3>
        <p className="mb-3 text-[13px] leading-relaxed text-white/[0.38]">
          {isHu
            ? "Menj mélyebbre: alskálák, vakfoltok, illeszkedő szerepkörök — értsd meg, mi mozgat valójában."
            : "Go deeper: subscales, blind spots, fitting roles — understand what really drives you."}
        </p>
        <div className="flex flex-wrap gap-4">
          {features.map((f) => (
            <span key={f} className="text-[11px] text-white/[0.45]">
              <span className="font-bold text-[#5a8f7f]">✓</span> {f}
            </span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2">
        <span className="font-fraunces text-[32px] tracking-tight text-white">€7</span>
        <span className="text-[10px] text-white/[0.25]">
          {isHu ? "egyszeri vásárlás" : "one-time purchase"}
        </span>
        <button
          type="button"
          className="min-h-[44px] rounded-[11px] bg-[#c17f4a] px-7 py-[13px] text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-110"
        >
          {isHu ? "Megveszem →" : "Buy now →"}
        </button>
      </div>
    </div>
  );
}
