"use client";

import { useState, useCallback, useEffect } from "react";
import { t, tf } from "@/lib/i18n";
import { dimColorsCss } from "@/lib/color-system";
import type { Locale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { ProfileHero } from "@/components/results/ProfileHero";
import { ProfileSummary } from "@/components/results/ProfileSummary";
import {
  LinearReport,
  type LinearReportSectionId,
} from "@/components/results/LinearReport";
import { ShareModal } from "@/components/results/ShareModal";
import { UpgradeButton } from "./UpgradeButton";
import { FeedbackForm } from "@/components/dashboard/FeedbackForm";
import { ObserverFlowStatusCard } from "@/components/results/ObserverFlowStatusCard";
import { HEXACO_ORDER, hexLetter } from "@/lib/hexaco";
import { DimensionAccordion } from "@/components/results/DimensionAccordion";
import { TeamRoles } from "@/components/results/TeamRoles";
import type { TeamRolesPeerData } from "@/components/results/TeamRoles";
import { TEAM_ROLES, TEAM_ROLE_WHY, getTopRoles } from "@/lib/team-role-scoring";
import { resolveDisplayRoleScores } from "@/lib/team-role-estimate";
import { InlineUpsell } from "@/components/results/InlineUpsell";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";
import type { CareerResultView } from "@/lib/career/service";
import { LockedPreview } from "@/components/results/LockedPreview";
import { HowYouWorkSection } from "@/components/results/HowYouWorkSection";
import { IdealEnvironmentSection } from "@/components/results/IdealEnvironmentSection";
import { RoleFitSection } from "@/components/results/RoleFitSection";
import { KeyTakeawaysSection } from "@/components/results/KeyTakeawaysSection";
import { InvitationsTab } from "@/components/results/InvitationsTab";
import { AltruismCard } from "@/components/results/AltruismCard";
import { ComparisonTab as ComparisonTabNew } from "@/components/results/ComparisonTab";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";
import { GrowthFocus } from "@/components/profile/GrowthFocus";
import { DIMENSION_STRENGTH_DESCS, DIMENSION_WATCH_DESCS } from "@/lib/dimension-insights";
import { buildArchetypeStory, poleAwareDimensionLabel } from "@/lib/profile-content";
import { deficitSlotEligible, strengthSlotEligible } from "@/lib/score-valence";
import { isSecondaryUncertain } from "@/lib/personality-type";
import type { HowYouWorkParts } from "@/lib/workstyle-content";
import type { PairTone } from "@/lib/profile-engine";
import type { JourneyExperienceHints } from "@/lib/journey/types";
import { TabViewTracker } from "@/components/analytics/TabViewTracker";
import { track } from "@/lib/analytics/client";
import { EditorialBackHeader } from "@/components/ui/primitives/EditorialBackHeader";
import type { InteractionEntryPreview } from "@/components/results/InteractionEntryCard";

type ProfileLevel = "start" | "plus";
export type ProfileViewId = "summary" | "details" | "comparison";
export type ReportChapterId = LinearReportSectionId;

// ─── Serialized prop types ──────────────────────────────────────────────────

export interface SerializedDimension {
  code: string;
  label: string;
  labelByLocale?: Partial<Record<string, string>>;
  color: string;
  score: number;
  insight: string;
  description: string;
  descriptionByLocale?: Partial<Record<string, string>>;
  insights: { low: string; mid: string; high: string };
  insightsByLocale?: Partial<Record<string, { low: string; mid: string; high: string }>>;
  observerScore?: number;
  facets: { code: string; label: string; score: number }[];
}

export interface SerializedGrowthItem {
  code: string;
  label: string;
  score: number;
  dimCode: string;
  dimLabel: string;
  dimColor: string;
}

export interface SerializedSentInvitation {
  id: string;
  token: string;
  status: string;
  createdAt: string;
  /**
   * NAP-pontosságú dátum (YYYY-MM-DD) — a másodperc-pontos kitöltési
   * időbélyeg a kliensen differencia-támadási felület lenne (W1: az
   * anonim értékelő azonosítása időzítés alapján). A korábbi
   * `relationship` mező (az értékelő viszony-típusa) ugyanezért törölve —
   * semmi nem renderelte.
   */
  completedAt: string | null;
  observerEmail: string | null;
  observerName?: string | null;
  observerType?: string;
}

export interface SerializedReceivedInvitation {
  id: string;
  token: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  completedAt: string | null;
  inviterUsername: string | null;
}

export interface BridgeNextStep {
  stage: string;
  explanation: string;
  primary: {
    label: string;
    href: string;
  };
  secondary?: {
    label: string;
    href: string;
  } | null;
}

export interface ProfileTabsProps {
  name: string;
  assessmentDate: string;
  accessLevel: ProfileLevel;
  initialTab: ProfileViewId;
  initialDetailChapter?: ReportChapterId;
  dimensions: SerializedDimension[];
  growthFocusItems: SerializedGrowthItem[];
  hasObserverData: boolean;
  observerCount: number;
  /** Az értékelők átlagos magabiztossága (1–5) — null, ha nincs adat. */
  avgObserverConfidence?: number | null;
  /**
   * Self facet-pontszámok a scores JSON-ból (dim → facetkód → 0–100) —
   * null, ha az örökség-eredményben nincs facet-bontás.
   */
  selfFacetScores?: Record<string, Record<string, number>> | null;
  /**
   * Facet-szintű observer-átlag (member-dossier kanonikus aggregátora,
   * facetenként ≥2 értékelő) — null küszöb alatt.
   */
  observerFacetAverages?: Record<string, Record<string, number>> | null;
  /**
   * Kerekített facet-SEM (± pont) a facet-összevetés egyezés-küszöbéhez —
   * a szerver számolja (lib/psychometrics), a bank nem kerül kliens-bundle-be.
   */
  facetSem?: number | null;
  /**
   * Observer-folyamat állapota (self/csapat szétválasztás, 2026-07-22).
   * Org-tagnál ("locked" | "in_progress" | "available") a meghívó-tab
   * állapot-kártyát mutat a személyes meghívó-flow helyett, és az
   * összevetés a küszöbig zárva marad. null / "self_serve" → régi flow.
   */
  observerFlow?: {
    state: "self_serve" | "locked" | "in_progress" | "available";
    receivedCount: number;
    minForReveal: number;
    activeCampaignName: string | null;
  } | null;
  sentInvitations: SerializedSentInvitation[];
  receivedInvitations: SerializedReceivedInvitation[];
  feedbackSubmitted: boolean;
  clarityFeedbackSubmitted: boolean;
  /** Hero-specific props (optional — defaults provided) */
  personalityType?: string;
  heroInsight?: string;
  /** Már élő publikus megosztás tokenje; null esetén a modal csak szándékra hoz létre linket. */
  shareToken?: string | null;
  /**
   * Van-e BÁRMELY élő megosztás (nem csak a legutóbbi eredményen) — a
   * visszavonás ettől függ, mert a DELETE is minden tokent visszavon.
   */
  hasActiveShare?: boolean;
  /** Plus content sections */
  plusContent?: {
    introText: string;
    /** „Ahogy működsz" nevesített slotokkal (FIX 3): main = fő mintázat,
     *  watch = CSAK `tone: "risk"` pár, notes = semleges „Jellemző mintázat"
     *  (fordított skála), context = a többi bekezdés. */
    howYouWorkParts: HowYouWorkParts;
    /** Nem-feloldás tension-párok strukturáltan. A `tone` dönti el a
     *  keretezést: "risk" = figyelendő, "note" = semleges jellemző mintázat
     *  (fordított skála — TILOS deficitként megjeleníteni). */
    riskParts?: {
      summary: string;
      advice: string;
      source?: string;
      tone?: PairTone;
    }[];
    /** Vakfolt + nyomás alatti működés hipotézisek (P2.1). */
    pressure?: string[];
    /** Strukturált stress/vakfolt párok + forrás-dimenzió (P3.1, P5.2). */
    pressureParts?: { stress: string; blindspot: string; source?: string }[];
    /** Konkrét viselkedéses fejlődési javaslat (P2.4). */
    growthTip?: string;
    /** Háromlépcsős fejlődési ív (P5.5). */
    growthPlan?: { behavior: string; reflection: string; challenge: string; source?: string };
    /** „Csapatban működve" fejezet (P4.2); source = forrás-dimenzió chip (P5.2). */
    collaboration?: {
      click: { text: string; source?: string }[];
      friction: { text: string; source?: string }[];
      needs: { text: string; source?: string }[];
    };
    envItems: { label: string; value: string; hedged?: boolean }[];
    roleFit: { strong: string; might: string; prep: string; secondary?: string; strongRoles?: string[]; mightRoles?: string[]; prepRoles?: string[] };
    takeaways: string[];
  };
  bridgeNextStep?: BridgeNextStep;
  // Org-szintű kapcsoló (trita admin): karrier-fül + PDF karrier-blokk rejtése.
  careerModuleHidden?: boolean;
  /** Interakció-szimuláció: mind a 30 archetípus, szerver-oldalon számolva. */
  experienceHints?: JourneyExperienceHints;
  experienceHintDestination?: string;
  /** A kiemelt páros belépőkártya állapota az összképben. */
  interactionEntry: InteractionEntryPreview;
  /** Szerver-oldalon számolt karrier-illeszkedés (motor v2) */
  careerResult?: CareerResultView | null;
  /** Kérdőív-forma a karrier-modul konfidencia-sávjához. */
  /** Kitöltött csapatszerep-kérdőív eredménye (mért) — ha van. */
  teamRoleMeasuredScores?: Record<string, number> | null;
  /** Csapattársi szerep-visszajelzés aggregátuma (kampányból). */
  teamRolePeer?: TeamRolesPeerData | null;
}

// ─── Shared paywall components ──────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width="20" height="20" viewBox="0 0 20 20"
      fill="none" stroke="var(--color-accent-primary)" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="3" y="9" width="14" height="10" rx="2" />
      <path d="M7 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function TabPaywall({ tier, tierLabel, price, teaser, locale }: {
  tier: string;
  tierLabel: string;
  price: string;
  teaser: string;
  locale: Locale;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-sand bg-surface-card px-6 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sand bg-cream">
        <LockIcon />
      </div>
      <div className="max-w-sm">
        <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
          {tierLabel} · {price}
        </p>
        <p className="text-sm leading-relaxed text-ink-body">{teaser}</p>
      </div>
      <UpgradeButton
        tier={tier}
        label={tf("content.paywallUnlock", locale, { price })}
      />
    </div>
  );
}

// ─── Section-specific blur placeholders ─────────────────────────────────────



// ─── Tab panels ─────────────────────────────────────────────────────────────

interface ResultsTabProps {
  dimensions: SerializedDimension[];
  isPlus: boolean;
  hasObserverData: boolean;
  locale: Locale;
  plusContent?: ProfileTabsProps["plusContent"];
  /** Observer-folyamat állapota — "locked"-nál a CTA zsákutca lenne (B5). */
  observerFlow?: ProfileTabsProps["observerFlow"];
  /** Observer-CTA: átvált a meghívások tabra */
  onOpenInvites: () => void;
  chapter: "overview" | "dimensions";
}

// „Ki vagyok?" — radar, dimenziók, altruizmus, kulcs-tanulságok.
function ResultsTab({
  dimensions,
  isPlus,
  hasObserverData,
  locale,
  plusContent,
  observerFlow = null,
  onOpenInvites,
  chapter,
}: ResultsTabProps) {
  const mainDims = dimensions.filter((d) => d.code !== "I");

  // Akkordeon a radar HEXACO-rendjében (H,E,X,A,C,O) — egyezik az
  // áttekintő listával; az első elem alapból nyitva.
  const accordionDims = HEXACO_ORDER
    .map((code) => mainDims.find((d) => d.code === code))
    .filter((d): d is (typeof mainDims)[number] => Boolean(d))
    .map((d) => ({
      code: d.code,
      name: d.label,
      value: d.score,
      description: d.description,
      insight: d.insight,
      facets: d.facets,
    }));

  if (chapter === "overview") {
    return (
      <section>
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
          <div className="mx-auto w-full max-w-[320px]">
            <RadarChart
              dimensions={mainDims.map((d) => ({
                code: d.code,
                color: d.color,
                score: d.score,
              }))}
              uid="self-report"
            />
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-[var(--color-text-muted)]">
              {t("content.stripLabel", locale)}
            </p>
            {/* Soros lista a radar mellett — a hosszú dimenziónevek nem
                törnek, a sáv + szint-címke egy pillantásra olvasható. */}
            <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--color-border-soft)] bg-surface-card p-4">
              {/* Sorrend = a radar HEXACO-rendje (H·E·X·A·C·O), a színek és
                  az értékek a dimenzió-színt viselik — alacsony szintnél is
                  jól láthatóan. */}
              {HEXACO_ORDER
                .map((code) => mainDims.find((d) => d.code === code))
                .filter((d): d is (typeof mainDims)[number] => Boolean(d))
                .map((d) => {
                  // Szín = dimenzió-identitás (a pötty és a szám eddig is ezt
                  // vitte); a badge ezzel átáll a saját hue soft/strong
                  // párjára, így a soron egyetlen színrendszer fut. A badge
                  // SZÖVEGE továbbra is a pólus-tudatos tier-címke.
                  const colors = dimColorsCss(d.code);
                  return (
                    <div key={d.code}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="min-w-0 flex-1 text-xs font-medium text-[var(--color-text-primary)]">
                          {d.label}
                        </span>
                        <span
                          className="shrink-0 rounded px-[7px] py-[2px] text-micro font-semibold"
                          style={{ backgroundColor: colors.soft, color: colors.strong }}
                        >
                          {/* Pólus-tudatos címke: E alacsony sávja „stabil",
                              nem „figyelendő" (fordított skála, FIX 2). */}
                          {poleAwareDimensionLabel(d.code, d.score, locale)}
                        </span>
                        <span
                          className="w-8 shrink-0 text-right font-fraunces text-sm"
                          style={{ color: colors.strong }}
                        >
                          {d.score}
                        </span>
                      </div>
                      <div className="ml-4 mt-1 h-1 overflow-hidden rounded-sm bg-[var(--color-border-default)]">
                        <div
                          className="h-full rounded-sm"
                          style={{ width: `${d.score}%`, backgroundColor: d.color }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
            <p className="mt-3 text-micro leading-relaxed text-[var(--color-text-muted)]">
              {t("results.radarNote", locale)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      {/* 2. Dimenziók részletesen — a legerősebb alapból nyitva */}
      <section>
        <DimensionAccordion
          dimensions={accordionDims}
          showUpsell={!isPlus}
          defaultOpenIdx={0}
          onDimensionOpen={() => track("results.section_open", { section: "dimension" })}
        />
      </section>

      {/* Altruism — supplementary scale */}
      {(() => {
        const altDim = dimensions.find((d) => d.code === "I");
        if (!altDim) return null;
        return (
          <AltruismCard
            value={altDim.score}
            description={altDim.insight}
          />
        );
      })()}

      {/* 3. Kulcs-tanulságok — rövid zárás; a részletes munkastílus külön tabon */}
      {isPlus && plusContent && (
        <KeyTakeawaysSection paragraphs={plusContent.takeaways} isUnlocked={true} />
      )}

      {/* Observer kontextus-CTA — ha még nincs külső visszajelzés. Zárolt
          observer-folyamatnál (org-tag, kampány előtt) rejtve: a cél-tab ott
          csak állapot-kártyát mutat, a CTA zsákutcába vinne (B5). */}
      {!hasObserverData && observerFlow?.state !== "locked" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-5">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {t("results.observerCtaTitle", locale)}
            </p>
            <p className="mt-1 text-caption leading-relaxed text-[var(--color-text-secondary)]">
              {t("results.observerCtaBody", locale)}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenInvites}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
          >
            {t("results.observerCtaButton", locale)}
          </button>
        </div>
      )}

      {/* Inline upsell — csak aktív paywallnál */}
      {!isPlus && <InlineUpsell />}

      {/* Locked content preview — csak aktív paywallnál */}
      {!isPlus && <LockedPreview isPlus={false} />}
    </div>
  );
}

// „Hogyan dolgozom?" — munkastílus, ideális környezet, szerep-illeszkedés,
// csapatszerep-hajlamok.
function WorkStyleTab({
  dimensions,
  growthFocusItems,
  isPlus,
  locale,
  plusContent,
  teamRoleMeasuredScores = null,
  teamRolePeer = null,
}: {
  dimensions: SerializedDimension[];
  growthFocusItems: SerializedGrowthItem[];
  isPlus: boolean;
  locale: Locale;
  plusContent?: ProfileTabsProps["plusContent"];
  teamRoleMeasuredScores?: Record<string, number> | null;
  teamRolePeer?: TeamRolesPeerData | null;
}) {
  const mainDims = dimensions.filter((d) => d.code !== "I");

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      {isPlus && plusContent && (
        <>
          <HowYouWorkSection
            parts={plusContent.howYouWorkParts}
            isUnlocked={true}
          />
          <IdealEnvironmentSection
            items={plusContent.envItems}
            isUnlocked={true}
          />
          <RoleFitSection
            strongFit={plusContent.roleFit.strong}
            mightWork={plusContent.roleFit.might}
            needsPrep={plusContent.roleFit.prep}
            secondary={plusContent.roleFit.secondary}
            strongRoles={plusContent.roleFit.strongRoles}
            mightRoles={plusContent.roleFit.mightRoles}
            prepRoles={plusContent.roleFit.prepRoles}
            isUnlocked={true}
          />
        </>
      )}

      <section>
        <DashboardSectionHeader
          label={t("results.sectionRoles", locale)}
          className="mb-4"
        />
        <TeamRoles
          tritanScores={Object.fromEntries(mainDims.map((d) => [d.code, d.score]))}
          locale={locale}
          measuredScores={teamRoleMeasuredScores}
          peer={teamRolePeer}
        />
      </section>

      {/* Fejlődési fókusz (UX-audit B2) — a három legalacsonyabb alskála,
          plusz a háromlépcsős fejlődési ív; eddig csak a PDF-ben élt. */}
      {growthFocusItems.length > 0 && (
        <section>
          <DashboardSectionHeader
            label={t("results.sectionGrowth", locale)}
            className="mb-4"
          />
          <p className="mb-4 text-caption leading-relaxed text-[var(--color-text-secondary)]">
            {t("results.growthIntro", locale)}
          </p>
          <GrowthFocus items={growthFocusItems} locale={locale} />
          {plusContent?.growthPlan && (
            <div
              className="mt-4 rounded-r-[14px] bg-[var(--color-surface-self-accent-soft)] p-4 px-[18px]"
              style={{ borderLeft: "4px solid var(--color-action-primary-bg)" }}
            >
              {plusContent.growthPlan.source && (
                <p className="mb-2 text-micro font-bold uppercase tracking-wide text-[var(--color-accent-self-deep)]">
                  {plusContent.growthPlan.source}
                </p>
              )}
              {([
                ["results.growthPlanBehavior", plusContent.growthPlan.behavior],
                ["results.growthPlanReflection", plusContent.growthPlan.reflection],
                ["results.growthPlanChallenge", plusContent.growthPlan.challenge],
              ] as const).map(([labelKey, text]) => (
                <div key={labelKey} className="mt-1.5 first:mt-0">
                  <span className="text-micro font-semibold uppercase tracking-wide text-[var(--color-accent-self-deep)]">
                    {t(labelKey, locale)}:{" "}
                  </span>
                  <span className="text-caption leading-relaxed text-[var(--color-text-secondary)]">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function ProfileTabs({
  name,
  assessmentDate,
  accessLevel,
  initialTab,
  initialDetailChapter = "overview",
  dimensions,
  growthFocusItems,
  hasObserverData,
  observerCount,
  avgObserverConfidence = null,
  selfFacetScores = null,
  observerFacetAverages = null,
  facetSem = null,
  observerFlow = null,
  sentInvitations,
  receivedInvitations,
  feedbackSubmitted,
  clarityFeedbackSubmitted,
  personalityType,
  heroInsight,
  shareToken = null,
  hasActiveShare = false,
  plusContent,
  bridgeNextStep,
  careerModuleHidden = false,
  experienceHints,
  experienceHintDestination,
  interactionEntry,
  careerResult = null,
  teamRoleMeasuredScores = null,
  teamRolePeer = null,
}: ProfileTabsProps) {
  const { locale: rawLocale } = useLocale();
  const locale = rawLocale as Locale;

  const [activeTab, setActiveTab] = useState<ProfileViewId>(initialTab);
  // Hash-horgonyok (#observer-flow stb.): az App Router streaming miatt nem
  // görget hash-re magától, ezért mount után ismételt ráigazítással visszük
  // a cél-elemhez (a második kör a hydration utáni layout-shiftet követi le).
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    let attempts = 0;
    let timer: number | undefined;
    const tryScroll = () => {
      attempts += 1;
      const el = document.getElementById(hash);
      if (el) {
        const top = el.getBoundingClientRect().top;
        // Addig igazítunk, amíg a cél ténylegesen a viewport tetejére nem
        // kerül — a streaming/hydration közbeni layout-shift és a háttér-tab
        // (0 magasságú layout) esetét is lefedi.
        if (Math.abs(top - 16) <= 60 && window.innerHeight > 0) return;
        el.scrollIntoView({ behavior: "auto", block: "start" });
      }
      if (attempts < 40) timer = window.setTimeout(tryScroll, 250);
    };
    timer = window.setTimeout(tryScroll, 100);
    return () => window.clearTimeout(timer);
  }, []);

  const isHu = locale === "hu";
  const isPlus = accessLevel !== "start";
  // A karrier-modul parkolása a szerveren dől el (results/page.tsx →
  // careerHiddenMembership), ezért itt csak a megosztás kapuja kell.
  const publicSharingActive = isPortfolioSurfaceActive("publicSharing");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleTabChange = useCallback(
    (tab: ProfileViewId) => {
      setActiveTab(tab);
      const url = new URL(window.location.href);
      if (tab === "summary") url.searchParams.delete("tab");
      else url.searchParams.set("tab", tab);
      if (tab !== "details") url.searchParams.delete("chapter");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-8 md:gap-12">

      <ProfileHero
        userName={name}
        completedAt={new Date(assessmentDate).toLocaleDateString(
          isHu ? "hu-HU" : "en-GB",
          { year: "numeric", month: "long", day: "numeric" },
        )}
        personalityType={personalityType ?? t("content.personalityProfileFallback", locale)}
        glyphDimensions={dimensions
          .filter((d) => d.code !== "I")
          .map((d) => ({ code: d.code, score: d.score }))}
        insight={heroInsight ?? ""}
        accessLevel={accessLevel}
        onShare={publicSharingActive
          ? () => {
              track("results.export", { format: "link" });
              setShareOpen(true);
            }
          : undefined}
        onDownloadPdf={async () => {
          // A6: melyik riport-kimenetet viszik el magukkal. A letöltés
          // SZÁNDÉKÁT mérjük (a kattintást), nem a fájl elkészültét — a
          // generálás megszakadása is a szándékról szól.
          track("results.export", { format: "pdf" });
          setPdfLoading(true);
          try {
            const { downloadPdf } = await import("@/components/pdf/TritaPdf");
            // Kanonikus HEXACO-sorrend (H·E·X·A·C·O) — a PDF radar, sávok és
            // facet-oldalak is ebben a rendben jelennek meg, a felülettel egyezően.
            const tritanIndex = (code: string) => {
              const i = (HEXACO_ORDER as readonly string[]).indexOf(code);
              return i === -1 ? HEXACO_ORDER.length : i;
            };
            const mainDims = dimensions
              .filter((d) => d.code !== "I")
              .sort((a, b) => tritanIndex(a.code) - tritanIndex(b.code));
            // Build bullet-based insights from dimension data
            const sortedDims = [...mainDims].sort((a, b) => b.score - a.score);
            // Erősség-lista a kanonikus valencia-kapun át (self felület) — a
            // E 2026-08-11 óta itt sem erősség; ha nem marad ≥70-es
            // dimenzió, a strengthBullets a results.balancedProfile kulcsra
            // esik vissza (nincs üres felsorolás).
            const highDims = mainDims.filter(
              (d) => strengthSlotEligible(d.code, "self") && d.score >= 70,
            );
            const lowDims = mainDims.filter((d) => d.score < 40);
            // Pólus-tudatos watch-lista (FIX 2): a fordított Emocionalitás
            // alacsony sávja stabilitás (erőforrás), nem figyelendő terület.
            const watchDims = lowDims.filter((d) => deficitSlotEligible(d.code));

            // Közös forrásból (dimension-insights.ts) — results-oldallal és
            // persona-riport generátorral szinkronban (javítási terv P1.5).
            const strengthDescs = DIMENSION_STRENGTH_DESCS;
            const watchDescs = DIMENSION_WATCH_DESCS;
            const lang = locale;
            // Lapos profil (nincs ≥70 dimenzió): NEM mutatunk közepes sávú
            // dimenziókat „Erősségeid"-ként — a profileCharacter ugyanitt a
            // kiegyensúlyozott-profil szöveget adja, a kettő ellentmondott
            // (motor-audit v6, M4d). Ugyanaz a kulcs megy a bullet-helyre is,
            // így az Áttekintés-kártya nem állít hamis erősséget.
            const strengthBullets = highDims.length > 0
              ? highDims.map((d) => {
                  const desc = strengthDescs[d.code]?.[lang];
                  return desc ? `${d.label} — ${desc}` : d.label;
                })
              : [t("results.balancedProfile", locale)];
            const watchBullets = watchDims.length > 0
              ? watchDims.map((d) => {
                  const desc = watchDescs[d.code]?.[lang];
                  return desc ? `${d.label} — ${desc}` : d.label;
                })
              : [t("content.noLowDimension", locale)];

            // Profile character — kapuzott (FIX 2): „magas {dim}" csak
            // ténylegesen magas (≥70) dimenzióra megy ki, alatta a
            // kiegyensúlyozott-profil szöveg; a fejlődés-mondat csak valóban
            // alacsony (<40), NEM fordított dimenzióra (az alacsony E
            // stabilitás, nem fejlődési terület).
            const profileCharacter = (() => {
              const top2High = [...highDims]
                .sort((a, b) => b.score - a.score)
                .slice(0, 2);
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

            // Karrier-export: UGYANAZ a szerver-oldali eredmény, amit a
            // képernyő mutat (a v1-ben a PDF külön, observer és preferenciák
            // nélkül számolt, ezért más sorrendet adott).
            const career = (() => {
              if (careerModuleHidden || !careerResult) return undefined;
              const top = [
                ...careerResult.sections.atLevel.flat(),
                ...careerResult.sections.afterTraining.flat(),
              ].slice(0, 3);
              if (top.length === 0) return undefined;
              // „Leggyakoribb eltérés": dimenzió+irány szerinti számlálás a
              // top klasztereken (a CareerGrowthPlan.collectGaps szabályával
              // egyezően: count, holtversenynél összsúly dönt) — a korábbi
              // gaps[0] csupán az ELSŐ eltérés volt, nem a leggyakoribb.
              const gapBuckets = new Map<
                string,
                { dim: string; position: string; count: number; weight: number }
              >();
              for (const fit of careerResult.sections.atLevel.slice(0, 2).flat()) {
                for (const c of fit.components) {
                  if (c.position === "in" || c.weight < 0.15) continue;
                  const key = `${c.dim}:${c.position}`;
                  const existing = gapBuckets.get(key);
                  if (existing) {
                    existing.count += 1;
                    existing.weight += c.weight;
                  } else {
                    gapBuckets.set(key, {
                      dim: c.dim,
                      position: c.position,
                      count: 1,
                      weight: c.weight,
                    });
                  }
                }
              }
              const firstGap = [...gapBuckets.values()].sort(
                (a, b) => b.count - a.count || b.weight - a.weight,
              )[0];
              const dimLabel = (code: string) =>
                mainDims.find((d) => d.code === code)?.label ?? code;
              return {
                roles: top.map((fit) => ({
                  name: fit.hu,
                  // FEOR-megnevezés egyelőre nem jelenik meg (user-döntés)
                  industry: "",
                  score: fit.demandFit,
                  bandLow: fit.band.low,
                  bandHigh: fit.band.high,
                })),
                developNote: firstGap
                  ? isHu
                    ? `A top irányaidnál a leggyakoribb eltérés: ${dimLabel(firstGap.dim)} — a tipikus sáv ${firstGap.position === "under" ? "alatt" : "fölött"}.`
                    : `The most common gap across your top directions: ${dimLabel(firstGap.dim)} — ${firstGap.position === "under" ? "below" : "above"} the typical range.`
                  : undefined,
              };
            })();

            await downloadPdf({
              locale,
              userName: name,
              completedAt: new Date(assessmentDate).toLocaleDateString(
                isHu ? "hu-HU" : "en-GB",
                { year: "numeric", month: "long", day: "numeric" },
              ),
              personalityType: personalityType ?? "",
              heroInsight: heroInsight ?? "",
              // P5.6: storytelling-felütés a summary-oldalra. S3-hedge (FIX 5
              // + v6 F1): a kapu a címke-lefokozáséval AZONOS
              // (isSecondaryUncertain: top-pár VAGY 2–3. hely a mérési hibán
              // belül) — ilyenkor csak a főnévi karakterkép megy ki, a második
              // dimenziót színező mondat nem (a képernyő-címke is főnév-only).
              archetypeStory:
                sortedDims[0] && sortedDims[1]
                  ? buildArchetypeStory(
                      sortedDims[0].code,
                      isSecondaryUncertain(mainDims) ? null : sortedDims[1].code,
                      locale === "hu" ? "hu" : "en",
                    ) ?? undefined
                  : undefined,
              plan: accessLevel,
              strengthBullets,
              watchBullets,
              profileCharacter,
              topDimensions: highDims.map((d) => d.label),
              watchDimensions: watchDims.map((d) => d.label),
              altruism: (() => {
                const alt = dimensions.find((d) => d.code === "I");
                return alt ? { value: alt.score, description: alt.insight } : undefined;
              })(),
              career,
              dimensions: mainDims.map((d) => ({
                code: d.code,
                name: d.label,
                shortName:
                  hexLetter(d.code) ??
                  (d.label.length > 10 ? d.label.slice(0, 10) + "." : d.label),
                value: d.score,
                description: d.insight,
              })),
              ...((): { teamRoleRoles: { name: string; subtitle: string; score: number; rank: number; why?: string }[]; teamRoleEstimated: boolean } => {
                // A riport-felülettel egyezően a kanonikus precedencia-szabály
                // (team-role-estimate): a MÉRT kérdőíves eredmény az elsődleges,
                // TRITAN-becslés csak fallback (forrás-jelöléssel). Becslésnél
                // a PDF sáv-címkét mutat pontszám nélkül (P2.3).
                const hexScores = Object.fromEntries(mainDims.map((d) => [d.code, d.score]));
                const resolved = resolveDisplayRoleScores(teamRoleMeasuredScores, hexScores);
                // Részleges (örökség) score-sorból nincs becsült szerep — a
                // PDF-ben ilyenkor a szekció üresen marad.
                if (!resolved) {
                  return { teamRoleRoles: [], teamRoleEstimated: false };
                }
                const measured = resolved.source === "questionnaire";
                // exact átadva: a kerekített holtversenyt a nyers evidencia
                // dönti — így a PDF fő szerepe egyezik a többi felülettel.
                const top3 = getTopRoles(resolved.scores, 3, resolved.exact);
                // Forrás-címke a képernyős badge-dzsel azonos kulcsból — a PDF
                // és a felület ugyanazt mondja.
                const sourceLabel = measured
                  ? t("results.teamRoleSourceMeasured", locale)
                  : t("results.teamRoleSourceEstimate", locale);
                return {
                  teamRoleRoles: top3.map((r, i) => ({
                    name: TEAM_ROLES[r.role][locale === "hu" ? "hu" : "en"],
                    subtitle: i === 0 ? sourceLabel : "",
                    score: r.score,
                    rank: i,
                    // P5.3: indoklás csak becsült elsődleges szerepnél
                    why: i === 0 && !measured ? TEAM_ROLE_WHY[r.role][locale === "hu" ? "hu" : "en"] : undefined,
                  })),
                  teamRoleEstimated: !measured,
                };
              })(),
              plusContent: plusContent ? {
                howYouWorkParts: plusContent.howYouWorkParts,
                pressure: plusContent.pressure,
                pressureParts: plusContent.pressureParts,
                growthTip: plusContent.growthTip,
                growthPlan: plusContent.growthPlan,
                collaboration: plusContent.collaboration,
                roleFit: plusContent.roleFit,
                takeaways: plusContent.takeaways,
              } : undefined,
              // A facets tömb örökség-sorra üres (FIX 4) — koholt 0-facet
              // nem kerül a PDF-be; a code a pólus-tudatos jelölésekhez kell.
              facetDimensions: isPlus ? mainDims.map((d) => ({
                name: d.label,
                value: d.score,
                insight: d.insight,
                description: d.description,
                code: d.code,
                facets: d.facets,
              })) : undefined,
              // A reflect-oldal a felülettel azonos kapuzást követi: org-tagnál
              // csak a kampány-küszöb (min. 3) felett kerül a PDF-be.
              observerData:
                hasObserverData &&
                isPlus &&
                (!observerFlow ||
                  observerFlow.state === "self_serve" ||
                  observerFlow.state === "available") ? {
                count: observerCount,
                // Lefedetlen dimenzió (nincs observer-érték) kimarad — a
                // hiányzó külső adat nem „tökéletes egyezés".
                dimensions: mainDims.flatMap((d) =>
                  d.observerScore == null
                    ? []
                    : [{ name: d.label, self: d.score, observer: d.observerScore }],
                ),
                summaryPoints: [],
              } : undefined,
            });
          } finally {
            setPdfLoading(false);
          }
        }}
        pdfLoading={pdfLoading}
      />

      {publicSharingActive ? (
        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          initialToken={shareToken}
          initialHasShare={hasActiveShare}
          preview={{
            userName: name,
            personalityType: personalityType ?? t("content.personalityProfileFallback", locale),
            topDims: dimensions
              .filter((d) => d.code !== "I")
              .sort((a, b) => b.score - a.score)
              .slice(0, 2)
              .map((d) => ({ label: d.label, score: d.score })),
            glyphDimensions: dimensions
              .filter((d) => d.code !== "I")
              .map((d) => ({ code: d.code, score: d.score })),
          }}
        />
      ) : null}

      {/* A4: melyik eredmény-fület nézik — a kezdő fület is beleértve
          (a váltás-kezelő azt nem látná). */}
      <TabViewTracker surface="results" tab={activeTab} />

      <div
        key={activeTab}
        className="flex flex-col gap-10 md:gap-14"
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        {activeTab === "summary" && (
          <ProfileSummary
            dimensions={dimensions}
            plusContent={plusContent}
            bridgeNextStep={bridgeNextStep}
            observerFlow={observerFlow}
            sentInvitations={sentInvitations}
            observerCount={observerCount}
            hasObserverData={hasObserverData}
            experienceHints={experienceHints}
            experienceHintDestination={experienceHintDestination}
            interactionEntry={interactionEntry}
            personalityType={personalityType ?? t("content.personalityProfileFallback", locale)}
            clarityFeedbackSubmitted={clarityFeedbackSubmitted}
            onOpenDetails={() => handleTabChange("details")}
            onOpenComparison={() => handleTabChange("comparison")}
            locale={locale}
          />
        )}

        {/* A teljes riport három fejezetkártyában olvasható. A kártyafejlécek
            mindig látszanak, a szakmai tartalomból legfeljebb egy van nyitva. */}
        {activeTab === "details" && (
          <>
            <LinearReport
              initialSection={initialDetailChapter}
              locale={locale}
              onBack={() => handleTabChange("summary")}
              onSectionOpen={(section) => {
                const url = new URL(window.location.href);
                url.searchParams.set("tab", "details");
                url.searchParams.set("chapter", section);
                window.history.replaceState({}, "", url.pathname + url.search + url.hash);
                track("results.section_open", {
                  section: section === "dimensions" ? "dimensions" : section,
                });
              }}
              sections={[
                {
                  id: "overview",
                  title: t("results.reportOverviewTitle", locale),
                  question: t("results.reportOverviewQuestion", locale),
                  description: t("results.reportOverviewBody", locale),
                  content: (
                    <ResultsTab
                      chapter="overview"
                      dimensions={dimensions}
                      onOpenInvites={() => handleTabChange("comparison")}
                      isPlus={isPlus}
                      hasObserverData={hasObserverData}
                      locale={locale}
                      plusContent={plusContent}
                      observerFlow={observerFlow}
                    />
                  ),
                },
                {
                  id: "dimensions",
                  title: t("results.reportDimensionsTitle", locale),
                  question: t("results.reportDimensionsQuestion", locale),
                  description: t("results.reportDimensionsBody", locale),
                  content: (
                    <ResultsTab
                      chapter="dimensions"
                      dimensions={dimensions}
                      onOpenInvites={() => handleTabChange("comparison")}
                      isPlus={isPlus}
                      hasObserverData={hasObserverData}
                      locale={locale}
                      plusContent={plusContent}
                      observerFlow={observerFlow}
                    />
                  ),
                },
                {
                  id: "workstyle",
                  title: t("results.reportWorkstyleTitle", locale),
                  question: t("results.reportWorkstyleQuestion", locale),
                  description: t("results.reportWorkstyleBody", locale),
                  content: (
                    <WorkStyleTab
                      dimensions={dimensions}
                      growthFocusItems={growthFocusItems}
                      isPlus={isPlus}
                      locale={locale}
                      plusContent={plusContent}
                      teamRoleMeasuredScores={teamRoleMeasuredScores}
                      teamRolePeer={teamRolePeer}
                    />
                  ),
                },
              ]}
            />
            <FeedbackForm
              initialSubmitted={feedbackSubmitted}
              hasObserverFeedback={hasObserverData}
            />
          </>
        )}
        {activeTab === "comparison" && (
          <>
            <EditorialBackHeader
              onBack={() => handleTabChange("summary")}
              backLabel={t("results.reportBackToSummary", locale)}
              eyebrow={t("results.summaryComparisonTitle", locale)}
              title={
                hasObserverData
                  ? t("results.summaryComparisonReadyBody", locale)
                  : t("results.summaryComparisonStartBody", locale)
              }
              headingLevel={2}
              className="border-b border-[var(--color-border-soft)] pb-5"
            />

            {/* A külső nézőpont az összevetés és a meghívó-kezelés közös
                célfelülete. Org-tagnál az összevetés a kampányküszöbig zárva
                marad, futó körben viszont a meghívó-kezelő elérhető. */}
            {observerFlow && observerFlow.state === "locked" ? (
            // A #observer-flow horgonyra ugranak a kapcsolódó CTA-k.
            <div id="observer-flow" className="scroll-mt-24">
              <ObserverFlowStatusCard
                flow={{
                  state: observerFlow.state,
                  receivedCount: observerFlow.receivedCount,
                  minForReveal: observerFlow.minForReveal,
                  activeCampaignName: observerFlow.activeCampaignName,
                }}
                isHu={locale === "hu"}
              />
            </div>
            ) : observerFlow && observerFlow.state === "in_progress" ? (
            <>
              <div id="observer-flow" className="scroll-mt-24">
                <ObserverFlowStatusCard
                  flow={{
                    state: observerFlow.state,
                    receivedCount: observerFlow.receivedCount,
                    minForReveal: observerFlow.minForReveal,
                    activeCampaignName: observerFlow.activeCampaignName,
                  }}
                  isHu={locale === "hu"}
                />
              </div>
              <div id="invitations" className="scroll-mt-24">
                {/* B14: ebben az ágban state === "in_progress" → org-kontextus,
                    a meghívó-form címe a „külső meghívó" változatot kapja. */}
                <InvitationsTab
                  sentInvitations={sentInvitations}
                  receivedInvitations={receivedInvitations}
                  isPlus={isPlus}
                  minForReveal={observerFlow.minForReveal}
                  hasColleagueDirectory
                />
              </div>
            </>
            ) : isPlus ? (
            <>
              <ComparisonTabNew
                dimensions={dimensions}
                hasObserverData={hasObserverData}
                observerCount={observerCount}
                avgConfidence={avgObserverConfidence}
                selfFacetScores={selfFacetScores}
                observerFacetAverages={observerFacetAverages}
                facetSem={facetSem}
              />
              <div id="invitations" className="scroll-mt-24">
                {/* minForReveal a szerver-oldali kanonikus küszöbből
                    (observer-flow → anonimitás-padló) — a self-serve ág is
                    ezt kapja, hogy az info-banner ne mondjon mást, mint a
                    reveal-kapu (a korábbi kliens-default 2 volt, a kapu 3). */}
                <InvitationsTab
                  sentInvitations={sentInvitations}
                  receivedInvitations={receivedInvitations}
                  isPlus={isPlus}
                  minForReveal={observerFlow?.minForReveal}
                  hasColleagueDirectory={Boolean(
                    observerFlow && observerFlow.state !== "self_serve",
                  )}
                />
              </div>
            </>
            ) : (
            <TabPaywall
              tier="self_plus"
              tierLabel="Plus"
              price="€9"
              locale={locale}
              teaser={t("content.paywallComparisonTeaser", locale)}
            />
            )}
          </>
        )}
      </div>

    </div>
  );
}
