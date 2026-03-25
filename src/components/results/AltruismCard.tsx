"use client";

import { useLocale } from "@/components/LocaleProvider";
import { getDimensionTier, tierColors } from "@/lib/dimension-utils";

interface AltruismCardProps {
  value: number;
  description: string;
}

export function AltruismCard({ value, description }: AltruismCardProps) {
  const { locale } = useLocale();
  const isHu = locale === "hu";
  const tier = getDimensionTier(value);
  const colors = tierColors[tier];

  return (
    <div className="mt-6">
      {/* Info banner */}
      <div className="mb-3 flex items-start gap-2.5 rounded-xl border-[1.5px] border-[#ddd5c8] bg-[#f2ede6] p-4">
        <span className="mt-0.5 shrink-0 text-sm text-[#8a8a9a]">ℹ</span>
        <div>
          <p className="text-xs font-semibold text-[#1a1a2e]">
            {isHu ? "Altruizmus (kiegészítő skála)" : "Altruism (supplementary scale)"}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-[#8a8a9a]">
            {isHu
              ? "Több fő dimenzióhoz is kapcsolódik, ezért nem számít bele a 6 főfaktor átlagába. Külön pontszámként érdemes nézni."
              : "This scale relates to multiple dimensions, so it's not included in the 6-factor average. Worth looking at as a separate score."}
          </p>
        </div>
      </div>

      {/* Altruism card */}
      <div className={`overflow-hidden rounded-xl border-[1.5px] p-4 px-[18px] ${colors.border} ${colors.cardBg}`}>
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />
          <span className="flex-1 text-sm font-medium text-[#1a1a2e]">
            {isHu ? "Altruizmus" : "Altruism"}
          </span>
          <div className="h-1 w-[120px] shrink-0 overflow-hidden rounded-sm bg-[#e8e0d3]">
            <div className={`h-full rounded-sm ${colors.fill}`} style={{ width: `${value}%` }} />
          </div>
          <span className={`w-10 shrink-0 text-right font-fraunces text-base ${colors.text}`}>
            {value}%
          </span>
        </div>
        <p className="mt-2.5 text-[13px] leading-[1.7] text-[#4a4a5e]">{description}</p>
      </div>
    </div>
  );
}
