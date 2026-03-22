import type { Locale } from "@/lib/i18n";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { BLOCK1 } from "@/lib/profile-content";

interface DimEntry {
  code: string;
  label: string;
  color: string;
  score: number;
  observerScore?: number;
}

interface DimensionOverviewProps {
  dimensions: DimEntry[];
  showObserver: boolean;
  locale: Locale;
}

export function DimensionOverview({
  dimensions,
  showObserver,
  locale,
}: DimensionOverviewProps) {
  const isHu = locale === "hu";

  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
        {isHu ? "// áttekintés" : "// overview"}
      </p>
      <h2 className="mt-2 font-playfair text-2xl text-[#1a1814]">
        {isHu ? "Személyiségprofilod" : "Your personality profile"}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5a5650]">
        {BLOCK1[locale] ?? BLOCK1.hu}
      </p>

      <div className="mt-8 flex flex-col items-center gap-6 md:flex-row md:items-start">
        {/* Radar chart */}
        <div className="w-full max-w-[320px] shrink-0 md:w-[280px]">
          <RadarChart
            dimensions={dimensions}
            showObserver={showObserver}
            uid="profile-overview"
          />
        </div>

        {/* Dimension score pills */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {dimensions.map((dim) => (
              <div
                key={dim.code}
                className="flex items-center gap-3 rounded-xl border border-[#e8e4dc] bg-white px-4 py-3"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold text-white"
                  style={{ backgroundColor: dim.color }}
                >
                  {dim.code}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1a1814] truncate">{dim.label}</p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#e8e4dc]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${dim.score}%`, backgroundColor: dim.color }}
                    />
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs text-[#5a5650]">
                  {dim.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
