"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { runProfileEngine, type ProfileCategory } from "@/lib/profile-engine";
import {
  SECTION_TITLE,
  BLOCK1,
  BLOCK3_TITLE,
  BLOCK4_TITLE,
  BLOCK4_EMPTY,
  BLOCK5_TITLE,
  BLOCK5_STRONG,
  BLOCK5_MEDIUM,
  BLOCK5_WATCH,
  BLOCK6_TITLE,
  BLOCK7_TITLE,
  BLOCK8,
  DEFAULT_NARRATIVE,
  BLOCK3_SUMMARIES,
  DIM_LABELS,
  CATEGORY_LABELS,
  RESOLUTION_NARRATIVES,
  RISK_TEXTS,
  ROLE_TEXTS,
  getEnvRows,
  type Locale,
} from "@/lib/profile-content";

interface ProfileInsightsProps {
  dimensions: Record<string, number>;
  testType: string;
}

function categoryColor(cat: ProfileCategory): string {
  if (cat === "high") return "bg-indigo-500";
  if (cat === "low") return "bg-gray-300";
  return "bg-violet-300";
}

function categoryTextColor(cat: ProfileCategory): string {
  if (cat === "high") return "text-indigo-700 bg-indigo-50";
  if (cat === "low") return "text-gray-500 bg-gray-100";
  return "text-violet-600 bg-violet-50";
}

export function ProfileInsights({ dimensions, testType }: ProfileInsightsProps) {
  const { locale } = useLocale();
  const l = locale as Locale;

  const engine = useMemo(
    () => runProfileEngine(dimensions, testType),
    [dimensions, testType]
  );

  const { categories, block6Pairs, block7Pairs, showBlock6, showBlock7 } = engine;

  const envRows = useMemo(() => getEnvRows(categories), [categories]);

  // Block 3 narratíva: rövid összkép az aktív párok alapján (külön map, nem a 6/7 ismétlése)
  const block3Text = useMemo(() => {
    const allPairs = [...block7Pairs, ...block6Pairs];
    if (allPairs.length === 0) return DEFAULT_NARRATIVE[l];
    return allPairs
      .map((p) => BLOCK3_SUMMARIES[p.contentKey]?.[l] ?? "")
      .filter(Boolean)
      .join(" ");
  }, [block6Pairs, block7Pairs, l]);

  // Block 5: az összes aktív pár szerepkör-ajánlásait egyesítjük
  const roleData = useMemo(() => {
    const allPairs = [...block7Pairs, ...block6Pairs];
    if (allPairs.length === 0) return null;
    // Ha több pár is van, az első dominál
    const primary = allPairs[0];
    return ROLE_TEXTS[primary.contentKey]?.[l] ?? null;
  }, [block6Pairs, block7Pairs, l]);

  // Dimenziók megjelenítési sorrendje
  const dimOrder = ["H", "E", "X", "A", "C", "O"];
  const displayDims = dimOrder.filter((d) => categories[d] !== undefined);

  return (
    <div className="space-y-6 mt-6">
      {/* ── Section title ── */}
      <div className="flex items-center gap-3">
        <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {SECTION_TITLE[l]}
        </h2>
      </div>

      {/* ── Block 1: Bevezető framing ── */}
      <section className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 p-6 shadow-md shadow-indigo-200/50">
        <p className="text-sm text-white/90 leading-relaxed italic">{BLOCK1[l]}</p>
      </section>

      {/* ── Block 2: Dimenzióprofil ── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-500 mb-4">
          Dimenzió&shy;profil
        </h3>
        <div className="space-y-3">
          {displayDims.map((code) => {
            const cat = categories[code];
            const score = (() => {
              // Re-derive display score from original dimensions
              if (testType === "BIG_FIVE") {
                if (code === "E") return dimensions.N ?? dimensions.E ?? 0;
                if (code === "X") return dimensions.E ?? 0;
              }
              return dimensions[code] ?? 0;
            })();
            return (
              <div key={code} className="flex items-center gap-3">
                <span className="w-[130px] shrink-0 text-xs font-medium text-gray-700 truncate">
                  {DIM_LABELS[code]?.[l] ?? code}
                </span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${categoryColor(cat)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span
                  className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${categoryTextColor(cat)}`}
                >
                  {CATEGORY_LABELS[cat][l]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Block 3: Működési mintázatok ── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-500 mb-3">
          {BLOCK3_TITLE[l]}
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">{block3Text}</p>
      </section>

      {/* ── Block 4: Kedvező környezeti jellemzők ── */}
      {envRows.length > 0 ? (
        <section className="rounded-2xl border border-gray-100 bg-white p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-500 mb-4">
            {BLOCK4_TITLE[l]}
          </h3>
          <div className="divide-y divide-gray-50">
            {envRows.map((row, i) => (
              <div key={i} className="flex gap-4 py-2.5 first:pt-0 last:pb-0">
                <span className="w-36 shrink-0 text-xs font-semibold text-gray-500">
                  {row.label[l]}
                </span>
                <span className="text-xs text-gray-700">{row.value[l]}</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-gray-100 bg-white p-6">
          <p className="text-sm text-gray-500 italic">{BLOCK4_EMPTY[l]}</p>
        </section>
      )}

      {/* ── Block 5: Szerepkör-família ajánlás ── */}
      {roleData && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-500 mb-4">
            {BLOCK5_TITLE[l]}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">
                {BLOCK5_STRONG[l]}
              </p>
              <p className="text-sm text-gray-700">{roleData.strong}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wide mb-1">
                {BLOCK5_MEDIUM[l]}
              </p>
              <p className="text-sm text-gray-700">{roleData.medium}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-rose-500 uppercase tracking-wide mb-1">
                {BLOCK5_WATCH[l]}
              </p>
              <p className="text-sm text-gray-700">{roleData.watchOut}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Block 6: Kombináció-insight (csak feszültségteli, nem kockázatos pároknál) ── */}
      {showBlock6 && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 mb-3">
            {BLOCK6_TITLE[l]}
          </h3>
          <div className="space-y-3">
            {block6Pairs.map((pair) => (
              <p key={pair.contentKey} className="text-sm text-indigo-900 leading-relaxed">
                {RESOLUTION_NARRATIVES[pair.contentKey]?.[l]}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* ── Block 7: Kockázati jelzők (csak kockázatos pároknál) ── */}
      {showBlock7 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
          <div className="flex items-start gap-3">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 shrink-0 text-amber-500 mt-0.5"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-700">
                {BLOCK7_TITLE[l]}
              </h3>
              {block7Pairs.map((pair) => (
                <p key={pair.contentKey} className="text-sm text-amber-900 leading-relaxed">
                  {RISK_TEXTS[pair.contentKey]?.[l]}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Block 8: Záró framing ── */}
      <section className="rounded-2xl border border-purple-200/70 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-6 shadow-md shadow-purple-200/50">
        <p className="text-sm text-white/90 leading-relaxed italic">{BLOCK8[l]}</p>
      </section>
    </div>
  );
}
