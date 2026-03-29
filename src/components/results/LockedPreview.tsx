"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

interface LockedPreviewProps {
  isPlus?: boolean;
}

export function LockedPreview({ isPlus = false }: LockedPreviewProps) {
  const { locale } = useLocale();

  if (isPlus) return null;

  return (
    <div className="mt-[18px] flex flex-col gap-2">
      <div className="flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-[#ddd5c8] bg-[#f2ede6] px-5 py-3.5 transition-colors hover:bg-[#e8e0d3]">
        <span className="shrink-0 text-[15px] opacity-25">🔒</span>
        <span className="flex-1 text-xs leading-relaxed text-[#8a8a9a]">
          {t("results.lockPreviewText", locale)}
        </span>
        <span className="shrink-0 rounded-md bg-[#fdf5ee] px-2.5 py-[3px] text-[9px] font-semibold text-[#8a5530]">
          Plus · €9
        </span>
      </div>
    </div>
  );
}
