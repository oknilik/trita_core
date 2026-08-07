"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import {
  INDUSTRIES,
  type CareerBackground,
  type CareerStatus,
  type EduField,
  type EduLevel,
  type PrefAxis,
  type PrefValue,
  type UserPrefs,
} from "@/lib/industry-fit";
import { RIASEC_ITEMS, scoreRiasec } from "@/lib/questions/riasec";
import { CelebrationBurst } from "@/components/ui/CelebrationBurst";
import { CareerResults } from "@/components/results/career/CareerResults";
import { ExplainerLink } from "@/components/results/ExplainerLink";
import { CareerGrowthPlan } from "@/components/results/career/CareerGrowthPlan";
import { CurrentRolePicker } from "@/components/results/career/CurrentRolePicker";
import type { CareerResultView } from "@/lib/career/service";

// Karrier-iránytű — rövid kérdéssor (lépés-számlálóval, auto-továbblépéssel),
// majd reveal-eredmény: hero-kártya a legerősebb iránynak, szint-címkék,
// a top-irányokhoz kötött fejlődési terv és observer-pontosítás CTA.

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

const EDU_FIELDS: Array<{ value: EduField; key: string; emoji: string }> = [
  { value: "tech_engineering", key: "results.ccFieldTech", emoji: "🛠️" },
  { value: "economics", key: "results.ccFieldEconomics", emoji: "📈" },
  { value: "health", key: "results.ccFieldHealth", emoji: "🩺" },
  { value: "humanities", key: "results.ccFieldHumanities", emoji: "📖" },
  { value: "natural_science", key: "results.ccFieldScience", emoji: "🔬" },
  { value: "legal", key: "results.ccFieldLegal", emoji: "⚖️" },
  { value: "arts", key: "results.ccFieldArts", emoji: "🎨" },
  { value: "pedagogy", key: "results.ccFieldPedagogy", emoji: "🧒" },
  { value: "trade", key: "results.ccFieldTrade", emoji: "🔧" },
  { value: "none_other", key: "results.ccFieldNone", emoji: "✨" },
];

const EDU_LEVELS: Array<{ value: EduLevel; key: string }> = [
  { value: "primary", key: "results.ccEduPrimary" },
  { value: "secondary", key: "results.ccEduSecondary" },
  { value: "vocational", key: "results.ccEduVocational" },
  { value: "higher", key: "results.ccEduHigher" },
  { value: "specialized", key: "results.ccEduSpecialized" },
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

const INDUSTRY_EMOJI: Record<string, string> = {
  tech: "💻", health: "🩺", education: "📚", finance: "📊", sales: "🤝",
  creative: "🎨", media: "📣", operations: "🏭", people: "👥", public: "⚖️",
  engineering: "🏗️", hospitality: "🍽️", science: "🔬", trades: "🔧",
  transport: "🚚", services: "✂️",
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
          : "border-[var(--color-border-soft)] bg-surface-card hover:border-sage/40 hover:bg-[var(--color-surface-subtle)]"
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
    <div className="rounded-[12px] border border-sage/40 bg-surface-card p-4">
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
          className="inline-flex min-h-[44px] shrink-0 items-center text-micro font-semibold text-[var(--color-text-muted)] hover:text-ink"
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
                ? "border-sage bg-sage text-[var(--color-action-primary-fg)]"
                : "border-[var(--color-border-soft)] bg-surface-card text-[var(--color-text-secondary)] hover:border-sage/50"
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
          className="mt-3 inline-flex min-h-[44px] items-center text-[12px] font-semibold text-[var(--color-text-muted)] hover:text-ink"
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
          ? "border-sage bg-sage text-[var(--color-action-primary-fg)]"
          : "border-[var(--color-border-default)] bg-surface-card text-[var(--color-text-secondary)] hover:border-sage/50 hover:text-[var(--color-text-primary)]"
      }`}
      style={active ? { animation: "cc-pop 0.3s ease-out" } : undefined}
    >
      {children}
    </button>
  );
}

// Kérdés-audit (2026-07-30): kivezetve a KOR (a profilban van születési év, nem
// kérdezzük újra), a KÉPZÉSI TERÜLET (a v2 motor nem számol vele) és az
// ÉRDEKLŐDÉS-CÍMKÉK (ugyanazt méri, amit a Holland-kérdőív, csak gyengébben —
// aki nem tölti ki a kérdőívet, annál a személyiség-alapú becslés lép be).
type Step =
  | "intro"
  | "status"
  | "edu"
  | "current"
  | "interests"
  | "veto"
  | "riasec"
  | "prefs"
  | "env"
  | "lead"
  | "result";

// Vétó-chipek: kizárható munka-tulajdonságok. A bejelölt vétó KEMÉNY szűrő a
// motorban (a címkézés O*NET-adatból jön, ld. step11_veto_tags.py) — pl. a
// „gyerekekkel foglalkozás" vétója mellett dadus/tanító sosem jelenik meg.
const VETO_OPTIONS: Array<{ value: string; key: string; emoji: string }> = [
  { value: "children", key: "results.ccVetoChildren", emoji: "🧒" },
  { value: "care", key: "results.ccVetoCare", emoji: "🫂" },
  { value: "blood", key: "results.ccVetoBlood", emoji: "🩸" },
  { value: "customers", key: "results.ccVetoCustomers", emoji: "🛎️" },
  { value: "sales", key: "results.ccVetoSales", emoji: "💰" },
  { value: "conflict", key: "results.ccVetoConflict", emoji: "⚡" },
  { value: "shift", key: "results.ccVetoShift", emoji: "🌙" },
  { value: "physical", key: "results.ccVetoPhysical", emoji: "🏋️" },
  { value: "outdoor", key: "results.ccVetoOutdoor", emoji: "🌦️" },
  { value: "screen", key: "results.ccVetoScreen", emoji: "🖥️" },
  { value: "driving", key: "results.ccVetoDriving", emoji: "🚗" },
  { value: "heights", key: "results.ccVetoHeights", emoji: "🪜" },
  { value: "hazard", key: "results.ccVetoHazard", emoji: "☣️" },
  { value: "monotony", key: "results.ccVetoMonotony", emoji: "🔁" },
  { value: "animals", key: "results.ccVetoAnimals", emoji: "🐾" },
];

const EMPTY_BACKGROUND: CareerBackground = {
  status: "working",
  eduLevel: null,
  eduField: null,
  ageBand: null,
  currentIndustry: null,
  interests: [],
};

export function CareerCompass({
  initialBackground = null,
  initialResult = null,
  growthFocusItems = [],
  onRequestObserver,
  hasSelfResult = true,
}: {
  /** A szerveren előre kiszámolt eredmény (első render, a PDF-fel azonos forrás) */
  initialResult?: CareerResultView | null;
  initialBackground?: CareerBackground | null;
  /** Facet-szintű fejlődési elemek — a fejlődési terv blokk alapja */
  growthFocusItems?: CompassGrowthItem[];
  /** Observer-pontosítás CTA — átvált a meghívások tabra */
  onRequestObserver?: () => void;
  /**
   * Van-e kitöltött személyiségprofil. A modul BEMENETE a profil: enélkül a
   * wizard elindítható lenne, de a végén nem tudnánk illeszkedést számolni —
   * ezért a belépő gomb a kitöltésre visz, nem az első kérdésre.
   */
  hasSelfResult?: boolean;
}) {
  const { locale } = useLocale();
  const isHu = locale === "hu";
  // Teljes mentett háttérnél (van status — a wizardot már végigvitte) egyből
  // az eredmény jön; az onboardingból származó RÉSZLEGES háttér (edu/iparág,
  // status nélkül) a wizardot előtöltve indítja.
  const hasCompleteBackground = Boolean(
    hasSelfResult && initialBackground && (initialBackground as { status?: string }).status,
  );
  const [step, setStep] = useState<Step>(hasCompleteBackground ? "result" : "intro");
  const [background, setBackground] = useState<CareerBackground>(
    initialBackground ? { ...EMPTY_BACKGROUND, ...initialBackground } : EMPTY_BACKGROUND,
  );
  // A mentett preferenciákból indulunk, NEM üresről. Enélkül a „válaszok
  // módosítása" úgy indulna, hogy a beállított tengelyek eltűntek a
  // felületről — és mivel mentéskor `{ ...background, prefs }` megy ki, az
  // üres `prefs` felül is írná a szerveren tárolt beállítást. A preferencia
  // a rangsor legerősebb jele, ezt elveszíteni a legdrágább hiba.
  // Teljes visszaállításnál (`resetAll`) ürül — ott ez a szándék.
  const [prefs, setPrefs] = useState<UserPrefs>(initialBackground?.prefs ?? {});
  const [leadIntent, setLeadIntent] = useState<"lead" | "expert" | "unsure">(
    initialBackground?.leadIntent ?? "unsure",
  );
  const [missingText, setMissingText] = useState("");
  const [missingState, setMissingState] = useState<"idle" | "busy" | "sent">("idle");
  const [methodOpen, setMethodOpen] = useState(false);
  // Vezetői kérdés látható kijelöléshez (a leadFocus boolean ebből származik).
  // A mentett szándékból induljon, hogy módosításkor látszódjon a korábbi
  // válasz — `null` csak akkor, ha a user még sosem válaszolt.
  const [leadChoice, setLeadChoice] = useState<"yes" | "expert" | "unsure" | null>(
    initialBackground?.leadIntent
      ? initialBackground.leadIntent === "lead"
        ? "yes"
        : initialBackground.leadIntent
      : null,
  );
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

  // A kérdőív a leghosszabb lépés, és az eredménye a DB-ben marad — ha egyszer
  // kitöltötte, a wizard újrafuttatásakor NE kérdezzük meg újra. Csak a teljes
  // újrakezdés (DELETE) törli, ott a lépés visszajön.
  //
  // MOUNTKOR dől el, nem reaktívan: ha a `flow` menet közben rövidülne (mert a
  // user épp most töltötte ki a kérdőívet), a `goNext("riasec")` egy már nem
  // létező lépésből számolna következőt, és a wizard az elejére ugrana vissza.
  const [riasecPrefilled, setRiasecPrefilled] = useState(
    () => Object.keys(initialBackground?.riasecScores ?? {}).length > 0,
  );

  // A wizard lépéssorrendje — tanulóknál a „jelenlegi terület" kimarad.
  const flow: Step[] = [
    "status",
    "edu",
    ...(background.status === "studying" ? [] : (["current"] as Step[])),
    "interests",
    "veto",
    ...(riasecPrefilled ? [] : (["riasec"] as Step[])),
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
    setCelebrate(true);
    // A preferenciák és a vezetői szándék IS mentődik — enélkül újratöltés
    // után más rangsor jött, mint amit a user a wizard végén látott.
    void fetch("/api/profile/career-background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...background, prefs, leadIntent }),
    }).catch(() => {
      /* a mentés hibája nem blokkolja az eredményt */
    });
    void fetchFit(background, prefs, leadIntent);
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

  // Mért Holland-kód: a mentett háttérben már van érdeklődés-teszt eredmény
  const hasMeasuredRiasec = Object.keys(background.riasecScores ?? {}).length > 0;


  // Az eredményt a SZERVER számolja (motor v2): a 477 tételes katalógus nem
  // kerül a kliensbe, és a PDF-ág ugyanezt a végpontot használja.
  const [fitResult, setFitResult] = useState<CareerResultView | null>(initialResult);
  const [fitState, setFitState] = useState<"idle" | "loading" | "error">("idle");
  // Szűretlen-nézet kapcsoló: a bejelölt területek szűrője kikapcsolható,
  // hogy a mért érdeklődés szerinti teljes kép is látható legyen.
  const [ignoreScope, setIgnoreScope] = useState(false);

  const fetchFit = useCallback(
    async (
      next: CareerBackground,
      nextPrefs: UserPrefs,
      intent: "lead" | "expert" | "unsure",
      skipScope = false,
    ) => {
      setFitState("loading");
      try {
        const res = await fetch("/api/career/fit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prefs: nextPrefs,
            leadIntent: intent,
            eduLevel: next.eduLevel,
            industries: next.interests,
            currentIndustry: next.currentIndustry,
            status: next.status,
            ignoreScope: skipScope,
            vetoes: next.vetoes ?? [],
          }),
        });
        if (!res.ok) throw new Error("FIT_FAILED");
        setFitResult((await res.json()) as CareerResultView);
        setFitState("idle");
      } catch {
        setFitState("error");
      }
    },
    [],
  );

  /** Részleges mentés: a meglévő háttérre rárakja a változást (a rangsort nem érinti). */
  const saveBackground = useCallback(
    async (patchFields: Partial<CareerBackground>) => {
      const next = { ...background, ...patchFields };
      setBackground(next);
      try {
        await fetch("/api/profile/career-background", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...next, prefs, leadIntent }),
        });
      } catch {
        /* a kliens-oldali állapot így is helyes */
      }
    },
    [background, prefs, leadIntent],
  );

  /**
   * Teljes visszaállítás: a szerveren törli a mentett hátteret (a kitöltött
   * érdeklődés-kérdőívvel együtt), és a wizardot alaphelyzetbe hozza. A
   * személyiség-eredmény érintetlen — a user azzal kezd újra.
   */
  const resetAll = useCallback(async () => {
    try {
      await fetch("/api/profile/career-background", { method: "DELETE" });
    } catch {
      /* a kliens-oldali visszaállítás így is megtörténik */
    }
    setBackground(EMPTY_BACKGROUND);
    setPrefs({});
    setLeadChoice(null);
    setLeadIntent("unsure");
    setFitResult(null);
    setFitState("idle");
    setProfilerOpen(false);
    setCelebrate(false);
    setRiasecPrefilled(false);
    setStep("intro");
  }, []);

  // Ha mentett háttérrel érkezünk, de a szerver nem adott kezdeti eredményt
  // (pl. a wizard épp most zárult le egy másik eszközön), egyszer lekérjük.
  useEffect(() => {
    if (step !== "result" || fitResult || fitState !== "idle") return;
    void fetchFit(background, prefs, leadIntent);
  }, [step, fitResult, fitState, fetchFit, background, prefs, leadIntent]);



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
        className="inline-flex min-h-[44px] items-center text-[12px] font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
      >
        {t("results.ccBack", locale)}
      </button>
      {showNext && (
        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => goNext(from)}
          className="inline-flex min-h-[40px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark disabled:opacity-40"
        >
          {flow.indexOf(from) === flow.length - 1
            ? t("results.ccFinish", locale)
            : t("results.ccNext", locale)}
        </button>
      )}
    </div>
  );

  return (
    <div className="rounded-[14px] border border-[var(--color-border-soft)] bg-surface-card p-5">
      {/* Forrás-badge */}
      <div className="mb-3 flex justify-end">
        <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-micro text-[var(--color-text-muted)]">
          {t(
            (fitResult?.observerWeight ?? 0) > 0
              ? "results.industryFitSourceMeasured"
              : "results.industryFitSourceSelf",
            locale,
          )}
        </span>
      </div>

      {step === "intro" && (
        <div style={{ animation: "cc-step-in 0.35s ease-out both" }}>
          {/* Hero — mit ígér a modul és mit nem */}
          <div className="overflow-hidden rounded-[16px] border border-sage/40 bg-gradient-to-br from-sage/12 via-white to-[var(--color-surface-subtle)] p-5 sm:p-6">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card text-2xl shadow-sm ring-1 ring-sage/30"
              aria-hidden
            >
              🧭
            </span>
            <p className="mt-3 font-fraunces text-title leading-snug text-[var(--color-text-primary)]">
              {t("results.ccIntroTitle", locale)}
            </p>
            <p className="mt-2 max-w-2xl text-body leading-relaxed text-[var(--color-text-secondary)]">
              {t("results.ccIntroLead", locale)}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                `📝 ${tf("results.ccIntroMetaQuestions", locale, { count: flow.length })}`,
                `⏱ ${t("results.ccIntroMetaTime", locale)}`,
                `💾 ${t("results.ccIntroMetaSaved", locale)}`,
                `🫶 ${t("results.ccIntroMetaNoWrong", locale)}`,
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-white/80 px-2.5 py-1 text-micro font-medium text-[var(--color-text-muted)] ring-1 ring-[var(--color-border-soft)]"
                >
                  {chip}
                </span>
              ))}
            </div>
            {/* Opcionális érdeklődés-teszt (Holland-kód) — a pontosítás útja.
                A magyarázó-link külön sávot kap: korábban egy aláhúzott szó
                volt a bekezdés végén, és észrevétlen maradt. */}
            <div className="mt-4 rounded-[12px] border border-dashed border-sage/50 bg-white/70 px-4 py-3">
              <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                {hasMeasuredRiasec
                  ? t("results.ccIntroRiasecDone", locale)
                  : tf("results.ccIntroRiasec", locale, {
                      count: RIASEC_ITEMS.length,
                    })}
              </p>
              <ExplainerLink
                className="mt-2.5"
                label={t("results.hollandExplainerLabel", locale)}
                hint={t("results.hollandExplainerHint", locale)}
                href="/holland-kod"
              />
            </div>
            {/* Profil nélkül a modul nem tud illeszkedést számolni, ezért a
                belépő gomb a kitöltésre visz — nem külön üzenőképernyő, csak
                más cél és felirat. */}
            {hasSelfResult ? (
              <button
                type="button"
                onClick={() => setStep("status")}
                className="mt-5 inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
              >
                {t("results.ccStart", locale)}
              </button>
            ) : (
              <div className="mt-5">
                <Link
                  href="/assessment"
                  className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
                >
                  {t("results.ccNeedsProfileCta", locale)}
                </Link>
                <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                  {t("results.ccNeedsProfileNote", locale)}
                </p>
              </div>
            )}
          </div>

          {/* Három összetevő: profil + válaszok = irányok */}
          <p className="mt-6 font-mono text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("results.ccIntroHowLabel", locale)}
          </p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                ["🧬", "results.ccIntroStep1Title", "results.ccIntroStep1Body"],
                ["🗂", "results.ccIntroStep2Title", "results.ccIntroStep2Body"],
                ["🎯", "results.ccIntroStep3Title", "results.ccIntroStep3Body"],
              ] as Array<[string, string, string]>
            ).map(([emoji, titleKey, bodyKey], i) => (
              <div
                key={titleKey}
                className="rounded-[12px] border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4"
                style={{
                  animation: "cc-step-in 0.35s ease-out both",
                  animationDelay: `${80 + i * 80}ms`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>
                    {emoji}
                  </span>
                  <span className="font-mono text-micro text-[var(--color-text-muted)]">
                    {i + 1}/3
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                  {t(titleKey, locale)}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                  {t(bodyKey, locale)}
                </p>
              </div>
            ))}
          </div>

          {/* Őszinte keretezés — a becslés határai előre, nem az eredmény után */}
          <div className="mt-4 rounded-[12px] border border-state-warning-border bg-state-warning-bg/60 p-4">
            <p className="text-caption font-semibold text-accent-earth-strong">
              ⚖️ {t("results.ccIntroCaveatTitle", locale)}
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {[
                "results.ccIntroCaveat1",
                "results.ccIntroCaveat2",
                "results.ccIntroCaveat3",
                "results.ccIntroCaveat4",
              ].map((key) => (
                <li
                  key={key}
                  className="flex gap-2 text-[12px] leading-relaxed text-accent-earth-strong/85"
                >
                  <span aria-hidden>·</span>
                  <span>{t(key, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
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
                    // Alapfok/érettségi mellett nincs értelmezhető szakirány
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
          {(background.eduLevel === "vocational" ||
            background.eduLevel === "higher" ||
            background.eduLevel === "specialized") && (
            <div style={{ animation: "cc-step-in 0.3s ease-out both" }}>
              <p className="mt-4 text-[11px] font-medium text-[var(--color-text-muted)]">
                {t("results.ccFieldLabelMulti", locale)}
              </p>
              <p className="mt-0.5 text-micro text-[var(--color-text-muted)]">
                {t("results.ccWhyEduField", locale)}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {EDU_FIELDS.map(({ value, key, emoji }) => {
                  const selected = (background.eduFields ?? []).includes(value);
                  return (
                    <Chip
                      key={value}
                      active={selected}
                      onClick={() => {
                        const current = background.eduFields ?? [];
                        const next = selected
                          ? current.filter((field) => field !== value)
                          : current.length >= 3
                            ? current
                            : [...current, value];
                        patch({ eduFields: next, eduField: next[0] ?? null });
                      }}
                    >
                      {emoji} {t(key, locale)}
                    </Chip>
                  );
                })}
              </div>
            </div>
          )}
          {stepNav("edu")}
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

      {step === "veto" && (
        <div key="veto" style={{ animation: "cc-step-in 0.3s ease-out both" }}>
          {stepHeader("results.ccStepVeto", "results.ccWhyVeto")}
          <div className="flex flex-wrap gap-1.5">
            {VETO_OPTIONS.map(({ value, key, emoji }) => {
              const active = (background.vetoes ?? []).includes(value);
              return (
                <Chip
                  key={value}
                  active={active}
                  onClick={() => {
                    const current = background.vetoes ?? [];
                    patch({
                      vetoes: active
                        ? current.filter((v) => v !== value)
                        : current.length >= 5
                          ? current
                          : [...current, value],
                    });
                  }}
                >
                  {emoji} {t(key, locale)}
                </Chip>
              );
            })}
          </div>
          <p className="mt-2 text-micro text-[var(--color-text-muted)]">
            {tf("results.ccVetoCount", locale, {
              count: (background.vetoes ?? []).length,
            })}
          </p>
          {stepNav("veto")}
        </div>
      )}

      {step === "riasec" && (
        <div key="riasec" style={{ animation: "cc-step-in 0.3s ease-out both" }}>
          {stepHeader("results.ccStepRiasec", "results.ccWhyRiasec")}
          {profilerOpen ? (
            <RiasecProfiler
              onCancel={() => setProfilerOpen(false)}
              onComplete={(scores) => {
                setProfilerOpen(false);
                patch({ riasecScores: scores as CareerBackground["riasecScores"] });
                goNext("riasec");
              }}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              <OptionCard
                emoji="🎯"
                label={t("results.ccRiasecStart", locale)}
                sub={tf("results.ccRiasecStartSub", locale, { count: RIASEC_ITEMS.length })}
                active={hasMeasuredRiasec}
                onClick={() => setProfilerOpen(true)}
              />
              <OptionCard
                emoji="⏭"
                label={t("results.ccRiasecSkip", locale)}
                sub={t("results.ccRiasecSkipSub", locale)}
                active={false}
                onClick={() => goNext("riasec")}
              />
            </div>
          )}
          {!profilerOpen && stepNav("riasec", false, false)}
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
                      ? "bg-sage text-[var(--color-action-primary-fg)] shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:bg-surface-card hover:text-[var(--color-text-primary)]"
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
                      ? "bg-sage text-[var(--color-action-primary-fg)] shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:bg-surface-card hover:text-[var(--color-text-primary)]"
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
                    setLeadIntent(choice === "yes" ? "lead" : choice === "expert" ? "expert" : "unsure");
                    void value;
                  })
                }
              />
            ))}
          </div>
          {stepNav("lead", false, false)}
        </div>
      )}

      {step === "result" && (
        <div>
          {celebrate && <CelebrationBurst onDone={() => setCelebrate(false)} />}

          {fitState === "loading" && !fitResult && (
            <p className="text-caption text-[var(--color-text-secondary)]">
              {t("results.cfLoading", locale)}
            </p>
          )}
          {fitState === "error" && (
            <div className="rounded-[12px] border border-state-error-border bg-state-error-bg/60 p-4">
              <p className="text-caption text-text-error-strong">{t("results.cfError", locale)}</p>
              <button
                type="button"
                onClick={() => fetchFit(background, prefs, leadIntent)}
                className="mt-2 rounded-lg border border-state-error-border bg-surface-card px-3 py-1.5 text-[12px] font-semibold text-state-error-fg"
              >
                {t("results.cfRetry", locale)}
              </button>
            </div>
          )}

          {fitResult && (
            <CareerResults
              result={fitResult}
              onEditAnswers={() => setStep("status")}
              onReset={resetAll}
              onToggleScope={() => {
                const next = !ignoreScope;
                setIgnoreScope(next);
                void fetchFit(background, prefs, leadIntent, next);
              }}
              extra={
                <>
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
                          void fetch("/api/profile/career-background", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ...nextBackground, prefs, leadIntent }),
                          })
                            .then(() => fetchFit(nextBackground, prefs, leadIntent))
                            .catch(() => {});
                        }}
                      />
                    </div>
                  ) : (
                    fitResult.interestSource !== "measured" && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-dashed border-sage/50 bg-sage/5 px-4 py-3">
                        <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                          🎯 {t("results.ccRiasecCta", locale)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setProfilerOpen(true)}
                          className="inline-flex min-h-[36px] items-center rounded-lg bg-sage px-4 text-[12px] font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
                        >
                          {t("results.ccRiasecCtaBtn", locale)}
                        </button>
                      </div>
                    )
                  )}

                  {/* Observer-pontosítás — ha még csak önértékelésen áll a kép */}
                  {fitResult.observerWeight === 0 && onRequestObserver && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-4">
                      <p className="max-w-xl text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                        {t("results.ccObserverRefine", locale)}
                      </p>
                      <button
                        type="button"
                        onClick={onRequestObserver}
                        className="inline-flex min-h-[40px] items-center rounded-lg border border-sage/50 bg-surface-card px-4 text-[12px] font-semibold text-sage-dark transition hover:bg-sage/10"
                      >
                        {t("results.ccObserverRefineCta", locale)}
                      </button>
                    </div>
                  )}
                </>
              }
            />
          )}

          {/* Fejlődési irányok — a cél alatti komponensekhez kötve, IRÁNY-TUDATOSAN */}
          {fitResult && <CareerGrowthPlan result={fitResult} items={growthFocusItems} />}

          {/* Jelenlegi foglalkozás — a known-groups validáció adatforrása */}
          {fitResult && (
            <CurrentRolePicker
              value={background.currentOccupationId ?? null}
              valueLabel={background.currentOccupationLabel ?? null}
              onSelect={(occupation) =>
                saveBackground({
                  currentOccupationId: occupation.id,
                  currentOccupationLabel: occupation.hu,
                })
              }
              onClear={() =>
                saveBackground({ currentOccupationId: null, currentOccupationLabel: null })
              }
            />
          )}

          {/* Hiányzó szakma */}
          <div className="mt-5 border-t border-[var(--color-border-soft)] pt-3">
            {missingState === "sent" ? (
              <p className="text-[12px] text-state-success-fg">
                {t("results.industryFitMissingThanks", locale)}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-[var(--color-text-secondary)]">
                  {t("results.industryFitMissingTitle", locale)}
                </span>
                {/* mobil: 16px betűméret, különben iOS Safari fókuszkor rázoomol */}
                <input
                  type="text"
                  value={missingText}
                  onChange={(e) => setMissingText(e.target.value)}
                  maxLength={200}
                  placeholder={t("results.industryFitMissingPlaceholder", locale)}
                  className="min-h-[44px] min-w-[180px] flex-1 rounded-lg border border-[var(--color-border-default)] bg-surface-card px-3 text-base text-[var(--color-text-primary)] md:min-h-[36px] md:text-[12px]"
                />
                <button
                  type="button"
                  disabled={missingState === "busy" || !missingText.trim()}
                  onClick={sendMissing}
                  className="min-h-[36px] rounded-lg border border-sage/50 bg-surface-card px-3.5 text-[12px] font-semibold text-sage-dark transition hover:bg-sage/10 disabled:opacity-50"
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
          className="inline-flex min-h-[44px] items-center text-micro font-semibold text-[var(--color-text-muted)] transition hover:text-ink"
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
