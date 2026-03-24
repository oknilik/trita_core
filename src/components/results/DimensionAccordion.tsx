"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getDimensionTier, tierColors, dimensionFacets } from "@/lib/dimension-utils";

interface FacetEntry {
  code: string;
  label: string;
  score: number;
}

interface DimensionEntry {
  code: string;
  name: string;
  value: number;
  description: string;
  insight: string;
  facets?: FacetEntry[];
}

interface DimensionAccordionProps {
  dimensions: DimensionEntry[];
  showUpsell?: boolean;
}

function AccordionItem({
  code,
  name,
  value,
  description,
  insight,
  facets,
  isOpen,
  onToggle,
  showUpsell,
}: {
  code: string;
  name: string;
  value: number;
  description: string;
  insight: string;
  facets: FacetEntry[];
  isOpen: boolean;
  onToggle: () => void;
  showUpsell: boolean;
}) {
  const tier = getDimensionTier(value);
  const colors = tierColors[tier];
  const facetNames = dimensionFacets[code] || [];
  const hasFacetData = facets.length > 0 && !showUpsell;

  return (
    <div
      className={`mb-2.5 overflow-hidden rounded-[14px] border-[1.5px] transition-shadow hover:shadow-[0_2px_12px_rgba(26,26,46,0.04)] ${colors.border}`}
    >
      {/* HEADER */}
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-[18px] py-3.5 text-left transition-colors ${colors.cardBg} ${colors.cardHover}`}
      >
        <div className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />
        <span className="flex-1 text-sm font-medium text-[#1a1a2e]">
          {name}
        </span>
        <div className="h-1 w-[120px] shrink-0 overflow-hidden rounded-sm bg-[#e8e0d3]">
          <div
            className={`h-full rounded-sm ${colors.fill}`}
            style={{ width: `${value}%` }}
          />
        </div>
        <span
          className={`w-10 shrink-0 text-right font-fraunces text-base ${colors.text}`}
        >
          {value}%
        </span>
        <span
          className={`shrink-0 text-[11px] text-[#8a8a9a] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {/* BODY */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#e8e0d3] bg-[#f2ede6] p-[18px] pb-5">
              {/* Insight (rövid) — mindig látszik */}
              <p className="mb-2 text-[13px] font-medium leading-[1.7] text-[#1a1a2e]">
                {insight}
              </p>

              {/* Description (bővebb) — csak Plus+ */}
              {!showUpsell && (
                <p className="mb-3.5 text-[13px] leading-[1.7] text-[#4a4a5e]">
                  {description}
                </p>
              )}

              {/* Facet mini-cards — Self Plus unlocked */}
              {hasFacetData && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {facets.map((f) => {
                    const fTier = getDimensionTier(f.score);
                    const fColors = tierColors[fTier];
                    return (
                      <div
                        key={f.code}
                        className="flex items-center gap-2.5 rounded-[10px] border border-[#e8e0d3] bg-white px-3.5 py-3"
                      >
                        <span className="flex-1 text-xs font-medium text-[#1a1a2e]">
                          {f.label}
                        </span>
                        <div className="h-1 w-[60px] shrink-0 overflow-hidden rounded-sm bg-[#e8e0d3]">
                          <div
                            className={`h-full rounded-sm ${fColors.fill}`}
                            style={{ width: `${f.score}%` }}
                          />
                        </div>
                        <span
                          className={`w-6 shrink-0 text-right text-[11px] font-semibold ${fColors.text}`}
                        >
                          {f.score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upsell teaser — Self Start only */}
              {showUpsell && facetNames.length > 0 && (
                <div className="mt-4 flex items-center gap-3 rounded-[10px] bg-[#1a1a2e] px-4 py-3">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-[#c17f4a]/[0.12] font-fraunces text-sm font-medium text-[#e8a96a]">
                    +{facetNames.length}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white">
                      {facetNames.length} alskála részletesen
                    </p>
                    <p className="truncate text-[10px] text-white/[0.35]">
                      {facetNames.join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg bg-[#c17f4a] px-4 py-[7px] text-[10px] font-semibold text-white transition hover:-translate-y-px hover:brightness-110"
                  >
                    Feloldom — €7
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DimensionAccordion({
  dimensions,
  showUpsell = false,
}: DimensionAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section>
      <p className="text-[10px] uppercase tracking-widest text-[#8a8a9a]">
        Dimenziók
      </p>
      <h2 className="mt-1.5 font-fraunces text-[22px] tracking-tight text-[#1a1a2e]">
        Így működsz a fő dimenziók mentén
      </h2>
      <p className="mb-6 mt-2 max-w-[540px] text-[13px] leading-relaxed text-[#8a8a9a]">
        A dimenziók nem skatulyák, hanem mintázatok: megmutatják, mi mozgat, mi
        ad stabilitást, és hol jöhet feszültség.
      </p>

      {dimensions.map((dim, i) => (
        <AccordionItem
          key={dim.code}
          code={dim.code}
          name={dim.name}
          value={dim.value}
          description={dim.description}
          insight={dim.insight}
          facets={dim.facets ?? []}
          isOpen={openIdx === i}
          onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          showUpsell={showUpsell}
        />
      ))}
    </section>
  );
}
