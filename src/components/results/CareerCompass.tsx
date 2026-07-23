"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import {
  INDUSTRIES,
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

// Karrier-iránytű — rövid kérdéssor (lépés-számlálóval, auto-továbblépéssel),
// majd reveal-eredmény: hero-kártya a legerősebb iránynak, szint-címkék,
// a top-irányokhoz kötött fejlődési terv és observer-pontosítás CTA.

const DIM_LABELS: Record<DimCode, { hu: string; en: string }> = {
  INTE: { hu: "integritás", en: "integrity" },
  RESO: { hu: "rezonancia", en: "resonance" },
  TEMP: { hu: "társas energia", en: "tempo" },
  ADAP: { hu: "alkalmazkodás", en: "adaptability" },
  THOR: { hu: "tervezettség", en: "thoroughness" },
  OPEN: { hu: "nyitottság", en: "openness" },
};

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
    >
      {children}
    </button>
  );
}

function SuggestionCard({
  suggestion,
  scores,
  leadFocus,
  hero = false,
  delayMs = 0,
}: {
  suggestion: CareerSuggestion;
  scores: Partial<Record<DimCode, number>>;
  leadFocus: boolean;
  hero?: boolean;
  delayMs?: number;
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

  const breakdown = open ? explainRoleFit(scores, suggestion.role, { leadFocus }) : [];

  // A hero-mondat: a két legjobban illeszkedő dimenzió a szerep súlyaiból.
  const heroLine = hero
    ? (() => {
        const top2 = explainRoleFit(scores, suggestion.role, { leadFocus })
          .slice()
          .sort((a, b) => b.alignment - a.alignment)
          .slice(0, 2);
        if (top2.length < 2) return null;
        return tf("results.ccHeroLine", locale, {
          d1: isHu ? DIM_LABELS[top2[0].dim].hu : DIM_LABELS[top2[0].dim].en,
          d2: isHu ? DIM_LABELS[top2[1].dim].hu : DIM_LABELS[top2[1].dim].en,
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
      style={{ animation: "fadeIn 0.3s ease-out both", animationDelay: `${delayMs}ms` }}
    >
      {hero && (
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-sage-dark">
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
              <span className="ml-1.5 rounded-full bg-sage/10 px-1.5 py-0.5 text-[10px] font-semibold text-sage-dark">
                {t("results.ccEduBoostBadge", locale)}
              </span>
            )}
          </p>
        </div>
        {/* Mobilon (sortöréskor) balra igazítva folyik a cím alá, sm-től jobbra. */}
        <div className="text-left sm:text-right">
          <p className={`text-[12px] font-semibold ${tier.tone}`}>{t(tier.key, locale)}</p>
          <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
            {suggestion.score}%
            {suggestion.prefMatch !== null && (
              <> · {suggestion.prefMatch}% {t("results.industryFitPrefMatchLabel", locale)}</>
            )}
          </p>
        </div>
      </div>

      {heroLine && (
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          {heroLine}
        </p>
      )}

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border-soft)]">
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

      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t border-[var(--color-border-soft)] pt-3">
          {breakdown.map((entry) => (
            <div key={`${entry.dim}-${entry.direction}`} className="flex items-center gap-2 sm:gap-3">
              <span className="w-24 shrink-0 text-[10px] leading-tight text-[var(--color-text-secondary)] sm:w-40 sm:text-[11px]">
                {isHu ? DIM_LABELS[entry.dim].hu : DIM_LABELS[entry.dim].en}
                <span className="block text-[10px] text-[var(--color-text-muted)]">
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
              <span className="w-12 shrink-0 text-right font-mono text-[10px] text-[var(--color-text-muted)] sm:w-16">
                {entry.userValue}→{entry.alignment}
              </span>
            </div>
          ))}
          <p className="text-[10px] text-[var(--color-text-muted)]">
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

type Step = "intro" | "status" | "edu" | "age" | "current" | "interests" | "prefs" | "result";

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
  initialBackground = null,
  growthFocusItems = [],
  onRequestObserver,
}: {
  scores: Partial<Record<DimCode, number>>;
  /** Observer-átlagok dimenziónként, ha van külső visszajelzés */
  observerScores?: Partial<Record<DimCode, number>> | null;
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

  // A wizard lépéssorrendje — tanulóknál a „jelenlegi terület" kimarad.
  const flow: Step[] = [
    "status",
    "edu",
    "age",
    ...(background.status === "studying" ? [] : (["current"] as Step[])),
    "interests",
    "prefs",
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
      ? rankCareerSuggestions(effectiveScores, background, { prefs, leadFocus })
      : null;

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
        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
          {tf("results.ccStepOf", locale, { current: stepIndex + 1, total: flow.length })}
        </p>
        <div className="flex items-center gap-1">
          {flow.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                i < stepIndex ? "w-1.5 bg-sage/50" : i === stepIndex ? "w-4 bg-sage" : "w-1.5 bg-[var(--color-border-soft)]"
              }`}
            />
          ))}
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
        <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-[10px] text-[var(--color-text-muted)]">
          {t(
            hasMeasured ? "results.industryFitSourceMeasured" : "results.industryFitSourceSelf",
            locale,
          )}
        </span>
      </div>

      {step === "intro" && (
        <div>
          <p className="max-w-2xl text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
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
        <div>
          {stepHeader("results.ccStepStatus", "results.ccWhyStatus")}
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["studying", "results.ccStatusStudying"],
                ["working", "results.ccStatusWorking"],
                ["switching", "results.ccStatusSwitching"],
              ] as Array<[CareerStatus, string]>
            ).map(([value, key]) => (
              <Chip
                key={value}
                active={background.status === value}
                onClick={() => {
                  patch({
                    status: value,
                    ...(value === "studying" ? { currentIndustry: null } : {}),
                  });
                  goNext("status");
                }}
              >
                {t(key, locale)}
              </Chip>
            ))}
          </div>
          {stepNav("status", false, false)}
        </div>
      )}

      {step === "edu" && (
        <div>
          {stepHeader("results.ccStepEdu", "results.ccWhyEdu")}
          <div className="flex flex-wrap gap-1.5">
            {EDU_LEVELS.map(({ value, key }) => (
              <Chip
                key={value}
                active={background.eduLevel === value}
                onClick={() => patch({ eduLevel: value })}
              >
                {t(key, locale)}
              </Chip>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-medium text-[var(--color-text-muted)]">
            {t("results.ccFieldLabel", locale)}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {EDU_FIELDS.map(({ value, key }) => (
              <Chip
                key={value}
                active={background.eduField === value}
                onClick={() => patch({ eduField: value })}
              >
                {t(key, locale)}
              </Chip>
            ))}
          </div>
          {stepNav("edu")}
        </div>
      )}

      {step === "age" && (
        <div>
          {stepHeader("results.ccStepAge", "results.ccWhyAge")}
          <div className="flex flex-wrap gap-1.5">
            {AGE_BANDS.map(({ value, label }) => (
              <Chip
                key={value}
                active={background.ageBand === value}
                onClick={() => {
                  patch({ ageBand: value });
                  goNext("age");
                }}
              >
                {label}
              </Chip>
            ))}
            <Chip
              active={false}
              onClick={() => {
                patch({ ageBand: null });
                goNext("age");
              }}
            >
              {t("results.ccAgeSkip", locale)}
            </Chip>
          </div>
          {stepNav("age", false, false)}
        </div>
      )}

      {step === "current" && (
        <div>
          {stepHeader("results.ccStepCurrent", "results.ccWhyCurrent")}
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map((industry) => (
              <Chip
                key={industry.key}
                active={background.currentIndustry === industry.key}
                onClick={() => {
                  patch({ currentIndustry: industry.key });
                  goNext("current");
                }}
              >
                {isHu ? industry.hu : industry.en}
              </Chip>
            ))}
            <Chip
              active={false}
              onClick={() => {
                patch({ currentIndustry: null });
                goNext("current");
              }}
            >
              {t("results.ccCurrentNone", locale)}
            </Chip>
          </div>
          {stepNav("current", false, false)}
        </div>
      )}

      {step === "interests" && (
        <div>
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
                  {isHu ? industry.hu : industry.en}
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
        <div>
          {stepHeader("results.ccStepPrefs", "results.ccWhyPrefs")}
          <div className="flex flex-col gap-2">
            {PREF_AXES.map(({ axis, lowKey, highKey }) => {
              const value = prefs[axis] ?? 0;
              const seg = (v: PrefValue, label: string) => (
                <button
                  key={`${axis}-${v}`}
                  type="button"
                  onClick={() => setPrefs((prev) => ({ ...prev, [axis]: v }))}
                  className={`min-h-[32px] rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    value === v
                      ? "bg-sage text-white"
                      : "bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {label}
                </button>
              );
              return (
                <div key={axis} className="flex flex-wrap items-center gap-1.5">
                  {seg(-1, t(lowKey, locale))}
                  {seg(0, t("results.industryFitPrefNeutral", locale))}
                  {seg(1, t(highKey, locale))}
                </div>
              );
            })}
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={leadFocus}
              onChange={() => setLeadFocus((v) => !v)}
              className="h-4 w-4 accent-sage"
            />
            <span className="text-[12px] text-[var(--color-text-secondary)]">
              {t("results.industryFitLeadToggle", locale)}
            </span>
          </label>
          {stepNav("prefs")}
        </div>
      )}

      {step === "result" && result && (
        <div>
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

          {/* Reveal: hero + 2 normál + a többi összecsukva */}
          <div className="mt-3 flex flex-col gap-3">
            {result.suggestions.slice(0, 1).map((suggestion) => (
              <SuggestionCard
                key={`${suggestion.industryKey}-${suggestion.role.key}-${leadFocus}`}
                suggestion={suggestion}
                scores={effectiveScores}
                leadFocus={leadFocus}
                hero
              />
            ))}
            {result.suggestions.slice(1, 3).map((suggestion, i) => (
              <SuggestionCard
                key={`${suggestion.industryKey}-${suggestion.role.key}-${leadFocus}`}
                suggestion={suggestion}
                scores={effectiveScores}
                leadFocus={leadFocus}
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
                      leadFocus={leadFocus}
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

          {currentIndustryExtra.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                {t("results.ccResultCurrent", locale)}
              </p>
              <div className="flex flex-col gap-3">
                {currentIndustryExtra.map((suggestion, i) => (
                  <SuggestionCard
                    key={`current-${suggestion.role.key}-${leadFocus}`}
                    suggestion={suggestion}
                    scores={effectiveScores}
                    leadFocus={leadFocus}
                    delayMs={i * 80}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fejlődési terv — a top-irányok watch-dimenzióihoz kötve */}
          {(result.developDims.length > 0 || devPlanItems.length > 0) && (
            <div className="mt-5 rounded-[12px] border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-[13px] font-semibold text-amber-900">
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
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

      <p className="mt-4 border-t border-[var(--color-border-soft)] pt-3 text-[10px] leading-relaxed text-[var(--color-text-muted)]">
        {t("results.industryFitNote", locale)}
      </p>
    </div>
  );
}
