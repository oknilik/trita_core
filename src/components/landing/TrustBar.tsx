"use client";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import type { SiteMode } from "@/components/landing/ModeSwitcher";

export function TrustBar({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();

  const items = mode === "self"
    ? [
        { icon: "⏱", text: t("landing.trustSelf1", locale) },
        { icon: "🔬", text: t("landing.trustSelf2", locale) },
        { icon: "⚡", text: t("landing.trustSelf3", locale) },
        { icon: "🆓", text: t("landing.trustSelf4", locale) },
      ]
    : [
        { icon: "✓", text: t("landing.trustTeam1", locale) },
        { icon: "⏱", text: t("landing.trustTeam2", locale) },
        { icon: "🔬", text: t("landing.trustTeam3", locale) },
        { icon: "🔒", text: t("landing.trustTeam4", locale) },
      ];

  return (
    <div className="border-y border-[#e8e0d3]">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-8 px-7 py-5">
        {items.map((item) => (
          <div key={item.text} className="flex items-center gap-2">
            <span className="text-base opacity-60">{item.icon}</span>
            <span className="text-[13px] text-[#8a8a9a]">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
