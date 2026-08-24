"use client";

import type React from "react";
import { useLocale } from "@/components/LocaleProvider";

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
    desc: "Saját működésed és természetes csapatszerepeid megértéséhez",
    descEn: "To understand how you work and the team roles that come naturally to you",
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
    <svg viewBox="0 0 16 16" fill="none" className="h-5 w-5 shrink-0" stroke={active ? "var(--color-action-primary-bg)" : "var(--color-text-muted)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3" /><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  ),
  team: (active) => (
    <svg viewBox="0 0 16 16" fill="none" className="h-5 w-5 shrink-0" stroke={active ? "var(--color-action-primary-bg)" : "var(--color-text-muted)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5" /><circle cx="11" cy="5" r="2.5" /><path d="M1 14c0-2.5 2-4.5 5-4.5 1 0 1.8.2 2.5.6M8.5 14c0-2.5 2-4.5 5-4.5" />
    </svg>
  ),
};

export default function IntentSelector({ value, onChange }: IntentSelectorProps) {
  const { locale } = useLocale();
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2" role="radiogroup" aria-label={locale === "hu" ? "Regisztráció célja" : "Sign-up goal"}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            role="radio"
            aria-checked={active}
            className={[
              "flex flex-col items-start rounded-xl border-[1.5px] px-4 py-3 text-left transition-all",
              active
                ? "border-[var(--color-action-primary-bg)]/30 bg-[var(--color-surface-self-accent-soft)]/40 shadow-sm"
                : "border-[var(--color-border-default)] bg-surface-card hover:border-[var(--color-border-soft)] hover:bg-[var(--color-surface-subtle)]",
            ].join(" ")}
          >
            <span className="mb-1.5">{ICONS[opt.value](active)}</span>
            <span
              className={[
                "text-sm font-semibold",
                active ? "text-[var(--color-action-primary-bg)]" : "text-[var(--color-text-secondary)]",
              ].join(" ")}
            >
              {locale === "hu" ? opt.label : opt.labelEn}
            </span>
            <span className="mt-0.5 text-note leading-snug text-[var(--color-text-muted)]">
              {locale === "hu" ? opt.desc : opt.descEn}
            </span>
          </button>
        );
      })}
    </div>
  );
}
