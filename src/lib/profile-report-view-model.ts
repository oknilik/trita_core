// ─────────────────────────────────────────────────────────────────────────────
// Közös, MÉDIUMFÜGGETLEN riport-view-model (PDF-igazítás, 2026-08-18).
//
// A riport tartalmi source of truth-ja a WEBES eredményoldal fejezetszerkezete
// (ProfileTabs / LinearReport): Gyors összkép → 01 Áttekintés → 02 Dimenziók →
// 03 Munkastílus és fejlődés → opcionális mellékletek. Ez a modul állítja elő
// ezt a szerkezetet EGYSZER; a web és a PDF csak megjeleníti.
//
// Korábban a PDF-adat összeállítása két helyen élt (ProfileTabs letöltés-
// handler + scripts/generate-persona-reports.tsx), és külön sorrendet, külön
// fallbackeket használt — a két kimenet folyamatosan szétcsúszott. Új tartalmi
// szabály ide kerül, ne a megjelenítőkbe.
//
// FONTOS invariáns: „nincs mérve" ≠ 0 pont. A hívó CSAK ténylegesen mért
// dimenziókat ad át; a kiegészítő (I) skála kizárólag akkor kerül a modellbe,
// ha valódi, kitöltésből származó értéke van (ld. `altruism`).
// ─────────────────────────────────────────────────────────────────────────────

import { t, tf, type Locale } from "@/lib/i18n";
import { ALTRUISM_CODE, HEXACO_ORDER, hexLetter, type HexacoCode } from "@/lib/hexaco";
import { deficitSlotEligible, strengthSlotEligible } from "@/lib/score-valence";
import { buildArchetypeStory } from "@/lib/profile-content";
import { isSecondaryUncertain } from "@/lib/personality-type";
import { resolveDisplayRoleScores } from "@/lib/team-role-estimate";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";
import { TEAM_ROLES, TEAM_ROLE_WHY, getTopRoles } from "@/lib/team-role-scoring";
import type { HowYouWorkParts } from "@/lib/workstyle-content";

// ─── Bemenet ────────────────────────────────────────────────────────────────

export interface ReportInputFacet {
  code: string;
  label: string;
  score: number;
}

/** Egyetlen MÉRT dimenzió — a hiányzó (nem mért) dimenzió nem kerül a listába. */
export interface ReportInputDimension {
  code: string;
  label: string;
  score: number;
  insight: string;
  description: string;
  facets?: ReportInputFacet[];
  /** Külső (observer) átlag, ha van elég értékelő. */
  observerScore?: number;
}

export interface ReportEnvItem {
  label: string;
  value: string;
  hedged?: boolean;
}

export interface ReportRoleFit {
  strong: string;
  might: string;
  prep: string;
  secondary?: string;
  strongRoles?: string[];
  mightRoles?: string[];
  prepRoles?: string[];
}

export interface ReportGrowthPlan {
  behavior: string;
  reflection: string;
  challenge: string;
  source?: string;
}

export interface ReportCollaboration {
  click: { text: string; source?: string }[];
  friction: { text: string; source?: string }[];
  needs: { text: string; source?: string }[];
}

export interface ReportPlusContent {
  howYouWorkParts: HowYouWorkParts;
  pressure?: string[];
  pressureParts?: { stress: string; blindspot: string; source?: string }[];
  growthTip?: string;
  growthPlan?: ReportGrowthPlan;
  collaboration?: ReportCollaboration;
  /** „Ideális környezet" sorok — a webes IdealEnvironmentSection adata. */
  envItems?: ReportEnvItem[];
  roleFit: ReportRoleFit;
  takeaways: string[];
}

export interface ReportObserverInput {
  count: number;
  dimensions: { name: string; self: number; observer: number }[];
  summaryPoints?: string[];
}

export interface ReportCareerInput {
  roles: {
    name: string;
    industry: string;
    score: number;
    bandLow: number;
    bandHigh: number;
    why?: string;
  }[];
  developNote?: string;
}

export interface ProfileReportInput {
  locale: Locale;
  plan: "start" | "plus";
  userName: string;
  completedAt: string;
  personalityType: string;
  heroInsight: string;
  /** MINDEN mért dimenzió — a kiegészítő „I" skálát is beleértve, ha mérve lett. */
  dimensions: ReportInputDimension[];
  plusContent?: ReportPlusContent;
  /** Kitöltött csapatszerep-kérdőív eredménye; hiányában profil-alapú becslés. */
  teamRoleMeasuredScores?: Record<string, number> | null;
  observer?: ReportObserverInput;
  /**
   * Karrier-iránytű eredmény. CSAK akkor kerül a riportba, ha a karrier-felület
   * NINCS parkolva (portfolio-parking) — ld. `careerAppendixEnabled`.
   */
  career?: ReportCareerInput;
}

// ─── Kimenet ────────────────────────────────────────────────────────────────

export type ReportChapterId = "overview" | "dimensions" | "workstyle";

export interface ReportChapterMeta {
  id: ReportChapterId;
  /** „01" · „02" · „03" — a webes fejezetkártyák sorszáma. */
  number: string;
  question: string;
  title: string;
  description: string;
}

export type ReportSummaryTone = "strength" | "attention" | "work";

export interface ReportSummaryInsight {
  label: string;
  text: string;
  tone: ReportSummaryTone;
}

export interface ReportDimensionView {
  code: string;
  name: string;
  /** Egybetűs HEXACO-jel a radarhoz és a sávlistához. */
  shortName: string;
  value: number;
  /** Szint-értelmezés (a webes akkordeon „insight" sora). */
  insight: string;
  description: string;
  facets: ReportInputFacet[];
  observerScore?: number;
}

export interface ReportTeamRoleView {
  name: string;
  subtitle: string;
  score: number;
  rank: number;
  why?: string;
}

export interface ReportAltruismView {
  value: number;
  description: string;
}

export type ReportAppendixId = "observer" | "career" | "relational";

export interface ReportAppendixMeta {
  id: ReportAppendixId;
  title: string;
  /** Rövid keretezés: mért vs. profil-alapú becslés. */
  note: string;
}

export interface ProfileReportViewModel {
  locale: Locale;
  plan: "start" | "plus";
  identity: {
    userName: string;
    completedAt: string;
    personalityType: string;
    heroInsight: string;
    archetypeStory?: string;
    topDimensions: string[];
    watchDimensions: string[];
    /** Kódolt pontszámok a borító karakterábrájához. */
    glyphDimensions: { code: string; score: number }[];
  };
  quickOverview: {
    eyebrow: string;
    title: string;
    body: string;
    insights: ReportSummaryInsight[];
  };
  chapters: ReportChapterMeta[];
  overview: {
    dimensions: ReportDimensionView[];
    stripLabel: string;
    radarNote: string;
    profileCharacter: string;
  };
  dimensionsChapter: {
    dimensions: ReportDimensionView[];
    altruism: ReportAltruismView | null;
    takeaways: string[];
  };
  workstyle: {
    howYouWorkParts?: HowYouWorkParts;
    envItems: ReportEnvItem[];
    roleFit?: ReportRoleFit;
    teamRoles: ReportTeamRoleView[];
    teamRoleEstimated: boolean;
    growthPlan?: ReportGrowthPlan;
    growthTip?: string;
  };
  appendices: ReportAppendixMeta[];
  observer?: ReportObserverInput;
  career?: ReportCareerInput;
  relational?: {
    collaboration?: ReportCollaboration;
    pressure: { text: string; source?: string }[];
  };
}

// ─── Segédek ────────────────────────────────────────────────────────────────

const hexacoIndex = (code: string): number => {
  const i = (HEXACO_ORDER as readonly string[]).indexOf(code);
  return i === -1 ? HEXACO_ORDER.length : i;
};

/**
 * Mehet-e a Karrier-iránytű melléklet a riportba?
 *
 * A karrier-felület jelenleg PARKOLVA van (portfolio-parking.ts:
 * `PORTFOLIO_SURFACE_STATE.career = "parked"`), ezért a riport sem generálja le
 * — akkor sem, ha a hívó véletlenül átad karrier-adatot. A parkolás nem törlés:
 * az `AppendixCareerPage` és a hozzá tartozó i18n a repóban marad, és a felület
 * `active`-ra váltásával a melléklet magától visszatér, kód-változtatás nélkül.
 *
 * A felületi kapu (`results/page.tsx` → `careerModuleHidden`) ettől függetlenül
 * megmarad; ez itt a riport-oldali, hívótól független biztosíték.
 */
export function careerAppendixEnabled(): boolean {
  return isPortfolioSurfaceActive("career");
}

/** Fő dimenziók a kanonikus HEXACO-rendben (H·E·X·A·C·O) — az „I" nélkül. */
export function orderedMainDimensions<T extends { code: string }>(dimensions: T[]): T[] {
  return dimensions
    .filter((d) => d.code !== ALTRUISM_CODE)
    .slice()
    .sort((a, b) => hexacoIndex(a.code) - hexacoIndex(b.code));
}

/**
 * A „Gyors összkép" három insightja — a webes ProfileSummary kanonikus
 * buildere. A PDF UGYANEZT rendereli, ugyanabban a sorrendben, szó szerint
 * ugyanazzal a szöveggel.
 */
export function buildProfileSummaryInsights(
  dimensions: ReportInputDimension[],
  plusContent: Pick<ReportPlusContent, "howYouWorkParts" | "growthTip"> | undefined,
  locale: Locale,
): ReportSummaryInsight[] {
  const ordered = orderedMainDimensions(dimensions);
  const ranked = [...ordered].sort((a, b) => b.score - a.score);
  const strongest =
    ranked.find((d) => strengthSlotEligible(d.code, "self") && d.score >= 70) ?? ranked[0];
  const attention = [...ordered]
    .filter((d) => deficitSlotEligible(d.code) && d.score < 40)
    .sort((a, b) => a.score - b.score)[0];

  const mainText = strongest?.insight ?? plusContent?.howYouWorkParts.main ?? "";
  const attentionText =
    plusContent?.howYouWorkParts.watch ??
    attention?.insight ??
    t("results.summaryBalancedAttention", locale);
  const growthText =
    plusContent?.growthTip ??
    attention?.description ??
    strongest?.description ??
    strongest?.insight ??
    "";

  return [
    { label: t("results.summaryNatural", locale), text: mainText, tone: "strength" },
    { label: t("results.summaryAttention", locale), text: attentionText, tone: "attention" },
    { label: t("results.summaryGrowth", locale), text: growthText, tone: "work" },
  ];
}

/** A webes LinearReport fejezetkártyáinak metaadata — sorszám, kérdés, cím, leírás. */
export function buildReportChapters(locale: Locale): ReportChapterMeta[] {
  return [
    {
      id: "overview",
      number: "01",
      question: t("results.reportOverviewQuestion", locale),
      title: t("results.reportOverviewTitle", locale),
      description: t("results.reportOverviewBody", locale),
    },
    {
      id: "dimensions",
      number: "02",
      question: t("results.reportDimensionsQuestion", locale),
      title: t("results.reportDimensionsTitle", locale),
      description: t("results.reportDimensionsBody", locale),
    },
    {
      id: "workstyle",
      number: "03",
      question: t("results.reportWorkstyleQuestion", locale),
      title: t("results.reportWorkstyleTitle", locale),
      description: t("results.reportWorkstyleBody", locale),
    },
  ];
}

function toDimensionView(dim: ReportInputDimension): ReportDimensionView {
  return {
    code: dim.code,
    name: dim.label,
    shortName:
      hexLetter(dim.code) ?? (dim.label.length > 10 ? `${dim.label.slice(0, 10)}.` : dim.label),
    value: dim.score,
    insight: dim.insight,
    description: dim.description,
    facets: dim.facets ?? [],
    observerScore: dim.observerScore,
  };
}

// ─── Builder ────────────────────────────────────────────────────────────────

export function buildProfileReportViewModel(
  input: ProfileReportInput,
): ProfileReportViewModel {
  const { locale, plan } = input;
  const isPlus = plan === "plus";
  const mainDims = orderedMainDimensions(input.dimensions);
  const ranked = [...mainDims].sort((a, b) => b.score - a.score);

  // Erősség/figyelendő listák a kanonikus valencia-kapun át (self felület):
  // a fordított Emocionalitás sem erősség-, sem deficit-slotot nem tölt.
  const highDims = mainDims.filter((d) => strengthSlotEligible(d.code, "self") && d.score >= 70);
  const watchDims = mainDims.filter((d) => deficitSlotEligible(d.code) && d.score < 40);

  // Profil-karakter: „magas {dim}" csak ténylegesen magas (≥70) dimenzióra;
  // alatta a kiegyensúlyozott-profil szöveg, hogy a bullet-lista és a karakter-
  // mondat ne mondjon ellent egymásnak.
  const profileCharacter = (() => {
    const top2High = [...highDims].sort((a, b) => b.score - a.score).slice(0, 2);
    const highPart = top2High[0]
      ? tf("content.profileCharacterHigh", locale, {
          top1: top2High[0].label.toLowerCase(),
          top2Suffix: top2High[1]
            ? tf("content.profileCharacterTop2Suffix", locale, {
                label: top2High[1].label.toLowerCase(),
              })
            : "",
        })
      : t("results.balancedProfile", locale);
    const growthDim = [...watchDims].sort((a, b) => a.score - b.score)[0];
    const growthPart = growthDim
      ? tf("content.profileCharacterGrowth", locale, { bottom: growthDim.label })
      : "";
    return `${highPart}${growthPart}`;
  })();

  const archetypeStory =
    ranked[0] && ranked[1]
      ? buildArchetypeStory(
          ranked[0].code,
          isSecondaryUncertain(mainDims) ? null : ranked[1].code,
          locale,
        ) ?? undefined
      : undefined;

  // Kiegészítő skála: KIZÁRÓLAG valódi, kitöltésből származó „I" értékre.
  // A hívó nem mért dimenziót nem ad át — így hiányzó adatból soha nem lesz
  // 0%-os „Segítőkészség" sor (PDF-audit 2026-08-18, P0/7).
  const altruismDim = input.dimensions.find(
    (d) => d.code === ALTRUISM_CODE && typeof d.score === "number",
  );
  const altruism: ReportAltruismView | null = altruismDim
    ? { value: altruismDim.score, description: altruismDim.insight }
    : null;

  // Csapatszerepek: kanonikus precedencia (mért kérdőív > profil-becslés).
  const teamRole = (() => {
    const hexScores = Object.fromEntries(mainDims.map((d) => [d.code, d.score])) as Partial<
      Record<HexacoCode, number>
    >;
    const resolved = resolveDisplayRoleScores(input.teamRoleMeasuredScores, hexScores);
    if (!resolved) return { roles: [] as ReportTeamRoleView[], estimated: false };
    const measured = resolved.source === "questionnaire";
    const sourceLabel = measured
      ? t("results.teamRoleSourceMeasured", locale)
      : t("results.teamRoleSourceEstimate", locale);
    const top3 = getTopRoles(resolved.scores, 3, resolved.exact);
    return {
      roles: top3.map((r, i) => ({
        name: TEAM_ROLES[r.role][locale],
        subtitle: i === 0 ? sourceLabel : "",
        score: r.score,
        rank: i,
        // Indoklás csak a becsült elsődleges szerephez — mért eredménynél a
        // pontszám maga a bizonyíték.
        why: i === 0 && !measured ? TEAM_ROLE_WHY[r.role][locale] : undefined,
      })),
      estimated: !measured,
    };
  })();

  const pc = isPlus ? input.plusContent : undefined;

  // Kapcsolati dinamika melléklet: a „Csapatban működve" + a „Vakfoltok és
  // nyomás alatt" blokk EGYÜTT, a riport végén, profil-alapú becslésként
  // megnevezve — nem ékelődik önálló főfejezetként a webes szerkezetbe.
  const pressureItems = (pc?.pressure ?? []).map((text, idx) => ({
    text,
    source: pc?.pressureParts?.[idx]?.source,
  }));
  const relational =
    pc && (pc.collaboration || pressureItems.length > 0)
      ? { collaboration: pc.collaboration, pressure: pressureItems }
      : undefined;

  const appendices: ReportAppendixMeta[] = [];
  if (input.observer && input.observer.count > 0) {
    appendices.push({
      id: "observer",
      title: t("pdf.appendixObserverTitle", locale),
      note: t("pdf.appendixObserverNote", locale),
    });
  }
  if (careerAppendixEnabled() && input.career && input.career.roles.length > 0) {
    appendices.push({
      id: "career",
      title: t("pdf.appendixCareerTitle", locale),
      note: t("pdf.appendixCareerNote", locale),
    });
  }
  if (relational) {
    appendices.push({
      id: "relational",
      title: t("pdf.appendixRelationalTitle", locale),
      note: t("pdf.appendixRelationalNote", locale),
    });
  }

  const dimensionViews = mainDims.map(toDimensionView);

  return {
    locale,
    plan,
    identity: {
      userName: input.userName,
      completedAt: input.completedAt,
      personalityType: input.personalityType,
      heroInsight: input.heroInsight,
      archetypeStory,
      topDimensions: highDims.map((d) => d.label),
      watchDimensions: watchDims.map((d) => d.label),
      glyphDimensions: mainDims.map((d) => ({ code: d.code, score: d.score })),
    },
    quickOverview: {
      eyebrow: t("results.summaryEyebrow", locale),
      title: t("results.summaryTitle", locale),
      body: t("results.summaryBody", locale),
      insights: buildProfileSummaryInsights(input.dimensions, pc, locale),
    },
    chapters: buildReportChapters(locale),
    overview: {
      dimensions: dimensionViews,
      stripLabel: t("content.stripLabel", locale),
      radarNote: t("results.radarNote", locale),
      profileCharacter,
    },
    dimensionsChapter: {
      dimensions: dimensionViews,
      altruism,
      takeaways: pc?.takeaways ?? [],
    },
    workstyle: {
      howYouWorkParts: pc?.howYouWorkParts,
      envItems: pc?.envItems ?? [],
      roleFit: pc?.roleFit,
      teamRoles: teamRole.roles,
      teamRoleEstimated: teamRole.estimated,
      growthPlan: pc?.growthPlan,
      growthTip: pc?.growthTip,
    },
    appendices,
    observer: input.observer && input.observer.count > 0 ? input.observer : undefined,
    career:
      careerAppendixEnabled() && input.career && input.career.roles.length > 0
        ? input.career
        : undefined,
    relational,
  };
}

// A `buildInsightBullets` („Erősségeid" / „Figyelendő" bullet-listák)
// 2026-08-18-án KIVEZETVE. Két oka volt:
//  1. HALOTT VOLT — sem a web, sem a PDF nem hívta (a hozzá tartozó i18n
//     kulcsok, results.insightStrengths/insightWatch és pdf.yourStrengths/
//     watchAreas/summaryStrengths, szintén sehol nem renderelődtek);
//  2. a keretezése a pontszámhoz kötött valencia volt („≥70 → erősség,
//     <40 → figyelendő"), vagyis pontosan az a minta, amit a szint-szóra
//     váltás elvet (dimension-utils.ts fejkomment). Halott kódként az volt a
//     kockázata, hogy egy jövőbeli felület a RÉGI keretezéssel köti vissza.
// A „mi visz előre / mire figyelj" ítélet helye a NARRATÍV slot marad
// (workstyle-content HowYouWork mintázat-kártyái, a score-valence.ts
// kapuján át) — az nem pontszám-sávból, hanem mintázatból következik.
