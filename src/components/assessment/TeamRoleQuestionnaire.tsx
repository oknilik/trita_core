"use client";

// ─────────────────────────────────────────────────────────────────────
// Csapatszerep-kitöltő — kiválasztás-alapú (2026-07-20).
//
// Egy itembank, két perspektíva: self (E/1) és peer (E/3, csapattársról).
// 1. fázis: a kitöltő kijelöli a leginkább jellemző 8–12 állítást;
// 2. fázis: a kijelöltek közül pontosan 3-at kiemel (dupla súly).
// A korábbi 7-szekciós pontelosztásos forma kivezetve (jogi kiváltás).
// ─────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from "react";
import {
  TEAM_ROLE_ITEMS,
  TEAM_ROLE_MIN_SELECT,
  TEAM_ROLE_MAX_SELECT,
  TEAM_ROLE_TOP_SELECT,
  getTeamRoleItemText,
  type TeamRolePerspective,
  type TeamRoleSelections,
} from "@/lib/team-role-questions";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface TeamRoleQuestionnaireProps {
  locale: Locale;
  perspective?: TeamRolePerspective;
  /** Peer-perspektívánál az értékelt csapattárs neve. */
  subjectName?: string;
  /** Self-flow: intro képernyővel indul. Peer-flow-ban a hívó adja az introt. */
  withIntro?: boolean;
  submitting?: boolean;
  onComplete: (selections: TeamRoleSelections) => void;
  onSkip?: () => void;
}

type Phase = "select" | "highlight";

export function TeamRoleQuestionnaire({
  locale,
  perspective = "self",
  subjectName,
  withIntro = true,
  submitting = false,
  onComplete,
  onSkip,
}: TeamRoleQuestionnaireProps) {
  const resolvedLocale: Locale = locale === "en" ? "en" : "hu";
  const textLocale = resolvedLocale === "en" ? "en" : "hu";
  const [showIntro, setShowIntro] = useState(withIntro);
  const [phase, setPhase] = useState<Phase>("select");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  const name = subjectName ?? "";

  // Stabil, de nem szerep-blokkos sorrend: az itemek szerepenként
  // felváltva következnek (OG1, KE1, KO1… OG2, KE2…), hogy a kitöltő ne
  // lásson tematikus csoportokat.
  const orderedItems = useMemo(() => {
    const byIndex: typeof TEAM_ROLE_ITEMS[] = [[], [], []];
    for (const item of TEAM_ROLE_ITEMS) {
      const idx = Number(item.id.slice(2)) - 1;
      byIndex[idx]?.push(item);
    }
    return byIndex.flat();
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < TEAM_ROLE_MAX_SELECT) {
        next.add(id);
      }
      return next;
    });
    setHighlighted((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleHighlight = useCallback((id: string) => {
    setHighlighted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < TEAM_ROLE_TOP_SELECT) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleFinish = useCallback(() => {
    const selections: TeamRoleSelections = {};
    for (const id of selected) {
      selections[id] = highlighted.has(id) ? 2 : 1;
    }
    onComplete(selections);
  }, [selected, highlighted, onComplete]);

  const selectValid =
    selected.size >= TEAM_ROLE_MIN_SELECT && selected.size <= TEAM_ROLE_MAX_SELECT;
  const highlightValid = highlighted.size === TEAM_ROLE_TOP_SELECT;

  if (showIntro) {
    return (
      <div className="flex flex-col gap-6 rounded-2xl border border-sand bg-white p-6 md:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-bronze">
          {t("teamRole.eyebrow", resolvedLocale)}
        </p>
        <div>
          <h2 className="font-fraunces text-2xl text-ink">
            {t("teamRole.introTitle", resolvedLocale)}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-body">
            {tf("teamRole.introBody1", resolvedLocale, {
              count: TEAM_ROLE_ITEMS.length,
              min: TEAM_ROLE_MIN_SELECT,
              max: TEAM_ROLE_MAX_SELECT,
            })}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-body">
            {tf("teamRole.introBody2", resolvedLocale, { top: TEAM_ROLE_TOP_SELECT })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowIntro(false)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark"
          >
            {t("teamRole.start", resolvedLocale)}
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-sand px-5 text-sm font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze"
            >
              {t("teamRole.skip", resolvedLocale)}
            </button>
          )}
        </div>
      </div>
    );
  }

  const visibleItems =
    phase === "select"
      ? orderedItems
      : orderedItems.filter((item) => selected.has(item.id));

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-sand bg-white p-6 md:p-10">
      {/* Fejléc + állapot */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-bronze">
          {t("teamRole.eyebrow", resolvedLocale)}
        </p>
        <h3 className="mt-1 font-fraunces text-xl text-ink">
          {phase === "select"
            ? perspective === "peer"
              ? tf("teamRole.selectHintPeer", resolvedLocale, {
                  name,
                  min: TEAM_ROLE_MIN_SELECT,
                  max: TEAM_ROLE_MAX_SELECT,
                })
              : tf("teamRole.selectHintSelf", resolvedLocale, {
                  min: TEAM_ROLE_MIN_SELECT,
                  max: TEAM_ROLE_MAX_SELECT,
                })
            : perspective === "peer"
              ? tf("teamRole.highlightHintPeer", resolvedLocale, {
                  name,
                  top: TEAM_ROLE_TOP_SELECT,
                })
              : tf("teamRole.highlightHintSelf", resolvedLocale, {
                  top: TEAM_ROLE_TOP_SELECT,
                })}
        </h3>
      </div>

      <div
        className={`inline-flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
          (phase === "select" ? selectValid : highlightValid)
            ? "bg-emerald-50 text-emerald-700"
            : "bg-cream text-ink-body"
        }`}
      >
        {phase === "select"
          ? tf("teamRole.selectedCount", resolvedLocale, {
              n: selected.size,
              max: TEAM_ROLE_MAX_SELECT,
            })
          : tf("teamRole.highlightedCount", resolvedLocale, {
              n: highlighted.size,
              top: TEAM_ROLE_TOP_SELECT,
            })}
      </div>

      {/* Item-rács */}
      <div className="flex flex-wrap gap-2">
        {visibleItems.map((item) => {
          const isSelected = selected.has(item.id);
          const isTop = highlighted.has(item.id);
          const active = phase === "select" ? isSelected : isTop;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                phase === "select" ? toggleSelect(item.id) : toggleHighlight(item.id)
              }
              aria-pressed={active}
              className={`min-h-[44px] rounded-xl border px-3.5 py-2.5 text-left text-[13px] leading-snug transition ${
                phase === "highlight" && isTop
                  ? "border-bronze bg-bronze/10 font-semibold text-ink"
                  : active
                    ? "border-sage bg-sage/10 font-medium text-ink"
                    : "border-sand bg-white text-ink-body hover:border-sage/40"
              }`}
            >
              {phase === "highlight" && (
                <span className="mr-1.5 font-mono text-[11px] text-bronze">
                  {isTop ? "★" : "☆"}
                </span>
              )}
              {getTeamRoleItemText(item, perspective, textLocale)}
            </button>
          );
        })}
      </div>

      {/* Navigáció */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {phase === "highlight" ? (
          <button
            type="button"
            onClick={() => setPhase("select")}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-sand px-4 text-sm font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze"
          >
            {t("teamRole.back", resolvedLocale)}
          </button>
        ) : (
          <span />
        )}

        {phase === "select" ? (
          <button
            type="button"
            onClick={() => setPhase("highlight")}
            disabled={!selectValid}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("teamRole.toHighlight", resolvedLocale)}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={!highlightValid || submitting}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? t("teamRole.submitting", resolvedLocale)
              : t("teamRole.finish", resolvedLocale)}
          </button>
        )}
      </div>
    </div>
  );
}
