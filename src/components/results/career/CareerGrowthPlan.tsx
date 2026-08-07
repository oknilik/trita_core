"use client";

import { useLocale } from "@/components/LocaleProvider";
import { dimColors } from "@/lib/color-system";
import { t, tf } from "@/lib/i18n";
import { TRITAN_DIMENSIONS } from "@/lib/tritan";
import { GROWTH_BY_POLE, type Pole } from "@/lib/career/growth-content";
import type { CareerResultView } from "@/lib/career/service";
import type { DimCode } from "@/lib/career/types";

// Irány-tudatos fejlődési blokk: a felső klaszterekben leggyakoribb ELTÉRÉST
// nézi, és megtartja az irányát. (A v1 dimenzió-szinten tanácsolt, ezért
// „cél fölötti” eltérésnél az ellenkező irányba küldte a felhasználót.)

interface GapCount {
  dim: DimCode;
  pole: Pole;
  count: number;
  weight: number;
}

function collectGaps(result: CareerResultView, max = 2): GapCount[] {
  const buckets = new Map<string, GapCount>();
  const top = [...result.sections.atLevel, ...result.sections.afterTraining]
    .slice(0, 2)
    .flat();
  for (const fit of top) {
    for (const component of fit.components) {
      if (component.position === "in" || component.weight < 0.15) continue;
      const key = `${component.dim}:${component.position}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.count += 1;
        existing.weight += component.weight;
      } else {
        buckets.set(key, {
          dim: component.dim,
          pole: component.position,
          count: 1,
          weight: component.weight,
        });
      }
    }
  }
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count || b.weight - a.weight)
    .slice(0, max);
}

export function CareerGrowthPlan({
  result,
  items = [],
}: {
  result: CareerResultView;
  /** facet-szintű fejlődési kártyák a profilból (opcionális kiegészítés) */
  items?: Array<{ code: string; label: string; score: number; dimCode: string; dimColor: string }>;
}) {
  const { locale } = useLocale();
  const isHu = locale === "hu";
  const gaps = collectGaps(result);
  if (gaps.length === 0) {
    if (result.sections.atLevel.length + result.sections.afterTraining.length === 0) return null;
    // Nincs jelentős eltérés: ezt ki KELL mondani, különben a hiányzó blokk
    // úgy néz ki, mintha elmaradt volna valami.
    return (
      <div className="mt-5 rounded-[12px] border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4">
        <p className="text-caption font-semibold text-[var(--color-text-primary)]">
          {t("results.cfGrowthNoneTitle", locale)}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
          {t("results.cfGrowthNoneBody", locale)}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-[12px] border border-amber-200 bg-amber-50/50 p-4">
      <p className="text-caption font-semibold text-amber-900">
        {t("results.cfGrowthTitle", locale)}
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-amber-900/80">
        {t("results.cfGrowthIntro", locale)}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {gaps.map((gap) => {
          const dim = TRITAN_DIMENSIONS[gap.dim];
          const content = GROWTH_BY_POLE[gap.dim][gap.pole][isHu ? "hu" : "en"];
          return (
            <div
              key={`${gap.dim}-${gap.pole}`}
              className="rounded-[12px] border border-amber-200/70 bg-surface-card p-3.5"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-micro font-semibold text-[var(--color-text-secondary)]">
                  {dim.letter} {isHu ? dim.hu : dim.en}
                </span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-micro font-medium text-amber-900">
                  {t(
                    gap.pole === "under" ? "results.cfGapUnder" : "results.cfGapOver",
                    locale,
                  )}
                </span>
                <span className="text-micro text-[var(--color-text-muted)]">
                  {tf("results.cfGapRoles", locale, { count: gap.count })}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                {content.headline}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                {content.action}
              </p>
            </div>
          );
        })}
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {items
            .filter((item) => gaps.some((gap) => gap.dim === item.dimCode))
            .slice(0, 4)
            .map((item) => (
              <span
                key={item.code}
                className="rounded-full border px-2.5 py-1 text-micro font-medium"
                style={{
                  backgroundColor: dimColors(item.dimCode).soft,
                  color: dimColors(item.dimCode).strong,
                  borderColor: dimColors(item.dimCode).base,
                }}
              >
                {item.label} · {item.score}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
