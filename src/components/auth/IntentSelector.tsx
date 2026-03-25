"use client";

import type React from "react";

export type AuthIntent = "explore" | "team";

interface IntentSelectorProps {
  value: AuthIntent;
  onChange: (intent: AuthIntent) => void;
}

const OPTIONS: { value: AuthIntent; label: string }[] = [
  { value: "explore", label: "Önismeret" },
  { value: "team", label: "Csapatfejlesztés" },
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
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                "flex flex-col items-start rounded-lg border px-4 py-3 text-left transition",
                active
                  ? "border-sage bg-[#fdf5f2]"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white",
              ].join(" ")}
            >
              <span className="mb-1">{ICONS[opt.value](active)}</span>
              <span
                className={[
                  "text-sm font-semibold",
                  active ? "text-bronze" : "text-gray-700",
                ].join(" ")}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
