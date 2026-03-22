import type { Locale } from "@/lib/i18n";

interface FacetEntry {
  code: string;
  label: string;
  score: number;
}

interface DimWithFacets {
  code: string;
  label: string;
  color: string;
  facets: FacetEntry[];
}

interface FacetBreakdownProps {
  dimensions: DimWithFacets[];
  locale: Locale;
}

export function FacetBreakdown({ dimensions, locale }: FacetBreakdownProps) {
  const isHu = locale === "hu";
  const hasFacets = dimensions.some((d) => d.facets.length > 0);

  if (!hasFacets) {
    return (
      <p className="text-sm text-[#a09a90]">
        {isHu
          ? "Ehhez a teszttípushoz nincs facet-szintű bontás."
          : "No facet-level breakdown available for this test type."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {dimensions
        .filter((d) => d.facets.length > 0)
        .map((dim) => (
          <div key={dim.code}>
            {/* Dimension header */}
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-semibold text-white"
                style={{ backgroundColor: dim.color }}
              >
                {dim.code}
              </div>
              <span className="text-sm font-semibold text-[#1a1814]">{dim.label}</span>
            </div>

            {/* Facet list */}
            <div className="rounded-xl border border-[#e8e4dc] bg-white overflow-hidden">
              {dim.facets.map((facet, idx) => (
                <div
                  key={facet.code}
                  className={`flex items-center gap-4 px-5 py-3.5 ${
                    idx < dim.facets.length - 1 ? "border-b border-[#f5f3ef]" : ""
                  }`}
                >
                  <span className="w-36 shrink-0 text-sm text-[#3d3a35]">{facet.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#e8e4dc]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${facet.score}%`,
                        backgroundColor: dim.color,
                      }}
                    />
                  </div>
                  <span className="shrink-0 font-mono text-xs text-[#5a5650] w-9 text-right">
                    {facet.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
