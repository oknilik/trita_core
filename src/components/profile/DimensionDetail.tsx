import type { Locale } from "@/lib/i18n";

interface DimDetailEntry {
  code: string;
  label: string;
  color: string;
  score: number;
  insight: string;
}

interface DimensionDetailProps {
  dimensions: DimDetailEntry[];
  locale: Locale;
}

function scoreLabel(score: number, locale: Locale): string {
  if (locale === "hu") {
    if (score < 40) return "Alacsony";
    if (score < 70) return "Közepes";
    return "Magas";
  }
  if (score < 40) return "Low";
  if (score < 70) return "Medium";
  return "High";
}

export function DimensionDetail({ dimensions, locale }: DimensionDetailProps) {
  const isHu = locale === "hu";

  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[2px] text-bronze">
        {isHu ? "// dimenziók" : "// dimensions"}
      </p>
      <h2 className="mt-2 mb-6 font-fraunces text-2xl text-ink">
        {isHu ? "A 6 dimenzió részletesen" : "6 dimensions in detail"}
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {dimensions.map((dim) => {
          const level = scoreLabel(dim.score, locale);
          return (
            <div
              key={dim.code}
              className="rounded-2xl border border-sand bg-white p-5"
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-semibold text-white shrink-0"
                    style={{ backgroundColor: dim.color }}
                  >
                    {dim.code}
                  </div>
                  <span className="font-semibold text-sm text-ink">{dim.label}</span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-body">{dim.score}%</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: `${dim.color}18`,
                      color: dim.color,
                    }}
                  >
                    {level}
                  </span>
                </div>
              </div>

              {/* Score bar */}
              <div className="h-1.5 w-full rounded-full bg-sand mb-4">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${dim.score}%`, backgroundColor: dim.color }}
                />
              </div>

              {/* Insight text */}
              <p className="text-sm leading-relaxed text-ink-body">{dim.insight}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
