"use client";

import type React from "react";

export type AuthIntent = "explore" | "team";

interface IntentSelectorProps {
  value: AuthIntent | null;
  onChange: (intent: AuthIntent) => void;
}

const OPTIONS: { value: AuthIntent; label: string; labelEn: string; desc: string; descEn: string }[] = [
  {
    value: "explore",
    label: "Önismeret",
    labelEn: "Self-awareness",
    desc: "Saját profilod és karrierképed feltérképezéséhez",
    descEn: "To map out your own profile and career fit",
  },
  {
    value: "team",
    label: "Csapatfejlesztés",
    labelEn: "Team development",
    desc: "Csapatdinamika és közös működés megértéséhez",
    descEn: "To understand team dynamics and collaboration",
  },
];

const ICONS: Record<AuthIntent, (active: boolean) => React.ReactNode> = {
  explore: (active) => (
    <svg viewBox="0 0 16 16" fill="none" className="h-5 w-5 shrink-0" stroke={active ? "#3d6b5e" : "#8a8a9a"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3" /><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  ),
  team: (active) => (
    <svg viewBox="0 0 16 16" fill="none" className="h-5 w-5 shrink-0" stroke={active ? "#3d6b5e" : "#8a8a9a"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5" /><circle cx="11" cy="5" r="2.5" /><path d="M1 14c0-2.5 2-4.5 5-4.5 1 0 1.8.2 2.5.6M8.5 14c0-2.5 2-4.5 5-4.5" />
    </svg>
  ),
};

export default function IntentSelector({ value, onChange }: IntentSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "flex flex-col items-start rounded-xl border-[1.5px] px-4 py-3 text-left transition-all",
              active
                ? "border-[#3d6b5e]/30 bg-[#e8f2f0]/40 shadow-sm"
                : "border-[#e8e0d3] bg-white hover:border-[#ddd5c8] hover:bg-[#f2ede6]",
            ].join(" ")}
          >
            <span className="mb-1.5">{ICONS[opt.value](active)}</span>
            <span
              className={[
                "text-sm font-semibold",
                active ? "text-[#3d6b5e]" : "text-[#4a4a5e]",
              ].join(" ")}
            >
              {opt.label}
            </span>
            <span className="mt-0.5 text-[11px] leading-snug text-[#8a8a9a]">
              {opt.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}
