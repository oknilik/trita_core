"use client";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { HEXACO_ORDER } from "@/lib/hexaco";
import { dimColorsCss } from "@/lib/color-system";
import { getDimensionLabel } from "@/lib/dimension-utils";
import { t, type Locale } from "@/lib/i18n";

/** Shared overview for the individual report and authorized consultant profiles. */
export function PersonalityOverview({
  dimensions,
  locale,
  uid,
  note,
}: {
  dimensions: { code: string; color: string; score: number; label: string }[];
  locale: Locale;
  uid: string;
  note?: string;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
      <div className="mx-auto w-full max-w-[320px]">
        <RadarChart
          dimensions={dimensions.map((d) => ({
            code: d.code,
            color: d.color,
            score: d.score,
          }))}
          uid={uid}
        />
      </div>
      <div>
        <p className="mb-1.5 text-note font-medium text-[var(--color-text-muted)]">
          {t("content.stripLabel", locale)}
        </p>
        {/* Soros lista a radar mellett — a hosszú dimenziónevek nem
                törnek, a sáv + szint-címke egy pillantásra olvasható. */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--color-border-soft)] bg-surface-card p-4">
          {/* Sorrend = a radar HEXACO-rendje (H·E·X·A·C·O), a színek és
                  az értékek a dimenzió-színt viselik — alacsony szintnél is
                  jól láthatóan. */}
          {HEXACO_ORDER.map((code) => dimensions.find((d) => d.code === code))
            .filter((d): d is (typeof dimensions)[number] => Boolean(d))
            .map((d) => {
              // Szín = dimenzió-identitás (a pötty és a szám eddig is ezt
              // vitte); a badge ezzel átáll a saját hue soft/strong
              // párjára, így a soron egyetlen színrendszer fut. A badge
              // SZÖVEGE a valencia-mentes szint-szó.
              const colors = dimColorsCss(d.code);
              return (
                <div key={d.code}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="min-w-0 flex-1 text-xs font-medium text-[var(--color-text-primary)]">
                      {d.label}
                    </span>
                    <span
                      className="shrink-0 rounded px-[7px] py-[2px] text-micro font-semibold"
                      style={{
                        backgroundColor: colors.soft,
                        color: colors.strong,
                      }}
                    >
                      {/* Valencia-mentes szint-szó (magas/közepes/
                              alacsony) — a pontszám nem kap minősítést. */}
                      {getDimensionLabel(d.score, locale)}
                    </span>
                    <span
                      className="w-8 shrink-0 text-right font-fraunces text-sm"
                      style={{ color: colors.strong }}
                    >
                      {d.score}
                    </span>
                  </div>
                  <div className="ml-4 mt-1 h-1 overflow-hidden rounded-sm bg-[var(--color-border-default)]">
                    <div
                      className="h-full rounded-sm"
                      style={{ width: `${d.score}%`, backgroundColor: d.color }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
        <p className="mt-3 text-micro leading-relaxed text-[var(--color-text-muted)]">
          {note ?? t("results.radarNote", locale)}
        </p>
      </div>
    </div>
  );
}
