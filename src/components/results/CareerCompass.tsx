"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import {
  INDUSTRIES,
  INDUSTRY_LEADER_CONTEXT,
  INTEREST_TAGS,
  explainRoleFit,
  rankCareerSuggestions,
  type AgeBand,
  type CareerBackground,
  type CareerStatus,
  type CareerSuggestion,
  type DimCode,
  type EduField,
  type EduLevel,
  type PrefAxis,
  type PrefValue,
  type UserPrefs,
} from "@/lib/industry-fit";
import { TRITAN_FACETS, TRITAN_ALTRUISM } from "@/lib/tritan";
import { LEADER_SUPPLEMENTS } from "@/lib/interaction-atoms";
import { DIMENSION_GROWTH_TIPS } from "@/lib/profile-content";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { RIASEC_ITEMS, scoreRiasec } from "@/lib/questions/riasec";
import { CelebrationBurst } from "@/components/ui/CelebrationBurst";

// Karrier-iránytű — rövid kérdéssor (lépés-számlálóval, auto-továbblépéssel),
// majd reveal-eredmény: hero-kártya a legerősebb iránynak, szint-címkék,
// a top-irányokhoz kötött fejlődési terv és observer-pontosítás CTA.

const DIM_LABELS: Record<DimCode, { hu: string; en: string }> = {
  INTE: { hu: "becsületesség-alázat", en: "honesty-humility" },
  RESO: { hu: "emocionalitás", en: "emotionality" },
  TEMP: { hu: "extraverzió", en: "extraversion" },
  ADAP: { hu: "barátságosság", en: "agreeableness" },
  THOR: { hu: "lelkiismeretesség", en: "conscientiousness" },
  OPEN: { hu: "nyitottság", en: "openness" },
};

/** Breakdown-komponens címkéje: facet-név, ha facet-szintű; különben dimenzió. */
function componentLabel(
  entry: { dim: DimCode; facet: string | null },
  isHu: boolean,
): string {
  if (entry.facet === "altruism") return isHu ? TRITAN_ALTRUISM.hu : TRITAN_ALTRUISM.en;
  if (entry.facet && TRITAN_FACETS[entry.facet]) {
    return isHu ? TRITAN_FACETS[entry.facet].hu : TRITAN_FACETS[entry.facet].en;
  }
  return isHu ? DIM_LABELS[entry.dim].hu : DIM_LABELS[entry.dim].en;
}

const ENV_AXES: Array<{ axis: "pace" | "structure" | "setting"; lowKey: string; highKey: string }> = [
  { axis: "pace", lowKey: "results.ccEnvPaceLow", highKey: "results.ccEnvPaceHigh" },
  { axis: "structure", lowKey: "results.ccEnvStructureLow", highKey: "results.ccEnvStructureHigh" },
  { axis: "setting", lowKey: "results.ccEnvSettingLow", highKey: "results.ccEnvSettingHigh" },
];

const PREF_AXES: Array<{ axis: PrefAxis; lowKey: string; highKey: string }> = [
  { axis: "people", lowKey: "results.industryFitPrefPeopleLow", highKey: "results.industryFitPrefPeopleHigh" },
  { axis: "variety", lowKey: "results.industryFitPrefVarietyLow", highKey: "results.industryFitPrefVarietyHigh" },
  { axis: "autonomy", lowKey: "results.industryFitPrefAutonomyLow", highKey: "results.industryFitPrefAutonomyHigh" },
  { axis: "creation", lowKey: "results.industryFitPrefCreationLow", highKey: "results.industryFitPrefCreationHigh" },
];

const EDU_LEVELS: Array<{ value: EduLevel; key: string }> = [
  { value: "primary", key: "results.ccEduPrimary" },
  { value: "secondary", key: "results.ccEduSecondary" },
  { value: "vocational", key: "results.ccEduVocational" },
  { value: "higher", key: "results.ccEduHigher" },
];

const EDU_FIELDS: Array<{ value: EduField; key: string }> = [
  { value: "tech_engineering", key: "results.ccFieldTech" },
  { value: "economics", key: "results.ccFieldEconomics" },
  { value: "health", key: "results.ccFieldHealth" },
  { value: "humanities", key: "results.ccFieldHumanities" },
  { value: "natural_science", key: "results.ccFieldScience" },
  { value: "legal", key: "results.ccFieldLegal" },
  { value: "arts", key: "results.ccFieldArts" },
  { value: "pedagogy", key: "results.ccFieldPedagogy" },
  { value: "trade", key: "results.ccFieldTrade" },
  { value: "none_other", key: "results.ccFieldNone" },
];

const AGE_BANDS: Array<{ value: AgeBand; label: string }> = [
  { value: "under20", label: "< 20" },
  { value: "20s", label: "20–29" },
  { value: "30s", label: "30–39" },
  { value: "40s", label: "40–49" },
  { value: "50plus", label: "50+" },
];

/** Fejlődési facet-kártya adata — a ProfileTabs SerializedGrowthItem-jével azonos alak. */
export interface CompassGrowthItem {
  code: string;
  label: string;
  score: number;
  dimCode: string;
  dimLabel: string;
  dimColor: string;
}

const EDU_REQ_KEYS: Record<string, string> = {
  open: "results.ccEduReqOpen",
  course: "results.ccEduReqCourse",
  vocational: "results.ccEduReqVocational",
  higher: "results.ccEduReqHigher",
  specialized: "results.ccEduReqSpecialized",
};

function fitTier(score: number): { key: string; tone: string } {
  if (score >= 70) return { key: "results.ccTierStrong", tone: "text-emerald-700" };
  if (score >= 55) return { key: "results.ccTierGood", tone: "text-ink" };
  return { key: "results.ccTierConditional", tone: "text-amber-700" };
}

function fitBarColor(score: number): string {
  if (score >= 70) return "#10B981";
  if (score >= 55) return "var(--color-sage, #3d6b5e)";
  return "#F59E0B";
}

const INDUSTRY_EMOJI: Record<string, string> = {
  tech: "💻", health: "🩺", education: "📚", finance: "📊", sales: "🤝",
  creative: "🎨", media: "📣", operations: "🏭", people: "👥", public: "⚖️",
  engineering: "🏗️", hospitality: "🍽️", science: "🔬", trades: "🔧",
  transport: "🚚", services: "✂️",
};

const FIELD_EMOJI: Record<string, string> = {
  tech_engineering: "🛠️", economics: "📈", health: "🩺", humanities: "📖",
  natural_science: "🔬", legal: "⚖️", arts: "🎨", pedagogy: "🧒",
  trade: "🔧", none_other: "✨",
};

/** Nagy, kattintható opció-kártya (egyválasztós lépésekhez) — emoji +
 *  címke + alcím, kijelöléskor pop-animáció. */
function OptionCard({
  emoji,
  label,
  sub,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  sub?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[64px] min-w-[150px] flex-1 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition sm:min-w-[170px] ${
        active
          ? "border-sage bg-sage/10 shadow-sm"
          : "border-[var(--color-border-soft)] bg-white hover:border-sage/40 hover:bg-[var(--color-surface-subtle)]"
      }`}
      style={active ? { animation: "cc-pop 0.3s ease-out" } : undefined}
    >
      <span className="text-2xl" aria-hidden>
        {emoji}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
          {label}
        </span>
        {sub && (
          <span className="block text-micro leading-snug text-[var(--color-text-muted)]">
            {sub}
          </span>
        )}
      </span>
    </button>
  );
}

/** Mért érdeklődés-kérdőív (Mini-IP mintájára) — 30 gyors item, egyenként,
 *  1-5 skálán, auto-advance-szel. A wizard vizuális nyelvét követi. */
function RiasecProfiler({
  onComplete,
  onCancel,
}: {
  onComplete: (scores: Record<string, number>) => void;
  onCancel: () => void;
}) {
  const { locale } = useLocale();
  const isHu = locale === "hu";
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const item = RIASEC_ITEMS[index];

  function answer(value: number) {
    if (advanceRef.current) return;
    setPicked(value);
    const next = { ...answers, [item.id]: value };
    setAnswers(next);
    advanceRef.current = setTimeout(() => {
      advanceRef.current = null;
      setPicked(null);
      if (index + 1 < RIASEC_ITEMS.length) {
        setIndex(index + 1);
      } else {
        const scores = scoreRiasec(next);
        if (scores) onComplete(scores);
      }
    }, 240);
  }

  const scaleLabels = [
    t("results.ccRiasecScale1", locale),
    "",
    t("results.ccRiasecScale3", locale),
    "",
    t("results.ccRiasecScale5", locale),
  ];

  return (
    <div className="rounded-[12px] border border-sage/40 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
          {tf("results.ccRiasecProgress", locale, {
            current: index + 1,
            total: RIASEC_ITEMS.length,
          })}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="text-micro font-semibold text-[var(--color-text-muted)] hover:text-ink"
        >
          {t("results.ccRiasecCancel", locale)} ✕
        </button>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-border-soft)]">
        <div
          className="h-full rounded-full bg-sage transition-all duration-300"
          style={{ width: `${Math.round(((index + 1) / RIASEC_ITEMS.length) * 100)}%` }}
        />
      </div>
      <p
        key={item.id}
        className="mt-4 min-h-[48px] text-body font-medium leading-relaxed text-[var(--color-text-primary)]"
        style={{ animation: "cc-step-in 0.25s ease-out both" }}
      >
        {isHu ? item.hu : item.en}
      </p>
      <div className="mt-3 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => answer(value)}
            aria-label={`${value}/5`}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl border-2 text-sm font-semibold transition ${
              picked === value
                ? "border-sage bg-sage text-white"
                : "border-[var(--color-border-soft)] bg-white text-[var(--color-text-secondary)] hover:border-sage/50"
            }`}
            style={picked === value ? { animation: "cc-pop 0.25s ease-out" } : undefined}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-micro text-[var(--color-text-muted)]">
        <span>{scaleLabels[0]}</span>
        <span>{scaleLabels[2]}</span>
        <span>{scaleLabels[4]}</span>
      </div>
      {index > 0 && (
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="mt-3 text-[12px] font-semibold text-[var(--color-text-muted)] hover:text-ink"
        >
          ← {t("results.ccBack", locale)}
        </button>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[36px] rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition ${
        active
          ? "border-sage bg-sage text-white"
          : "border-[var(--color-border-default)] bg-white text-[var(--color-text-secondary)] hover:border-sage/50 hover:text-[var(--color-text-primary)]"
      }`}
      style={active ? { animation: "cc-pop 0.3s ease-out" } : undefined}
    >
      {children}
    </button>
  );
}

function SuggestionCard({
  suggestion,
  scores,
  facetScores,
  leadFocus,
  hero = false,
  delayMs = 0,
  observerBacked = false,
  compareSelected = false,
  onToggleCompare,
}: {
  suggestion: CareerSuggestion;
  scores: Partial<Record<DimCode, number>>;
  facetScores?: Record<string, number>;
  leadFocus: boolean;
  hero?: boolean;
  delayMs?: number;
  observerBacked?: boolean;
  compareSelected?: boolean;
  onToggleCompare?: () => void;
}) {
  const { locale } = useLocale();
  const isHu = locale === "hu";
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<"sent" | null>(null);
  const tier = fitTier(suggestion.score);

  async function sendFeedback(verdict: "accurate" | "inaccurate") {
    setFeedback("sent");
    try {
      await fetch("/api/industry-fit/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industryKey: suggestion.industryKey,
          roleKey: suggestion.role.key,
          fitScore: suggestion.score,
          verdict,
        }),
      });
    } catch {
      /* kalibrációs jel — hiba esetén csendben elengedjük */
    }
  }

  const breakdown = open
    ? explainRoleFit(scores, suggestion.role, { leadFocus, facetScores })
    : [];

  // A hero-mondat: a két legjobban illeszkedő komponens (facet-pontos, ha van).
  const heroLine = hero
    ? (() => {
        const top2 = explainRoleFit(scores, suggestion.role, { leadFocus, facetScores })
          .slice()
          .sort((a, b) => b.alignment - a.alignment)
          .slice(0, 2);
        if (top2.length < 2) return null;
        return tf("results.ccHeroLine", locale, {
          d1: componentLabel(top2[0], isHu),
          d2: componentLabel(top2[1], isHu),
        });
      })()
    : null;

  return (
    <div
      className={
        hero
          ? "rounded-[16px] border-2 border-sage/50 bg-gradient-to-br from-sage/10 to-white p-5"
          : "rounded-[12px] border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4"
      }
      style={{ animation: "cc-step-in 0.35s ease-out both", animationDelay: `${delayMs}ms` }}
    >
      {hero && (
        <p className="mb-1.5 font-mono text-micro uppercase tracking-widest text-sage-dark">
          {t("results.ccTopMatch", locale)}
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`font-semibold text-[var(--color-text-primary)] ${hero ? "font-fraunces text-xl" : "text-sm"}`}>
            {isHu ? suggestion.role.hu : suggestion.role.en}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {isHu ? suggestion.industryHu : suggestion.industryEn}
            {suggestion.eduBoosted && (
              <span className="ml-1.5 rounded-full bg-sage/10 px-1.5 py-0.5 text-micro font-semibold text-sage-dark">
                {t("results.ccEduBoostBadge", locale)}
              </span>
            )}
            {suggestion.riasec && (
              <Link
                href="/holland-kod"
                target="_blank"
                className="ml-1.5 rounded-full bg-[var(--color-surface-subtle)] px-1.5 py-0.5 font-mono text-micro font-semibold text-[var(--color-text-muted)] transition hover:bg-sage/15 hover:text-sage-dark"
                title={t("results.ccRiasecRoleHint", locale)}
              >
                {suggestion.riasec}
              </Link>
            )}
          </p>
        </div>
        {/* Hero: gyűrű a sáv közepével; egyébként szöveges sáv-tartomány. */}
        {hero ? (
          <div className="flex items-center gap-3">
            <div className="text-left sm:text-right">
              <p className={`text-[12px] font-semibold ${tier.tone}`}>{t(tier.key, locale)}</p>
              <p
                className="font-mono text-micro text-[var(--color-text-muted)]"
                title={t("results.ccBandHint", locale)}
              >
                {suggestion.band.low}–{suggestion.band.high}%
                {suggestion.prefMatch !== null && (
                  <> · {suggestion.prefMatch}% {t("results.industryFitPrefMatchLabel", locale)}</>
                )}
              </p>
            </div>
            <ProgressRing
              percent={suggestion.score}
              size={64}
              strokeWidth={6}
              trackColor="var(--color-border-soft)"
              color={fitBarColor(suggestion.score)}
              label={`${suggestion.score}%`}
              labelClassName="fill-[var(--color-text-primary)]"
            />
          </div>
        ) : (
          <div className="text-left sm:text-right">
            <p className={`text-[12px] font-semibold ${tier.tone}`}>{t(tier.key, locale)}</p>
            <p
              className="font-mono text-micro text-[var(--color-text-muted)]"
              title={t("results.ccBandHint", locale)}
            >
              {suggestion.band.low}–{suggestion.band.high}%
              {suggestion.prefMatch !== null && (
                <> · {suggestion.prefMatch}% {t("results.industryFitPrefMatchLabel", locale)}</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Belépési végzettség-igény — megjegyzés a szerep alatt */}
      <p className="mt-1 text-micro text-[var(--color-text-muted)]">
        🎓 {t("results.ccEduReqLabel", locale)}:{" "}
        {t(EDU_REQ_KEYS[suggestion.role.edu] ?? "results.ccEduReqOpen", locale)}
      </p>

      {(suggestion.facetPrecision || observerBacked) && (
        <p className="mt-1.5 flex flex-wrap gap-1.5">
          {suggestion.facetPrecision && (
            <span
              className="rounded-full bg-sage/10 px-2 py-0.5 text-micro font-semibold text-sage-dark"
              title={t("results.ccFacetBadgeHint", locale)}
            >
              {t("results.ccFacetBadge", locale)}
            </span>
          )}
          {observerBacked && (
            <span
              className="rounded-full bg-[var(--color-surface-highlight-warm)] px-2 py-0.5 text-micro font-semibold text-[var(--color-accent-primary-strong)]"
              title={t("results.ccObserverBadgeHint", locale)}
            >
              {t("results.ccObserverBadge", locale)}
            </span>
          )}
        </p>
      )}

      {heroLine && (
        <p className="mt-2 text-caption leading-relaxed text-[var(--color-text-secondary)]">
          {heroLine}
        </p>
      )}

      {/* Sáv-vizualizáció: a kitöltés a pontszámig, halvány zóna a sáv széléig */}
      <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border-soft)]">
        <div
          className="absolute inset-y-0 rounded-full opacity-30"
          style={{
            left: `${suggestion.band.low}%`,
            width: `${suggestion.band.high - suggestion.band.low}%`,
            backgroundColor: fitBarColor(suggestion.score),
          }}
        />
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${suggestion.score}%`, backgroundColor: fitBarColor(suggestion.score) }}
        />
      </div>

      {!hero && (
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
          {t("results.industryFitDriver", locale)}{" "}
          <span className="font-semibold text-[var(--color-text-primary)]">
            {isHu ? DIM_LABELS[suggestion.topDriver].hu : DIM_LABELS[suggestion.topDriver].en}
          </span>
          {suggestion.watchDim && (
            <>
              {" · "}
              {t("results.industryFitWatch", locale)}{" "}
              <span className="font-semibold text-amber-700">
                {isHu ? DIM_LABELS[suggestion.watchDim].hu : DIM_LABELS[suggestion.watchDim].en}
              </span>
            </>
          )}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 text-[12px] font-semibold text-bronze transition-colors hover:text-ink"
      >
        {t("results.industryFitWhy", locale)} {open ? "▴" : "▾"}
      </button>
      {onToggleCompare && (
        <button
          type="button"
          onClick={onToggleCompare}
          className={`ml-3 mt-2 rounded-full border px-2.5 py-0.5 text-micro font-semibold transition ${
            compareSelected
              ? "border-sage bg-sage text-white"
              : "border-[var(--color-border-default)] bg-white text-[var(--color-text-muted)] hover:border-sage/50 hover:text-[var(--color-text-primary)]"
          }`}
        >
          {compareSelected
            ? t("results.ccCompareSelected", locale)
            : t("results.ccCompareCta", locale)}
        </button>
      )}

      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t border-[var(--color-border-soft)] pt-3">
          {breakdown.map((entry) => (
            <div key={`${entry.dim}-${entry.facet ?? "dim"}-${entry.direction}`} className="flex items-center gap-2 sm:gap-3">
              <span className="w-24 shrink-0 text-micro leading-tight text-[var(--color-text-secondary)] sm:w-40 sm:text-[11px]">
                {componentLabel(entry, isHu)}
                <span className="block text-micro text-[var(--color-text-muted)]">
                  {t(
                    entry.direction === "high"
                      ? "results.industryFitExpectedHigh"
                      : "results.industryFitExpectedLow",
                    locale,
                  )}{" "}
                  · {Math.round(entry.weight * 100)}%
                </span>
              </span>
              <div className="h-2 min-w-[60px] flex-1 overflow-hidden rounded-full bg-[var(--color-border-soft)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${entry.alignment}%`, backgroundColor: fitBarColor(entry.alignment) }}
                />
              </div>
              <span className="w-12 shrink-0 text-right font-mono text-micro text-[var(--color-text-muted)] sm:w-16">
                {entry.userValue}→{entry.alignment}
              </span>
            </div>
          ))}
          <p className="text-micro text-[var(--color-text-muted)]">
            {t("results.industryFitBreakdownNote", locale)}
          </p>

          <div className="mt-1 border-t border-[var(--color-border-soft)] pt-2.5">
            {feedback === "sent" ? (
              <p className="text-[11px] text-emerald-700">
                {t("results.industryFitFeedbackThanks", locale)}
              </p>
            ) : (
              // A kérdés külön sor, a két chip mindig együtt, egy sorban.
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-[11px] text-[var(--color-text-secondary)]">
                  {t("results.industryFitFeedbackQ", locale)}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sendFeedback("accurate")}
                    className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-50"
                  >
                    👍 {t("results.industryFitFeedbackYes", locale)}
                  </button>
                  <button
                    type="button"
                    onClick={() => sendFeedback("inaccurate")}
                    className="rounded-full border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    👎 {t("results.industryFitFeedbackNo", locale)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type Step = "intro" | "status" | "edu" | "tags" | "age" | "current" | "interests" | "prefs" | "env" | "lead" | "result";

const EMPTY_BACKGROUND: CareerBackground = {
  status: "working",
  eduLevel: null,
  eduField: null,
  ageBand: null,
  currentIndustry: null,
  interests: [],
};

export function CareerCompass({
  scores,
  observerScores = null,
  facetScores,
  assessmentForm = "short",
  initialBackground = null,
  growthFocusItems = [],
  onRequestObserver,
}: {
  scores: Partial<Record<DimCode, number>>;
  /** Observer-átlagok dimenziónként, ha van külső visszajelzés */
  observerScores?: Partial<Record<DimCode, number>> | null;
  /** Facet-pontszámok (facet-kód → 0-100) — facet-finomított illeszkedéshez */
  facetScores?: Record<string, number>;
  /** Kérdőív-forma a konfidencia-sávhoz */
  assessmentForm?: "short" | "full";
  initialBackground?: CareerBackground | null;
  /** Facet-szintű fejlődési elemek — a fejlődési terv blokk alapja */
  growthFocusItems?: CompassGrowthItem[];
  /** Observer-pontosítás CTA — átvált a meghívások tabra */
  onRequestObserver?: () => void;
}) {
  const { locale } = useLocale();
  const isHu = locale === "hu";
  // Teljes mentett háttérnél (van status — a wizardot már végigvitte) egyből
  // az eredmény jön; az onboardingból származó RÉSZLEGES háttér (edu/iparág,
  // status nélkül) a wizardot előtöltve indítja.
  const hasCompleteBackground = Boolean(
    initialBackground && (initialBackground as { status?: string }).status,
  );
  const [step, setStep] = useState<Step>(hasCompleteBackground ? "result" : "intro");
  const [background, setBackground] = useState<CareerBackground>(
    initialBackground ? { ...EMPTY_BACKGROUND, ...initialBackground } : EMPTY_BACKGROUND,
  );
  const [prefs, setPrefs] = useState<UserPrefs>({});
  const [leadFocus, setLeadFocus] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [missingText, setMissingText] = useState("");
  const [missingState, setMissingState] = useState<"idle" | "busy" | "sent">("idle");
  // Összevetés: max 2 kiválasztott javaslat kulcsa (industry:role)
  const [compareKeys, setCompareKeys] = useState<string[]>([]);
  const [methodOpen, setMethodOpen] = useState(false);
  // Vezetői kérdés látható kijelöléshez (a leadFocus boolean ebből származik)
  const [leadChoice, setLeadChoice] = useState<"yes" | "expert" | "unsure" | null>(null);
  // Wizard-zárás ünneplés — csak tényleges kitöltés után, betöltéskor nem
  const [celebrate, setCelebrate] = useState(false);
  // Mért érdeklődés-kérdőív (Mini-IP) nyitva-e az eredmény-nézetben
  const [profilerOpen, setProfilerOpen] = useState(false);
  // Kijelölés-visszajelzés: a lépésváltás rövid késleltetéssel jön, hogy a
  // pop-animáció látsszon; a timer guard a dupla-kattintás ellen véd.
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function selectAndAdvance(from: Step, apply: () => void) {
    apply();
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      goNext(from);
    }, 320);
  }

  // A wizard lépéssorrendje — tanulóknál a „jelenlegi terület" kimarad.
  const flow: Step[] = [
    "status",
    "edu",
    "tags",
    "age",
    ...(background.status === "studying" ? [] : (["current"] as Step[])),
    "interests",
    "prefs",
    "env",
    "lead",
  ];
  const stepIndex = flow.indexOf(step);

  function patch(next: Partial<CareerBackground>) {
    setBackground((prev) => ({ ...prev, ...next }));
  }

  function goNext(from: Step) {
    const idx = flow.indexOf(from);
    const next = flow[idx + 1];
    if (next) setStep(next);
    else finish();
  }

  function goBack(from: Step) {
    const idx = flow.indexOf(from);
    setStep(idx <= 0 ? "intro" : flow[idx - 1]);
  }

  function finish() {
    setStep("result");
    setShowMore(false);
    setCelebrate(true);
    // Fire-and-forget mentés — visszatéréskor innen folytatja.
    fetch("/api/profile/career-background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(background),
    }).catch(() => {
      /* a wizard eredménye kliens-oldalon így is él */
    });
  }

  async function sendMissing() {
    if (!missingText.trim()) return;
    setMissingState("busy");
    try {
      const res = await fetch("/api/features/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "lead", featureKey: "industry_role", message: missingText.trim() }),
      });
      if (!res.ok) throw new Error("SEND_FAILED");
      setMissingState("sent");
    } catch {
      setMissingState("idle");
    }
  }

  const hasMeasured = observerScores !== null && Object.keys(observerScores ?? {}).length > 0;
  const effectiveScores: Partial<Record<DimCode, number>> = hasMeasured
    ? Object.fromEntries(
        (Object.keys(scores) as DimCode[]).map((dim) => {
          const self = scores[dim];
          const obs = observerScores?.[dim];
          return [
            dim,
            typeof self === "number" && typeof obs === "number"
              ? Math.round((self + obs) / 2)
              : self,
          ];
        }),
      )
    : scores;

  const result =
    step === "result"
      ? rankCareerSuggestions(effectiveScores, background, {
          prefs,
          leadFocus,
          facetScores,
          form: assessmentForm,
          observerBacked: hasMeasured,
        })
      : null;

  const suggestionKey = (s: CareerSuggestion) => `${s.industryKey}:${s.role.key}`;
  const allSuggestions = [
    ...(result?.suggestions ?? []),
    ...(result?.currentIndustryTop ?? []),
  ];
  const compareItems = compareKeys
    .map((key) => allSuggestions.find((s) => suggestionKey(s) === key))
    .filter((s): s is CareerSuggestion => Boolean(s));

  function toggleCompare(s: CareerSuggestion) {
    const key = suggestionKey(s);
    setCompareKeys((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev.slice(-1), key],
    );
  }

  // „A mostani területeden" blokk deduplikálva: csak azok a szerepek,
  // amik a fő javaslat-listában nem szerepelnek — ha mind átfed (pl. az
  // érdeklődés = a jelenlegi iparág), a blokk el sem jelenik.
  const suggestionKeys = new Set(
    (result?.suggestions ?? []).map((s) => `${s.industryKey}:${s.role.key}`),
  );
  const currentIndustryExtra = (result?.currentIndustryTop ?? []).filter(
    (s) => !suggestionKeys.has(`${s.industryKey}:${s.role.key}`),
  );

  // Fejlődési terv: a top-irányok watch-dimenzióihoz illő facet-kártyák.
  const devPlanItems = result
    ? growthFocusItems.filter((item) =>
        result.developDims.includes(item.dimCode as DimCode),
      ).slice(0, 3)
    : [];

  // Wizard-fejléc: lépésszám + progress-pöttyök + „miért kérdezzük".
  const stepHeader = (titleKey: string, whyKey: string) => (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
          {tf("results.ccStepOf", locale, { current: stepIndex + 1, total: flow.length })}
        </p>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-border-soft)] sm:w-36">
          <div
            className="h-full rounded-full bg-sage transition-all duration-500"
            style={{ width: `${Math.round(((stepIndex + 1) / flow.length) * 100)}%` }}
          />
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
        {t(titleKey, locale)}
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
        {t(whyKey, locale)}
      </p>
    </div>
  );

  const stepNav = (from: Step, nextDisabled = false, showNext = true) => (
    <div className="mt-5 flex items-center justify-between">
      <button
        type="button"
        onClick={() => goBack(from)}
        className="text-[12px] font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
      >
        {t("results.ccBack", locale)}
      </button>
      {showNext && (
        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => goNext(from)}
          className="inline-flex min-h-[40px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:opacity-40"
        >
          {flow.indexOf(from) === flow.length - 1
            ? t("results.ccFinish", locale)
            : t("results.ccNext", locale)}
        </button>
      )}
    </div>
  );

  return (
    <div className="rounded-[14px] border border-[var(--color-border-soft)] bg-white p-5">
      {/* Forrás-badge */}
      <div className="mb-3 flex justify-end">
        <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-micro text-[var(--color-text-muted)]">
          {t(
            hasMeasured ? "results.industryFitSourceMeasured" : "results.industryFitSourceSelf",
            locale,
          )}
        </span>
      </div>

      {step === "intro" && (
        <div>
          <p className="max-w-2xl text-caption leading-relaxed text-[var(--color-text-secondary)]">
            {t("results.ccIntro", locale)}
          </p>
          <button
            type="button"
            onClick={() => setStep("status")}
            className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark"
          >
            {t("results.ccStart", locale)}
          </button>
        </div>
      )}

      {step === "status" && (
        <div key="status" style={{ animation: "cc-step-in 0.3s ease-out both" }}>
          {stepHeader("results.ccStepStatus", "results.ccWhyStatus")}
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["studying", "🎓", "results.ccStatusStudying", "results.ccStatusStudyingSub"],
                ["working", "💼", "results.ccStatusWorking", "results.ccStatusWorkingSub"],
                ["switching", "🔄", "results.ccStatusSwitching", "results.ccStatusSwitchingSub"],
              ] as Array<[CareerStatus, string, string, string]>
            ).map(([value, emoji, key, subKey]) => (
              <OptionCard
                key={value}
                emoji={emoji}
                label={t(key, locale)}
                sub={t(subKey, locale)}
                active={background.status === value}
                onClick={() =>
                  selectAndAdvance("status", () =>
                    patch({
                      status: value,
                      ...(value === "studying" ? { currentIndustry: null } : {}),
                    }),
                  )
                }
              />
            ))}
          </div>
          {stepNav("status", false, false)}
        </div>
      )}

      {step === "edu" && (
        <div key="edu" style={{ animation: "cc-step-in 0.3s ease-out both" }}>
          {stepHeader("results.ccStepEdu", "results.ccWhyEdu")}
          <div className="flex flex-wrap gap-1.5">
            {EDU_LEVELS.map(({ value, key }) => (
              <Chip
                key={value}
                active={background.eduLevel === value}
                onClick={() =>
                  patch({
                    eduLevel: value,
                    // Alap/érettségi szintnél nincs terület-kérdés
                    ...(value === "primary" || value === "secondary"
                      ? { eduField: null, eduFields: [] }
                      : {}),
                  })
                }
              >
                {t(key, locale)}
              </Chip>
            ))}
          </div>
          {(background.eduLevel === "vocational" || background.eduLevel === "higher") && (
            <div style={{ animation: "cc-step-in 0.3s ease-out both" }}>
              <p className="mt-4 text-[11px] font-medium text-[var(--color-text-muted)]">
                {t("results.ccFieldLabelMulti", locale)}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {EDU_FIELDS.map(({ value, key }) => {
                  const selected = (background.eduFields ?? []).includes(value);
                  return (
                    <Chip
                      key={value}
                      active={selected}
                      onClick={() => {
                        const current = background.eduFields ?? [];
                        const next = selected
                          ? current.filter((f) => f !== value)
                          : current.length >= 3
                            ? current
                            : [...current, value];
                        patch({ eduFields: next, eduField: next[0] ?? null });
                      }}
                    >
                      {FIELD_EMOJI[value] ? `${FIELD_EMOJI[value]} ` : ""}{t(key, locale)}
                    </Chip>
                  );
                })}
              </div>
            </div>
          )}
          {stepNav("edu")}
        </div>
      )}

      {step === "tags" && (
        <div key="tags" style={{ animation: "cc-step-in 0.3s ease-out both" }}>
          {stepHeader("results.ccStepTags", "results.ccWhyTags")}
          <div className="flex flex-wrap gap-2">
            {INTEREST_TAGS.map((tag) => {
              const selected = (background.interestTags ?? []).includes(tag.key);
              return (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() => {
                    const current = background.interestTags ?? [];
                    const next = selected
                      ? current.filter((k) => k !== tag.key)
                      : current.length >= 4
                        ? current
                        : [...current, tag.key];
                    patch({ interestTags: next });
                  }}
                  className={`flex min-h-[52px] items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-left transition ${
                    selected
                      ? "border-sage bg-sage/10 shadow-sm"
                      : "border-[var(--color-border-soft)] bg-white hover:border-sage/40 hover:bg-[var(--color-surface-subtle)]"
                  }`}
                  style={selected ? { animation: "cc-pop 0.3s ease-out" } : undefined}
                >
                  <span className="text-xl" aria-hidden>
                    {tag.emoji}
                  </span>
                  <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                    {isHu ? tag.hu : tag.en}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-micro text-[var(--color-text-muted)]">
            {tf("results.ccTagsCount", locale, {
              count: (background.interestTags ?? []).length,
            })}
          </p>
          {stepNav("tags")}
        </div>
      )}

      {step === "age" && (
        <div key="age" style={{ animation: "cc-step-in 0.3s ease-out both" }}>
          {stepHeader("results.ccStepAge", "results.ccWhyAge")}
          <div className="flex flex-wrap gap-1.5">
            {AGE_BANDS.map(({ value, label }) => (
              <Chip
                key={value}
                active={background.ageBand === value}
                onClick={() =>
                  selectAndAdvance("age", () => patch({ ageBand: value }))
                }
              >
                {label}
              </Chip>
            ))}
            <Chip
              active={false}
              onClick={() =>
                selectAndAdvance("age", () => patch({ ageBand: null }))
              }
            >
              {t("results.ccAgeSkip", locale)}
            </Chip>
          </div>
          {stepNav("age", false, false)}
        </div>
      )}

      {step === "current" && (
        <div key="current" style={{ animation: "cc-step-in 0.3s ease-out both" }}>
          {stepHeader("results.ccStepCurrent", "results.ccWhyCurrent")}
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map((industry) => (
              <Chip
                key={industry.key}
                active={background.currentIndustry === industry.key}
                onClick={() =>
                  selectAndAdvance("current", () =>
                    patch({ currentIndustry: industry.key }),
                  )
                }
              >
                {INDUSTRY_EMOJI[industry.key] ? `${INDUSTRY_EMOJI[industry.key]} ` : ""}{isHu ? industry.hu : industry.en}
              </Chip>
            ))}
            <Chip
              active={false}
              onClick={() =>
                selectAndAdvance("current", () => patch({ currentIndustry: null }))
              }
            >
              {t("results.ccCurrentNone", locale)}
            </Chip>
          </div>
          {stepNav("current", false, false)}
        </div>
      )}

      {step === "interests" && (
        <div key="interests" style={{ animation: "cc-step-in 0.3s ease-out both" }}>
          {stepHeader("results.ccStepInterests", "results.ccWhyInterests")}
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map((industry) => {
              const active = background.interests.includes(industry.key);
              return (
                <Chip
                  key={industry.key}
                  active={active}
                  onClick={() =>
                    patch({
                      interests: active
                        ? background.interests.filter((k) => k !== industry.key)
                        : background.interests.length < 3
                          ? [...background.interests, industry.key]
                          : background.interests,
                    })
                  }
                >
                  {INDUSTRY_EMOJI[industry.key] ? `${INDUSTRY_EMOJI[industry.key]} ` : ""}{isHu ? industry.hu : industry.en}
                </Chip>
              );
            })}
            <Chip active={background.interests.length === 0} onClick={() => patch({ interests: [] })}>
              {t("results.ccInterestsOpen", locale)}
            </Chip>
          </div>
          {stepNav("interests")}
        </div>
      )}

      {step === "prefs" && (
        <div key="prefs" style={{ animation: "cc-step-in 0.3s ease-out both" }}>
          {stepHeader("results.ccStepPrefs", "results.ccWhyPrefs")}
          <div className="flex flex-col gap-2">
            {PREF_AXES.map(({ axis, lowKey, highKey }) => {
              const value = prefs[axis] ?? 0;
              const seg = (v: PrefValue, label: string) => (
                <button
                  key={`${axis}-${v}`}
                  type="button"
                  onClick={() => setPrefs((prev) => ({ ...prev, [axis]: v }))}
                  className={`min-h-[36px] flex-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
                    value === v
                      ? "bg-sage text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:bg-white hover:text-[var(--color-text-primary)]"
                  }`}
                  style={value === v ? { animation: "cc-pop 0.3s ease-out" } : undefined}
                >
                  {label}
                </button>
              );
              return (
                <div
                  key={axis}
                  className="flex items-center gap-1 rounded-xl bg-[var(--color-surface-subtle)] p-1"
                >
                  {seg(-1, t(lowKey, locale))}
                  {seg(0, t("results.industryFitPrefNeutral", locale))}
                  {seg(1, t(highKey, locale))}
                </div>
              );
            })}
          </div>
          {stepNav("prefs")}
        </div>
      )}

      {step === "env" && (
        <div key="env" style={{ animation: "cc-step-in 0.3s ease-out both" }}>
          {stepHeader("results.ccStepEnv", "results.ccWhyEnv")}
          <div className="flex flex-col gap-2">
            {ENV_AXES.map(({ axis, lowKey, highKey }) => {
              const value = prefs[axis] ?? 0;
              const seg = (v: PrefValue, label: string) => (
                <button
                  key={`${axis}-${v}`}
                  type="button"
                  onClick={() => setPrefs((prev) => ({ ...prev, [axis]: v }))}
                  className={`min-h-[36px] flex-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
                    value === v
                      ? "bg-sage text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:bg-white hover:text-[var(--color-text-primary)]"
                  }`}
                  style={value === v ? { animation: "cc-pop 0.3s ease-out" } : undefined}
                >
                  {label}
                </button>
              );
              return (
                <div
                  key={axis}
                  className="flex items-center gap-1 rounded-xl bg-[var(--color-surface-subtle)] p-1"
                >
                  {seg(-1, t(lowKey, locale))}
                  {seg(0, t("results.industryFitPrefNeutral", locale))}
                  {seg(1, t(highKey, locale))}
                </div>
              );
            })}
          </div>
          {stepNav("env")}
        </div>
      )}

      {step === "lead" && (
        <div key="lead" style={{ animation: "cc-step-in 0.3s ease-out both" }}>
          {stepHeader("results.ccStepLead", "results.ccWhyLead")}
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["yes", true, "🙋", "results.ccLeadYes", "results.ccLeadYesSub"],
                ["expert", false, "🔬", "results.ccLeadExpert", "results.ccLeadExpertSub"],
                ["unsure", false, "🤷", "results.ccLeadUnsure", "results.ccLeadUnsureSub"],
              ] as Array<["yes" | "expert" | "unsure", boolean, string, string, string]>
            ).map(([choice, value, emoji, key, subKey]) => (
              <OptionCard
                key={choice}
                emoji={emoji}
                label={t(key, locale)}
                sub={t(subKey, locale)}
                active={leadChoice === choice}
                onClick={() =>
                  selectAndAdvance("lead", () => {
                    setLeadChoice(choice);
                    setLeadFocus(value);
                  })
                }
              />
            ))}
          </div>
          {stepNav("lead", false, false)}
        </div>
      )}

      {step === "result" && result && (
        <div>
          {celebrate && <CelebrationBurst onDone={() => setCelebrate(false)} />}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {t("results.ccResultTitle", locale)}
            </p>
            <button
              type="button"
              onClick={() => setStep("status")}
              className="text-[12px] font-semibold text-bronze transition hover:text-ink"
            >
              {t("results.ccEditAnswers", locale)}
            </button>
          </div>

          {/* Érdeklődés-kód (Holland/RIASEC) — forrás szerint címkézve */}
          {result.userRiasec.length > 0 && (
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-micro text-[var(--color-text-muted)]">
              {t(
                result.riasecSource === "measured"
                  ? "results.ccRiasecUserLabelMeasured"
                  : result.riasecSource === "tags"
                    ? "results.ccRiasecUserLabelTags"
                    : "results.ccRiasecUserLabel",
                locale,
              )}
              <span
                className={`rounded-full px-2 py-0.5 font-mono font-semibold ${
                  result.riasecSource === "measured"
                    ? "bg-sage/15 text-sage-dark"
                    : "bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]"
                }`}
              >
                {result.userRiasec.join("")}
              </span>
              <span>
                {t(
                  result.riasecSource === "measured"
                    ? "results.ccRiasecMeasuredNote"
                    : result.riasecSource === "tags"
                      ? "results.ccRiasecTagsNote"
                      : "results.ccRiasecEstimateNote",
                  locale,
                )}
              </span>
              <Link
                href="/holland-kod"
                target="_blank"
                className="font-semibold text-bronze underline-offset-2 hover:underline"
              >
                {t("results.ccRiasecWhatIs", locale)}
              </Link>
            </p>
          )}

          {/* Mért érdeklődés-kérdőív: CTA vagy futó kitöltés */}
          {profilerOpen ? (
            <div className="mt-3">
              <RiasecProfiler
                onCancel={() => setProfilerOpen(false)}
                onComplete={(scores) => {
                  setProfilerOpen(false);
                  setCelebrate(true);
                  const nextBackground = {
                    ...background,
                    riasecScores: scores as CareerBackground["riasecScores"],
                  };
                  setBackground(nextBackground);
                  fetch("/api/profile/career-background", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(nextBackground),
                  }).catch(() => {});
                }}
              />
            </div>
          ) : (
            result.riasecSource !== "measured" && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-dashed border-sage/50 bg-sage/5 px-4 py-3">
                <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                  🎯 {t("results.ccRiasecCta", locale)}
                </p>
                <button
                  type="button"
                  onClick={() => setProfilerOpen(true)}
                  className="inline-flex min-h-[36px] items-center rounded-lg bg-sage px-4 text-[12px] font-semibold text-white transition hover:bg-sage-dark"
                >
                  {t("results.ccRiasecCtaBtn", locale)}
                </button>
              </div>
            )
          )}

          {/* Reveal: hero + 2 normál + a többi összecsukva */}
          <div className="mt-3 flex flex-col gap-3">
            {result.suggestions.slice(0, 1).map((suggestion) => (
              <SuggestionCard
                key={`${suggestion.industryKey}-${suggestion.role.key}-${leadFocus}`}
                suggestion={suggestion}
                scores={effectiveScores}
                facetScores={facetScores}
                leadFocus={leadFocus}
                observerBacked={hasMeasured}
                compareSelected={compareKeys.includes(suggestionKey(suggestion))}
                onToggleCompare={() => toggleCompare(suggestion)}
                hero
              />
            ))}
            {result.suggestions.slice(1, 3).map((suggestion, i) => (
              <SuggestionCard
                key={`${suggestion.industryKey}-${suggestion.role.key}-${leadFocus}`}
                suggestion={suggestion}
                scores={effectiveScores}
                facetScores={facetScores}
                leadFocus={leadFocus}
                observerBacked={hasMeasured}
                compareSelected={compareKeys.includes(suggestionKey(suggestion))}
                onToggleCompare={() => toggleCompare(suggestion)}
                delayMs={120 + i * 80}
              />
            ))}
            {result.suggestions.length > 3 && (
              <>
                {showMore &&
                  result.suggestions.slice(3).map((suggestion, i) => (
                    <SuggestionCard
                      key={`${suggestion.industryKey}-${suggestion.role.key}-${leadFocus}`}
                      suggestion={suggestion}
                      scores={effectiveScores}
                      facetScores={facetScores}
                      leadFocus={leadFocus}
                      observerBacked={hasMeasured}
                      compareSelected={compareKeys.includes(suggestionKey(suggestion))}
                      onToggleCompare={() => toggleCompare(suggestion)}
                      delayMs={i * 80}
                    />
                  ))}
                <button
                  type="button"
                  onClick={() => setShowMore((v) => !v)}
                  className="self-start text-[12px] font-semibold text-bronze transition hover:text-ink"
                >
                  {showMore
                    ? `${t("results.ccLessOptions", locale)} ▴`
                    : `${t("results.ccMoreOptions", locale)} (${result.suggestions.length - 3}) ▾`}
                </button>
              </>
            )}
          </div>

          {/* Összevetés — két kiválasztott irány komponensenként egymás mellett */}
          {compareItems.length === 2 && (
            <div className="mt-4 rounded-[12px] border border-sage/40 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-caption font-semibold text-[var(--color-text-primary)]">
                  {t("results.ccCompareTitle", locale)}
                </p>
                <button
                  type="button"
                  onClick={() => setCompareKeys([])}
                  className="text-micro font-semibold text-[var(--color-text-muted)] hover:text-ink"
                >
                  {t("results.ccCompareClear", locale)} ✕
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                {compareItems.map((s) => {
                  const breakdown = explainRoleFit(effectiveScores, s.role, {
                    leadFocus,
                    facetScores,
                  });
                  return (
                    <div key={suggestionKey(s)} className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                        {isHu ? s.role.hu : s.role.en}
                      </p>
                      <p className="font-mono text-micro text-[var(--color-text-muted)]">
                        {s.band.low}–{s.band.high}%
                      </p>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {breakdown.map((entry) => (
                          <div key={`${entry.dim}-${entry.facet ?? "dim"}`} className="flex items-center gap-2">
                            <span className="w-24 shrink-0 truncate text-micro text-[var(--color-text-secondary)]">
                              {componentLabel(entry, isHu)}
                            </span>
                            <div className="h-1.5 min-w-[30px] flex-1 overflow-hidden rounded-full bg-[var(--color-border-soft)]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${entry.alignment}%`,
                                  backgroundColor: fitBarColor(entry.alignment),
                                }}
                              />
                            </div>
                            <span className="w-7 shrink-0 text-right font-mono text-micro text-[var(--color-text-muted)]">
                              {entry.alignment}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-micro text-[var(--color-text-muted)]">
                {t("results.ccCompareNote", locale)}
              </p>
            </div>
          )}
          {compareItems.length === 1 && (
            <p className="mt-3 text-micro text-[var(--color-text-muted)]">
              {t("results.ccCompareHint", locale)}
            </p>
          )}

          {currentIndustryExtra.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 font-mono text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
                {t("results.ccResultCurrent", locale)}
              </p>
              <div className="flex flex-col gap-3">
                {currentIndustryExtra.map((suggestion, i) => (
                  <SuggestionCard
                    key={`current-${suggestion.role.key}-${leadFocus}`}
                    suggestion={suggestion}
                    scores={effectiveScores}
                    facetScores={facetScores}
                    leadFocus={leadFocus}
                    observerBacked={hasMeasured}
                    compareSelected={compareKeys.includes(suggestionKey(suggestion))}
                    onToggleCompare={() => toggleCompare(suggestion)}
                    delayMs={i * 80}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fejlődési terv — a top-irányok watch-dimenzióihoz kötve */}
          {(result.developDims.length > 0 || devPlanItems.length > 0) && (
            <div className="mt-5 rounded-[12px] border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-caption font-semibold text-amber-900">
                {t("results.ccDevPlanTitle", locale)}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-amber-900/80">
                {t("results.ccDevPlanIntro", locale)}
                {result.developDims.length > 0 && (
                  <>
                    {" "}
                    <span className="font-semibold">
                      {result.developDims
                        .map((dim) => (isHu ? DIM_LABELS[dim].hu : DIM_LABELS[dim].en))
                        .join(", ")}
                    </span>
                  </>
                )}
              </p>
              {devPlanItems.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {devPlanItems.map((item) => (
                    <div key={item.code} className="rounded-[12px] border border-amber-200/70 bg-white p-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-micro font-semibold"
                        style={{ backgroundColor: `${item.dimColor}1a`, color: item.dimColor }}
                      >
                        {item.dimLabel}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        {item.label}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.score}%`, backgroundColor: item.dimColor }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 30 napos mini-terv — a fő fejlesztendő dimenzióhoz */}
          {result.developDims.length > 0 &&
            (() => {
              const dim = result.developDims[0];
              const plan = DIMENSION_GROWTH_TIPS[dim]?.[isHu ? "hu" : "en"];
              if (!plan) return null;
              return (
                <div className="mt-4 rounded-[12px] border border-[var(--color-border-soft)] bg-white p-4">
                  <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
                    {t("results.ccPlan30Eyebrow", locale)}
                  </p>
                  <p className="mt-1 text-caption font-semibold text-[var(--color-text-primary)]">
                    {tf("results.ccPlan30Title", locale, {
                      dim: isHu ? DIM_LABELS[dim].hu : DIM_LABELS[dim].en,
                    })}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {(
                      [
                        ["results.ccPlan30Behavior", plan.behavior],
                        ["results.ccPlan30Reflection", plan.reflection],
                        ["results.ccPlan30Challenge", plan.challenge],
                      ] as const
                    ).map(([labelKey, text]) => (
                      <div
                        key={labelKey}
                        className="rounded-[10px] bg-[var(--color-surface-subtle)] p-3"
                      >
                        <p className="text-micro font-semibold uppercase tracking-wide text-sage-dark">
                          {t(labelKey, locale)}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                          {text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          {/* Tipikus vezetési közeg — a top irány iparágához kötve */}
          {result.suggestions.length > 0 &&
            (() => {
              const top = result.suggestions[0];
              const ctx = INDUSTRY_LEADER_CONTEXT[top.industryKey];
              if (!ctx) return null;
              const text = LEADER_SUPPLEMENTS[ctx.dim][ctx.pole];
              return (
                <div className="mt-4 rounded-[12px] border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4">
                  <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
                    {t("results.ccLeaderEyebrow", locale)}
                  </p>
                  <p className="mt-1 text-caption font-semibold text-[var(--color-text-primary)]">
                    {tf("results.ccLeaderTitle", locale, {
                      industry: isHu ? top.industryHu : top.industryEn,
                    })}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                    {isHu ? text.hu : text.en}
                  </p>
                  <p className="mt-1.5 text-micro text-[var(--color-text-muted)]">
                    {t("results.ccLeaderNote", locale)}
                  </p>
                </div>
              );
            })()}

          {/* Observer-pontosítás — ha még csak önértékelésen áll a kép */}
          {!hasMeasured && onRequestObserver && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4">
              <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                {t("results.ccObserverRefine", locale)}
              </p>
              <button
                type="button"
                onClick={onRequestObserver}
                className="inline-flex min-h-[40px] items-center rounded-lg border border-sage/50 bg-white px-4 text-[12px] font-semibold text-sage-dark transition hover:bg-sage/10"
              >
                {t("results.ccObserverRefineCta", locale)}
              </button>
            </div>
          )}

          {/* Hiányzó szakma */}
          <div className="mt-5 border-t border-[var(--color-border-soft)] pt-3">
            {missingState === "sent" ? (
              <p className="text-[12px] text-emerald-700">
                {t("results.industryFitMissingThanks", locale)}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-[var(--color-text-secondary)]">
                  {t("results.industryFitMissingTitle", locale)}
                </span>
                <input
                  type="text"
                  value={missingText}
                  onChange={(e) => setMissingText(e.target.value)}
                  maxLength={200}
                  placeholder={t("results.industryFitMissingPlaceholder", locale)}
                  className="min-h-[36px] min-w-[180px] flex-1 rounded-lg border border-[var(--color-border-default)] bg-white px-3 text-[12px] text-[var(--color-text-primary)]"
                />
                <button
                  type="button"
                  disabled={missingState === "busy" || !missingText.trim()}
                  onClick={sendMissing}
                  className="min-h-[36px] rounded-lg border border-sage/50 bg-white px-3.5 text-[12px] font-semibold text-sage-dark transition hover:bg-sage/10 disabled:opacity-50"
                >
                  {t("results.industryFitMissingSend", locale)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Módszertani lap — mire épül a becslés */}
      <div className="mt-4 border-t border-[var(--color-border-soft)] pt-3">
        <button
          type="button"
          onClick={() => setMethodOpen((v) => !v)}
          className="text-micro font-semibold text-[var(--color-text-muted)] transition hover:text-ink"
        >
          {t("results.ccMethodTitle", locale)} {methodOpen ? "▴" : "▾"}
        </button>
        {methodOpen && (
          <div className="mt-2 flex flex-col gap-2 text-micro leading-relaxed text-[var(--color-text-muted)]">
            <p>{t("results.ccMethodBody1", locale)}</p>
            <p>{t("results.ccMethodBody2", locale)}</p>
            <p>{t("results.ccMethodBody3", locale)}</p>
            <p className="font-mono">{t("results.ccMethodRefs", locale)}</p>
          </div>
        )}
        <p className="mt-2 text-micro leading-relaxed text-[var(--color-text-muted)]">
          {t("results.industryFitNote", locale)}
        </p>
      </div>
    </div>
  );
}
