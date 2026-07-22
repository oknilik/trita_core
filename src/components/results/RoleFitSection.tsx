"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

interface RoleFitSectionProps {
  strongFit: string;
  mightWork: string;
  needsPrep: string;
  strongRoles?: string[];
  mightRoles?: string[];
  prepRoles?: string[];
  isUnlocked: boolean;
}

const TIERS = [
  {
    key: "strong" as const,
    i18nKey: "content.roleFitStrong",
    bg: "bg-[var(--color-surface-self-accent-soft)]",
    borderColor: "var(--color-action-primary-bg)",
    labelColor: "text-[var(--color-accent-self-deep)]",
    pillClass: "bg-[var(--color-action-primary-bg)]/[0.15] text-[var(--color-action-primary-bg)]",
  },
  {
    key: "might" as const,
    i18nKey: "content.roleFitMaybe",
    bg: "bg-[var(--color-surface-highlight-warm)]",
    borderColor: "var(--color-accent-primary)",
    labelColor: "text-[var(--color-accent-primary-strong)]",
    pillClass: "bg-[var(--color-accent-primary)]/[0.12] text-[var(--color-accent-primary-strong)]",
  },
  {
    key: "prep" as const,
    i18nKey: "content.roleFitPrep",
    bg: "bg-[var(--color-surface-subtle)]",
    borderColor: "var(--color-text-muted)",
    labelColor: "text-[var(--color-text-muted)]",
    pillClass: "bg-[var(--color-text-muted)]/[0.1] text-[var(--color-text-muted)]",
  },
];

export function RoleFitSection({
  strongFit,
  mightWork,
  needsPrep,
  strongRoles,
  mightRoles,
  prepRoles,
  isUnlocked,
}: RoleFitSectionProps) {
  const { locale } = useLocale();

  if (!isUnlocked) return null;

  const texts = { strong: strongFit, might: mightWork, prep: needsPrep };
  const roles = {
    strong: strongRoles ?? [],
    might: mightRoles ?? [],
    prep: prepRoles ?? [],
  };

  return (
    <div className="py-8">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-action-primary-bg)]" />
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
          {t("results.roleFitEyebrow", locale)}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {TIERS.map((tier) => {
          const text = texts[tier.key];
          if (!text) return null;
          const tierRoles = roles[tier.key];

          return (
            <div
              key={tier.key}
              className={`rounded-r-[14px] p-4 px-[18px] ${tier.bg}`}
              style={{ borderLeft: `4px solid ${tier.borderColor}` }}
            >
              <p
                className={`mb-1 text-[9px] font-bold uppercase tracking-wide ${tier.labelColor}`}
              >
                {t(tier.i18nKey, locale)}
              </p>
              <p className="mb-2.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                {text}
              </p>
              {tierRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tierRoles.map((role) => (
                    <span
                      key={role}
                      className={`rounded-full px-2.5 py-1 text-[10px] ${tier.pillClass}`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
