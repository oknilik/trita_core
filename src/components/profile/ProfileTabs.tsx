"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t, tf } from "@/lib/i18n";
import { dimColors } from "@/lib/color-system";
import type { Locale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { ProfileHero } from "@/components/results/ProfileHero";
import { ShareModal } from "@/components/results/ShareModal";
import { ProgressBar } from "@/components/results/ProgressBar";
import { UpgradeButton } from "./UpgradeButton";
import { FeedbackForm } from "@/components/dashboard/FeedbackForm";
import {
  ObserverFlowStatusCard,
  ObserverFlowStrip,
} from "@/components/results/ObserverFlowStatusCard";
import { getDimensionTier, tierColors } from "@/lib/dimension-utils";
import { TRITAN_ORDER, TRITAN_DIM_ABBR } from "@/lib/tritan";
import type { TritanDimCode } from "@/lib/tritan";
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
import { JourneyNextStepCard } from "@/components/journey/JourneyNextStepCard";
import { TypeGlyphPlate } from "@/components/type/TypeGlyphPlate";
import { SectionCta } from "@/components/results/SectionCta";
import { CAREER_MODULE_READY } from "@/lib/career/module-state";
import { Card } from "@/components/ui/primitives/Card";
import { GrowthFocus } from "@/components/profile/GrowthFocus";
import { DIMENSION_STRENGTH_DESCS, DIMENSION_WATCH_DESCS } from "@/lib/dimension-insights";
import { buildArchetypeStory, poleAwareDimensionLabel } from "@/lib/profile-content";
import { deficitSlotEligible, strengthSlotEligible } from "@/lib/score-valence";
import { isSecondaryUncertain } from "@/lib/personality-type";
import type { HowYouWorkParts } from "@/lib/workstyle-content";
import type { JourneyExperienceHints } from "@/lib/journey/types";
import { TabViewTracker } from "@/components/analytics/TabViewTracker";
import { track } from "@/lib/analytics/client";

type ProfileLevel = "start" | "plus";
type TabId = "results" | "workstyle" | "comparison" | "invites";

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
  initialTab: TabId;
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
  /** Hero-specific props (optional — defaults provided) */
  personalityType?: string;
  heroInsight?: string;
  /** Plus content sections */
  plusContent?: {
    introText: string;
    /** „Ahogy működsz" nevesített slotokkal (FIX 3): main = fő mintázat,
     *  watch = CSAK valódi risk-pár, context = a többi bekezdés. */
    howYouWorkParts: HowYouWorkParts;
    /** Kockázati tension-párok strukturáltan. */
    riskParts?: { summary: string; mitigation: string; source?: string }[];
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
    closingText: string;
  };
  bridgeNextStep?: BridgeNextStep;
  // Org-szintű kapcsoló (trita admin): karrier-fül + PDF karrier-blokk rejtése.
  careerModuleHidden?: boolean;
  /** Interakció-szimuláció: mind a 30 archetípus, szerver-oldalon számolva. */
  experienceHints?: JourneyExperienceHints;
  experienceHintDestination?: string;
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
}: ResultsTabProps) {
  const mainDims = dimensions.filter((d) => d.code !== "I");

  // Akkordeon a radar HEXACO-rendjében (H,E,X,A,C,O) — egyezik az
  // áttekintő listával; az első elem alapból nyitva.
  const accordionDims = TRITAN_ORDER
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

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      {/* 1. Áttekintés: radar + dimenzió-strip */}
      <section>
        <DashboardSectionHeader
          label={t("results.sectionOverview", locale)}
          className="mb-4"
        />
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
              {TRITAN_ORDER
                .map((code) => mainDims.find((d) => d.code === code))
                .filter((d): d is (typeof mainDims)[number] => Boolean(d))
                .map((d) => {
                  const tier = getDimensionTier(d.score);
                  const colors = tierColors[tier];
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
                          className={`shrink-0 rounded px-[7px] py-[2px] text-micro font-semibold ${colors.tagBg} ${colors.tagText}`}
                        >
                          {/* Pólus-tudatos címke: RESO alacsony sávja „stabil",
                              nem „figyelendő" (fordított skála, FIX 2). */}
                          {poleAwareDimensionLabel(d.code, d.score, locale)}
                        </span>
                        <span
                          className="w-8 shrink-0 text-right font-fraunces text-sm"
                          style={{ color: dimColors(d.code).strong }}
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

      {/* 2. Dimenziók részletesen — a legerősebb alapból nyitva */}
      <section>
        <DashboardSectionHeader
          label={t("results.sectionDimensions", locale)}
          className="mb-4"
        />
        <DimensionAccordion
          dimensions={accordionDims}
          showUpsell={!isPlus}
          defaultOpenIdx={0}
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
        <KeyTakeawaysSection
          paragraphs={plusContent.takeaways}
          closingText={plusContent.closingText}
          isUnlocked={true}
        />
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
  personalityType,
  heroInsight,
  plusContent,
  bridgeNextStep,
  careerModuleHidden = false,
  experienceHints,
  experienceHintDestination,
  careerResult = null,
  teamRoleMeasuredScores = null,
  teamRolePeer = null,
}: ProfileTabsProps) {
  const { locale: rawLocale } = useLocale();
  const locale = rawLocale as Locale;
  const router = useRouter();
  const tabBarRef = useRef<HTMLDivElement>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  // Görgethetőség-jelzés: él-fade csak akkor, ha arra még van tartalom.
  const [tabFade, setTabFade] = useState({ left: false, right: false });

  const updateTabFade = useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setTabFade({
      left: el.scrollLeft > 4,
      right: el.scrollLeft < maxScroll - 4,
    });
  }, []);

  useEffect(() => {
    updateTabFade();
    window.addEventListener("resize", updateTabFade);
    return () => window.removeEventListener("resize", updateTabFade);
  }, [updateTabFade]);

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

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

  // Az aktív tab a fül-sávon BELÜL középre kerül — csak vízszintesen.
  // Korábban scrollIntoView volt: az a LAPOT is görgette, hogy a fül-sáv
  // látszódjon, ezért mobilon minden betöltés/frissítés után az oldal
  // magától lecsúszott a fül-sáv fölötti blokkra. A scrollLeft-állítás
  // csak a vízszintes konténert mozgatja, a lap-görgetést nem érinti.
  useEffect(() => {
    const container = tabScrollRef.current;
    const el = container?.querySelector<HTMLButtonElement>(
      `button[data-tab-id="${activeTab}"]`,
    );
    if (!container || !el) return;
    const target = el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2;
    const left = Math.max(0, Math.min(target, container.scrollWidth - container.clientWidth));
    if (Math.abs(container.scrollLeft - left) < 2) return;
    container.scrollTo({ left, behavior: "smooth" });
  }, [activeTab]);

  const isHu = locale === "hu";
  const isPlus = accessLevel !== "start";
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const stageKeyMap: Record<string, string> = {
    SELF_COMPLETED: "content.stageSelfCompleted",
    OBSERVER_PENDING: "content.stageObserverPending",
    TEAM_NOT_JOINED: "content.stageTeamNotJoined",
    TEAM_PENDING_MEMBERS: "content.stageTeamPendingMembers",
    TEAM_PARTIAL: "content.stageTeamPartial",
    TEAM_READY: "content.stageTeamReady",
    ORG_PARTIAL: "content.stageOrgPartial",
    ORG_READY: "content.stageOrgReady",
    SELF_NOT_STARTED: "content.stageSelfNotStarted",
    SELF_IN_PROGRESS: "content.stageSelfInProgress",
  };
  const bridgeStageLabel = bridgeNextStep
    ? (stageKeyMap[bridgeNextStep.stage]
        ? t(stageKeyMap[bridgeNextStep.stage], locale)
        : t("content.bridgeFallbackStage", locale))
    : null;
  const shouldShowOrgExpansionPrompt = Boolean(experienceHints?.showOrgExpansionPrompt);
  const shouldShowAssessmentContinuation = Boolean(experienceHints?.showAssessmentContinuation);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      router.push(url.pathname + url.search, { scroll: false });
      setTimeout(() => {
        tabBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    },
    [router],
  );

  const ALL_TABS: { id: TabId; label: string; locked: boolean; icon: React.ReactNode }[] = [
    {
      id: "results",
      label: t("results.tabResults", locale),
      locked: false,
      icon: (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="8" />
          <path d="M10 2 L10 10 L16 6" />
          <circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      id: "comparison",
      label: t("results.tabComparison", locale),
      locked: !isPlus,
      icon: (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10h14M3 5h7M3 15h7M13 5l4 5-4 5" />
        </svg>
      ),
    },
  ];
  // A karrier-iránytű 2026-07-31 óta ÖNÁLLÓ oldal (`/career`) — a fülek közül
  // kikerült. A `careerModuleHidden` itt már csak a PDF karrier-blokkjára
  // vonatkozik (az oldal maga 404-et ad, ha az org kikapcsolta).
  const TABS = ALL_TABS;

  return (
    <div className="flex flex-col gap-8 md:gap-12">

      {/* Dark sage hero + a hozzá tapadó karakter-ábra fül — egy blokk,
          hogy a fül a banner alsó szélére üljön (a külső gap ne tolja el).
          A negatív alsó margó a fül alatti térközt szedi vissza: a fül a
          bannerhez tartozik, nem önálló szekció. */}
      {/* -mb-3: a jelzés ~11 px-t lóg a banner alá, ezt vesszük vissza, hogy
          a hero ALSÓ SZÉLÉTŐL mért térköz ugyanannyi legyen, mint az oldal
          többi blokkja között (gap-8 / md:gap-12). */}
      <div className="-mb-3 flex flex-col">
      {/* A hero a fül és a panel FELETT van (z-20), így a fül teteje alá
          csúszik, a panel pedig alóla gördül ki. */}
      <div className="relative z-20">
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
        // Erősség-lista önismereti felületen: a kanonikus valencia-kapun át
        // (score-valence, surface="self"). 2026-08-11 óta a RESO itt sem
        // erősség — a kapu zárja; üres listánál a ProfileHero nem rendereli
        // a chip-sort, így nem marad árva „Legerősebb:" felirat.
        topDimensions={dimensions
          .filter((d) => d.code !== "I" && strengthSlotEligible(d.code, "self") && d.score >= 70)
          .map((d) => d.label)}
        // Pólus-tudatos „Figyelendő" (FIX 2): a fordított Emocionalitás
        // alacsony sávja stabilitás — nem kerül a watch-chipek közé
        // (kanonikus kapu: score-valence.deficitSlotEligible).
        watchDimensions={dimensions
          .filter((d) => d.code !== "I" && deficitSlotEligible(d.code) && d.score < 40)
          .map((d) => d.label)}
        onShare={() => {
          track("results.export", { format: "link" });
          setShareOpen(true);
        }}
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
              const i = (TRITAN_ORDER as readonly string[]).indexOf(code);
              return i === -1 ? TRITAN_ORDER.length : i;
            };
            const mainDims = dimensions
              .filter((d) => d.code !== "I")
              .sort((a, b) => tritanIndex(a.code) - tritanIndex(b.code));
            // Build bullet-based insights from dimension data
            const sortedDims = [...mainDims].sort((a, b) => b.score - a.score);
            // Erősség-lista a kanonikus valencia-kapun át (self felület) — a
            // RESO 2026-08-11 óta itt sem erősség; ha nem marad ≥70-es
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
            // alacsony (<40), NEM fordított dimenzióra (az alacsony RESO
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
                  TRITAN_DIM_ABBR[d.code as TritanDimCode]?.[isHu ? "hu" : "en"] ??
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
                closingText: plusContent.closingText,
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
      </div>

      {/* Karakter-ábra magyarázat — a banner alsó szélére ülő kis fül;
          nyitva a teljes kompozíció + a nyelvtan a hero alatt jelenik meg. */}
      <TypeGlyphPlate
        mode="heroTab"
        dimensions={dimensions
          .filter((d) => d.code !== "I")
          .map((d) => ({ code: d.code, score: d.score }))}
        locale={locale}
      />
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
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

      {/* Progress bar — org-tagnál a lépés-sáv helyett állapot-csík: a saját
          út a kitöltéssel kész, az observer csapat-folyamat (nem hiány). */}
      {observerFlow && observerFlow.state !== "self_serve" ? (
        <ObserverFlowStrip
          flow={{
            state: observerFlow.state,
            receivedCount: observerFlow.receivedCount,
            minForReveal: observerFlow.minForReveal,
            activeCampaignName: observerFlow.activeCampaignName,
          }}
          isHu={locale === "hu"}
          onOpenInvites={() => handleTabChange("comparison")}
          onOpenComparison={() => handleTabChange("comparison")}
        />
      ) : (
        <ProgressBar
          hasSelfPlus={isPlus}
          observersSent={sentInvitations.length > 0}
          observersCompleted={hasObserverData}
          sentCount={sentInvitations.length}
          receivedCount={observerCount}
          onNavigateToComparison={() => handleTabChange("comparison")}
          onNavigateToInvites={() => handleTabChange("comparison")}
        />
      )}

      {/* Tab bar — pill style */}
      <div
        ref={tabBarRef}
        className="relative scroll-mt-24 rounded-xl border-[1.5px] border-[var(--color-border-default)] bg-surface-card"
      >
        {/* Él-fade jelzők — csak ott, ahol még van elgörgetett tartalom */}
        {tabFade.left && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 rounded-l-xl bg-gradient-to-r from-[var(--color-surface-card)] to-transparent" />
        )}
        {tabFade.right && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 rounded-r-xl bg-gradient-to-l from-[var(--color-surface-card)] to-transparent" />
        )}
        <div
          ref={tabScrollRef}
          onScroll={updateTabFade}
          className="flex snap-x overflow-x-auto rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Profile navigation"
        >
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={[
              // Mobilon természetes szélesség + vízszintes görgetés; md-től
              // egyenlő oszlopok. A felirat sosem törik/csonkul.
              "flex min-h-[48px] flex-none shrink-0 snap-start items-center justify-center gap-1.5 whitespace-nowrap px-4 py-3 text-center text-xs font-medium transition-all md:flex-1 md:px-3",
              i < TABS.length - 1 && "border-r border-[var(--color-border-default)]",
              activeTab === tab.id
                ? "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)]"
                : "bg-surface-card text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]",
            ].filter(Boolean).join(" ")}
          >
            {tab.locked ? (
              <svg viewBox="0 0 12 14" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="6" width="10" height="7" rx="1.5" />
                <path d="M3 6V4a3 3 0 0 1 6 0v2" />
              </svg>
            ) : tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
        </div>
      </div>

      {/* A4: melyik eredmény-fület nézik — a kezdő fület is beleértve
          (a váltás-kezelő azt nem látná). */}
      <TabViewTracker surface="results" tab={activeTab} />

      {/* Tab content */}
      <div
        key={activeTab}
        className="flex flex-col gap-10 md:gap-14"
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        {/* Fül-dieta (UX-audit #22): a Munkastílus az Eredmények folytatása —
            egy fülön, szekcióként; a Meghívók a Külső kép fül része. */}
        {activeTab === "results" && (
          <>
            <ResultsTab
              dimensions={dimensions}
              onOpenInvites={() => handleTabChange("comparison")}
              isPlus={isPlus}
              hasObserverData={hasObserverData}
              locale={locale}
              plusContent={plusContent}
              observerFlow={observerFlow}
            />
            <WorkStyleTab
              dimensions={dimensions}
              growthFocusItems={growthFocusItems}
              isPlus={isPlus}
              locale={locale}
              plusContent={plusContent}
              teamRoleMeasuredScores={teamRoleMeasuredScores}
              teamRolePeer={teamRolePeer}
            />
            {/* Átvezetők a különvált modulokra. A riport végén állnak: aki
                idáig eljutott, annak ez a következő logikus lépés. */}
            <div className="flex flex-col gap-3">
              <SectionCta
                eyebrow={t("results.ctaInteractionEyebrow", locale)}
                title={t("results.ctaInteractionTitle", locale)}
                body={t("results.ctaInteractionBody", locale)}
                cta={t("results.ctaInteractionButton", locale)}
                href="/interaction"
                motif="pair"
              />
              {/* A karrier-átvezető két alakot vehet fel: kész modulnál a
                  működő iránytűre visz, amíg nincs kész, a kereslet-mérő
                  oldalra. A `from=results` a mérésben a belépési pontot
                  jelöli — a riportból érkező szándéka mást ér, mint a
                  közvetlen látogatóé. */}
              {!careerModuleHidden &&
                (CAREER_MODULE_READY ? (
                  <SectionCta
                    eyebrow={t("results.ctaCareerEyebrow", locale)}
                    title={t("results.ctaCareerTitle", locale)}
                    body={t("results.ctaCareerBody", locale)}
                    cta={t("results.ctaCareerButton", locale)}
                    href="/career"
                    motif="compass"
                  />
                ) : (
                  <SectionCta
                    eyebrow={t("fakeDoor.badge", locale)}
                    title={t("fakeDoor.ctaTitle", locale)}
                    body={t("fakeDoor.ctaBody", locale)}
                    cta={t("fakeDoor.ctaButton", locale)}
                    href="/career?from=results"
                    motif="compass"
                  />
                ))}
            </div>
          </>
        )}
        {activeTab === "comparison" && (
          // „Külső kép" (UX-audit #22): az összevetés ÉS a meghívó-kezelés egy
          // folyamat két fele — egy fülön. Org-tagnál az összevetés a kampány-
          // küszöbig zárva: állapot-kártya (nem hiány-nyelv). FONTOS
          // (2026-07-29 fix): a külső adat kampányban IS a user meghívóiból
          // érkezik — futó observer-körnél a meghívó-kezelő ITT jelenik meg,
          // enélkül a tag senkit sem tudna felkérni.
          observerFlow && observerFlow.state === "locked" ? (
            // A #observer-flow horgonyra ugranak a „Meghívók kezelése" CTA-k
            // (csapat-banner, tag-nézet) — scroll-mt a fejléc alá csúszás ellen.
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
          )
        )}
      </div>

      {/* Journey bridge CTA — a következő lépés kártyája (UX-audit B3):
          minden módban renderel. A journey-engine consulting-led alatt már
          consulting-tudatos CTA-t ad (a self-serve CREATE_TEAM observer-
          irányra átképezve), upgrade/checkout felületre nem mutat. */}
      {bridgeNextStep ? (
        <div className="space-y-3">
          <JourneyNextStepCard
            eyebrow={t("content.bridgeEyebrow", locale)}
            title={bridgeStageLabel
              ? `${t("content.bridgeJourney", locale)} · ${bridgeStageLabel}`
              : t("content.bridgeJourney", locale)}
            description={bridgeNextStep.explanation}
            primary={bridgeNextStep.primary}
            secondary={bridgeNextStep.secondary}
          />

          {shouldShowOrgExpansionPrompt ? (
            <Card spacing="sm" className="rounded-xl px-4 py-3">
              <p className="text-[12px] leading-relaxed text-ink-body">
                {locale === "hu"
                  ? "Van függő szervezeti meghívásod. Ha szeretnéd, most kiterjesztheted a személyes utadat csapat- és szervezeti nézetre."
                  : "You have a pending organization invite. If you want, you can now extend your personal journey to team and org views."}{" "}
                <Link
                  href={experienceHintDestination ?? "/profile/results"}
                  className="font-semibold text-[var(--color-accent-primary-strong)] no-underline transition-colors hover:text-bronze-dark"
                >
                  {locale === "hu" ? "Meghívás megnyitása" : "Open invite"} →
                </Link>
              </p>
            </Card>
          ) : null}

          {shouldShowAssessmentContinuation ? (
            <Card spacing="sm" className="rounded-xl px-4 py-3">
              <p className="text-[12px] leading-relaxed text-ink-body">
                {locale === "hu"
                  ? "A self assessmented még folyamatban van. Folytasd ott, ahol abbahagytad."
                  : "Your self assessment is still in progress. Continue where you left off."}{" "}
                <Link
                  href="/assessment"
                  className="font-semibold text-[var(--color-accent-primary-strong)] no-underline transition-colors hover:text-bronze-dark"
                >
                  {locale === "hu" ? "Folytatás" : "Continue"} →
                </Link>
              </p>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Elégedettség-visszajelzés — egyszer, az oldal alján */}
      <FeedbackForm
        initialSubmitted={feedbackSubmitted}
        hasObserverFeedback={hasObserverData}
      />
    </div>
  );
}
