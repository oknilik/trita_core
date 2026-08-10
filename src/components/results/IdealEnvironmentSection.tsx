"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { ENV_ROW_LABELS, ENV_ROW_POLES, type EnvRowKey } from "@/lib/profile-content";

interface EnvItem {
  label: string;
  value: string;
}

interface IdealEnvironmentSectionProps {
  items: EnvItem[];
  isUnlocked: boolean;
}

// Bármely lokalizált sor-címke (hu VAGY en) → kanonikus kulcs. A címkék
// forrása ugyanaz az ENV_ROW_LABELS, amiből a getEnvRows dolgozik, így a
// pólus-feliratok MINDKÉT nyelven feloldódnak — a korábbi EN üres-pólus a
// lokalizált-címke-mint-kulcs törékenységéből fakadt (pl. „Load management"
// sosem talált „Stress tolerance" kulcsot).
const LABEL_TO_ENV_KEY: Record<string, EnvRowKey> = Object.fromEntries(
  (Object.entries(ENV_ROW_LABELS) as Array<[EnvRowKey, { hu: string; en: string }]>).flatMap(
    ([key, label]) => [
      [label.hu, key] as [string, EnvRowKey],
      [label.en, key] as [string, EnvRowKey],
    ],
  ),
);

function getShortLabel(value: string, locale: Locale): string {
  const v = value.toLowerCase();
  if (v.startsWith("magas") || v.startsWith("high")) return t("content.envLabelHigh", locale);
  if (v.startsWith("alacsony") || v.startsWith("low")) return t("content.envLabelLow", locale);
  if (v.startsWith("közepes") || v.startsWith("medium")) return t("content.envLabelMedium", locale);
  if (v.startsWith("rövid") || v.startsWith("short")) return t("content.envLabelShort", locale);
  if (v.startsWith("hosszú") || v.startsWith("long")) return t("content.envLabelLong", locale);
  if (v.startsWith("gyors") || v.startsWith("fast")) return t("content.envLabelFast", locale);
  return t("content.envLabelMedium", locale);
}

function getPosition(value: string): number {
  const v = value.toLowerCase();
  if (v.startsWith("magas") || v.startsWith("high")) return 80;
  if (v.startsWith("alacsony") || v.startsWith("low")) return 20;
  if (v.startsWith("közepes") || v.startsWith("medium")) return 50;
  if (v.startsWith("rövid") || v.startsWith("short")) return 30;
  if (v.startsWith("hosszú") || v.startsWith("long")) return 75;
  if (v.startsWith("gyors") || v.startsWith("fast")) return 78;
  if (v.startsWith("értékvezérelt") || v.startsWith("values")) return 80;
  if (v.startsWith("teljesítmény") || v.startsWith("performance")) return 25;
  return 50;
}

function getDescription(value: string): string {
  const dashIdx = value.indexOf(" – ");
  const dashIdx2 = value.indexOf(" — ");
  const idx = dashIdx2 >= 0 ? dashIdx2 : dashIdx;
  return idx >= 0 ? value.slice(idx + 3).trim() : value;
}

export function IdealEnvironmentSection({ items, isUnlocked }: IdealEnvironmentSectionProps) {
  const { locale } = useLocale();

  if (!isUnlocked || items.length === 0) return null;

  return (
    <div className="py-8">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-action-primary-bg)]" />
        <p className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
          {t("results.envEyebrow", locale)}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {items.map((item) => {
          const envKey = LABEL_TO_ENV_KEY[item.label];
          const polePair = envKey ? ENV_ROW_POLES[envKey] : null;
          const poles = polePair
            ? { low: polePair.low[locale], high: polePair.high[locale] }
            : { low: "", high: "" };
          const pos = getPosition(item.value);
          const desc = getDescription(item.value);

          return (
            <div
              key={item.label}
              className="flex flex-col gap-2 rounded-[10px] border border-[var(--color-border-soft)] bg-surface-card px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="text-xs font-medium text-[var(--color-text-primary)] sm:w-[130px] sm:shrink-0">
                {item.label}
              </span>
              <div className="min-w-0 flex-1">
                {/* Track container — marker centered on track via flex */}
                <div className="flex items-center" style={{ height: 10 }}>
                  <div className="relative h-1 w-full rounded-sm bg-[var(--color-border-default)]">
                    <div
                      className="absolute top-1/2 h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm"
                      style={{
                        left: `clamp(5px, ${pos}%, calc(100% - 5px))`,
                        transform: "translate(-50%, -50%)",
                        backgroundColor: pos >= 65 ? "var(--color-action-primary-bg)" : pos <= 35 ? "var(--color-text-muted)" : "var(--color-accent-primary)",
                      }}
                    />
                  </div>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-micro text-[var(--color-text-muted)]">{poles.low}</span>
                  <span className="text-micro text-[var(--color-text-muted)]">{poles.high}</span>
                </div>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] sm:w-[180px] sm:shrink-0 sm:text-right">
                <strong className="text-[var(--color-text-primary)]">{getShortLabel(item.value, locale)}</strong> — {desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
