"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

export type SiteMode = "self" | "team";

function ModeSwitcherInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLocale();
  const mode = (searchParams.get("mode") ?? "self") as SiteMode;

  const switchTo = (m: SiteMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", m);
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[#e8e0d3] bg-white/80 p-1 backdrop-blur-sm">
      {(["self", "team"] as SiteMode[]).map((m) => {
        const isActive = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => switchTo(m)}
            className={[
              "flex min-h-[44px] items-center gap-1.5 rounded-full px-5 py-2 text-xs font-medium transition-all duration-200",
              isActive
                ? "bg-[#3d6b5e] text-white shadow-sm"
                : "text-[#8a8a9a] hover:text-[#4a4a5e]",
            ].join(" ")}
          >
            {m === "self" ? (
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" stroke={isActive ? "#e8a96a" : "#c17f4a"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="5" r="3" />
                <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" stroke={isActive ? "#e8a96a" : "#c17f4a"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="5" r="2.5" />
                <circle cx="11" cy="5" r="2.5" />
                <path d="M1 14c0-2.5 2-4.5 5-4.5 1 0 1.8.2 2.5.6M8.5 14c0-2.5 2-4.5 5-4.5" />
              </svg>
            )}
            {m === "self" ? t("nav.modeSelf", locale) : t("nav.modeTeam", locale)}
          </button>
        );
      })}
    </div>
  );
}

export function ModeSwitcher() {
  const { locale } = useLocale();
  return (
    <Suspense
      fallback={
        <div className="inline-flex items-center gap-1 rounded-full border border-[#e8e0d3] bg-white/80 p-1">
          <div className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#3d6b5e] px-5 py-2 text-xs font-medium text-white shadow-sm">
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" stroke="#e8a96a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5" r="3" /><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /></svg>
            {t("nav.modeSelf", locale)}
          </div>
          <div className="flex min-h-[44px] items-center gap-1.5 rounded-full px-5 py-2 text-xs font-medium text-[#8a8a9a]">
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" stroke="#c17f4a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.5" /><circle cx="11" cy="5" r="2.5" /><path d="M1 14c0-2.5 2-4.5 5-4.5 1 0 1.8.2 2.5.6M8.5 14c0-2.5 2-4.5 5-4.5" /></svg>
            {t("nav.modeTeam", locale)}
          </div>
        </div>
      }
    >
      <ModeSwitcherInner />
    </Suspense>
  );
}
