"use client";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import type { SiteMode } from "@/components/landing/ModeSwitcher";
import { CheckIcon, ClockIcon, FlaskIcon, LockIcon } from "@/components/landing/icons";

export function TrustBar({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();

  // Self mode: trust pills are already in the hero section
  if (mode === "self") return null;

  const items = [
    { Icon: CheckIcon, text: t("landing.trustTeam1", locale) },
    { Icon: ClockIcon, text: t("landing.trustTeam2", locale) },
    { Icon: FlaskIcon, text: t("landing.trustTeam3", locale) },
    { Icon: LockIcon, text: t("landing.trustTeam4", locale) },
  ];

  return (
    <div className="border-y border-[var(--color-border-default)]">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-8 px-7 py-5">
        {items.map((item) => (
          <div key={item.text} className="flex items-center gap-2">
            <item.Icon className="h-4 w-4 shrink-0 text-[var(--color-action-primary-bg)]" />
            <span className="text-caption text-[var(--color-text-muted)]">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
