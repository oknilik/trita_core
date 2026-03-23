"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense } from "react";

export type SiteMode = "self" | "team";

function ModeSwitcherInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const mode = (searchParams.get("mode") ?? "self") as SiteMode;

  const switchTo = (m: SiteMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", m);
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  return (
    <div className="inline-flex items-center rounded-full bg-[#1a1a2e] p-1">
      {(["self", "team"] as SiteMode[]).map((m) => {
        const isActive = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => switchTo(m)}
            className={[
              "flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-medium transition-all duration-300",
              isActive && m === "self"
                ? "bg-[#c17f4a] text-white shadow-[0_2px_10px_rgba(193,127,74,0.35)]"
                : isActive && m === "team"
                  ? "bg-[#3d6b5e] text-white shadow-[0_2px_10px_rgba(61,107,94,0.35)]"
                  : "bg-transparent text-white/35 hover:text-white/55",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="text-xs">{m === "self" ? "👤" : "👥"}</span>
            {m === "self" ? "Egyéneknek" : "Csapatoknak"}
          </button>
        );
      })}
    </div>
  );
}

export function ModeSwitcher() {
  return (
    <Suspense
      fallback={
        <div className="inline-flex items-center rounded-full bg-[#1a1a2e] p-1">
          <div className="flex items-center gap-1.5 rounded-full bg-[#c17f4a] px-5 py-2 text-[13px] font-medium text-white">
            <span className="text-xs">👤</span>Egyéneknek
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-medium text-white/35">
            <span className="text-xs">👥</span>Csapatoknak
          </div>
        </div>
      }
    >
      <ModeSwitcherInner />
    </Suspense>
  );
}
