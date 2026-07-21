"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { ProfileHero } from "@/components/results/ProfileHero";
import { ProgressBar } from "@/components/results/ProgressBar";
import { InsightPair } from "@/components/results/InsightPair";
import { UpgradeButton } from "./UpgradeButton";
import { FeedbackForm } from "@/components/dashboard/FeedbackForm";
import { getDimensionTier, getDimensionLabel, tierColors } from "@/lib/dimension-utils";
import { DimensionAccordion } from "@/components/results/DimensionAccordion";
import { TeamRoles } from "@/components/results/TeamRoles";
import { InlineUpsell } from "@/components/results/InlineUpsell";
import { isConsultingLed } from "@/lib/operating-mode";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";
import { CareerCompass } from "@/components/results/CareerCompass";
import type { CareerBackground } from "@/lib/industry-fit";
import { LockedPreview } from "@/components/results/LockedPreview";
import { HowYouWorkSection } from "@/components/results/HowYouWorkSection";
import { IdealEnvironmentSection } from "@/components/results/IdealEnvironmentSection";
import { RoleFitSection } from "@/components/results/RoleFitSection";
import { KeyTakeawaysSection } from "@/components/results/KeyTakeawaysSection";
import { InvitationsTab } from "@/components/results/InvitationsTab";
import { AltruismCard } from "@/components/results/AltruismCard";
import { ComparisonTab as ComparisonTabNew } from "@/components/results/ComparisonTab";
import { JourneyNextStepCard } from "@/components/journey/JourneyNextStepCard";
import { Card } from "@/components/ui/primitives/Card";
import type { JourneyExperienceHints } from "@/lib/journey/types";

type ProfileLevel = "start" | "plus";
type TabId = "results" | "workstyle" | "career" | "comparison" | "invites";

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
  aspects: { code: string; label: string; score: number }[];
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
  completedAt: string | null;
  observerEmail: string | null;
  observerName?: string | null;
  observerType?: string;
  relationship: string | null;
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
  assessmentResultId: string;
  dimensions: SerializedDimension[];
  growthFocusItems: SerializedGrowthItem[];
  hasObserverData: boolean;
  observerCount: number;
  sentInvitations: SerializedSentInvitation[];
  receivedInvitations: SerializedReceivedInvitation[];
  feedbackSubmitted: boolean;
  hasDraft: boolean;
  draftAnsweredCount: number;
  draftTotalQuestions: number;
  pendingInvitesCount: number;
  /** Hero-specific props (optional — defaults provided) */
  personalityType?: string;
  percentile?: string;
  heroInsight?: string;
  /** InsightPair props */
  strengths?: string;
  watchAreas?: string;
  /** Plus content sections */
  plusContent?: {
    introText: string;
    howYouWork: string[];
    envItems: { label: string; value: string }[];
    roleFit: { strong: string; might: string; prep: string; strongRoles?: string[]; mightRoles?: string[]; prepRoles?: string[] };
    takeaways: string[];
    closingText: string;
  };
  bridgeNextStep?: BridgeNextStep;
  hasTeamOrOrgMembership?: boolean;
  experienceHints?: JourneyExperienceHints;
  experienceHintDestination?: string;
  careerBackground?: CareerBackground | null;
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
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-sand bg-white px-6 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sand bg-cream">
        <LockIcon />
      </div>
      <div className="max-w-sm">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
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
  onOpenInvites,
}: ResultsTabProps) {
  const mainDims = dimensions.filter((d) => d.code !== "I");

  // Akkordeon a radar TRITAN-rendjében (X,E,H,C,A,O) — egyezik az
  // áttekintő listával; az első elem alapból nyitva.
  const accordionDims = (["TEMP", "RESO", "INTE", "THOR", "ADAP", "OPEN"] as const)
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
            <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--color-border-soft)] bg-white p-4">
              {/* Sorrend = a radar TRITAN-rendje (T·R·I·T·A·N), a színek és
                  az értékek a dimenzió-színt viselik — alacsony szintnél is
                  jól láthatóan. */}
              {(["TEMP", "RESO", "INTE", "THOR", "ADAP", "OPEN"] as const)
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
                          className={`shrink-0 rounded px-[7px] py-[2px] text-[8px] font-semibold ${colors.tagBg} ${colors.tagText}`}
                        >
                          {getDimensionLabel(d.score, locale)}
                        </span>
                        <span
                          className="w-8 shrink-0 text-right font-fraunces text-sm"
                          style={{ color: d.color }}
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
            <p className="mt-3 text-[10px] leading-relaxed text-[var(--color-text-muted)]">
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

      {/* Observer kontextus-CTA — ha még nincs külső visszajelzés */}
      {!hasObserverData && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-5">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {t("results.observerCtaTitle", locale)}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              {t("results.observerCtaBody", locale)}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenInvites}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark"
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
  isPlus,
  locale,
  plusContent,
}: {
  dimensions: SerializedDimension[];
  isPlus: boolean;
  locale: Locale;
  plusContent?: ProfileTabsProps["plusContent"];
}) {
  const mainDims = dimensions.filter((d) => d.code !== "I");

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      {isPlus && plusContent && (
        <>
          <HowYouWorkSection
            paragraphs={plusContent.howYouWork}
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
        />
      </section>
    </div>
  );
}

// „Merre tovább?" — Karrier-iránytű, a fejlődési terv az eredménybe integrálva.
function CareerTab({
  dimensions,
  growthFocusItems,
  hasObserverData,
  careerBackground,
  locale,
  onOpenInvites,
}: {
  dimensions: SerializedDimension[];
  growthFocusItems: SerializedGrowthItem[];
  hasObserverData: boolean;
  careerBackground: CareerBackground | null;
  locale: Locale;
  onOpenInvites: () => void;
}) {
  const mainDims = dimensions.filter((d) => d.code !== "I");

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <section>
        <DashboardSectionHeader
          label={t("results.ccTitle", locale)}
          className="mb-4"
        />
        <CareerCompass
          scores={Object.fromEntries(mainDims.map((d) => [d.code, d.score]))}
          observerScores={
            hasObserverData
              ? Object.fromEntries(
                  mainDims
                    .filter((d) => typeof d.observerScore === "number")
                    .map((d) => [d.code, d.observerScore as number]),
                )
              : null
          }
          initialBackground={careerBackground}
          growthFocusItems={growthFocusItems}
          onRequestObserver={onOpenInvites}
        />
      </section>
    </div>
  );
}


// ─── Main component ─────────────────────────────────────────────────────────

export function ProfileTabs({
  name,
  assessmentDate,
  accessLevel,
  initialTab,
  assessmentResultId,
  dimensions,
  growthFocusItems,
  hasObserverData,
  observerCount,
  sentInvitations,
  receivedInvitations,
  feedbackSubmitted,
  hasDraft,
  draftAnsweredCount,
  draftTotalQuestions,
  pendingInvitesCount,
  personalityType,
  percentile,
  heroInsight,
  strengths,
  watchAreas,
  plusContent,
  bridgeNextStep,
  hasTeamOrOrgMembership = false,
  experienceHints,
  experienceHintDestination,
  careerBackground = null,
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

  // Az aktív tab úszik be a látótérbe (mount + tab-váltás).
  useEffect(() => {
    const el = tabScrollRef.current?.querySelector<HTMLButtonElement>(
      `button[data-tab-id="${activeTab}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeTab]);

  const isHu = locale === "hu";
  const isPlus = accessLevel !== "start";
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

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
  // Consulting-led módban a „Csapat/szervezet indítása" gyorslink
  // (self-serve onboarding) rejtve — a terelést az érdeklődés-banner végzi.
  const shouldShowTeamShortcut = bridgeNextStep
    ? !isConsultingLed() &&
      !hasTeamOrOrgMembership &&
      (bridgeNextStep.stage === "SELF_COMPLETED" || bridgeNextStep.stage === "OBSERVER_PENDING")
    : false;
  const shouldShowOrgExpansionPrompt = Boolean(experienceHints?.showOrgExpansionPrompt);
  // Consulting-led módban a self-serve csapat-létrehozó banner nem jelenik
  // meg — helyette az eredmény-oldal alján lévő érdeklődés-banner terel.
  const shouldShowTeamCreationBanner = Boolean(
    !isConsultingLed() &&
      experienceHints?.showTeamCreationBanner &&
      !hasTeamOrOrgMembership,
  );
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

  const TABS: { id: TabId; label: string; locked: boolean; icon: React.ReactNode }[] = [
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
      id: "workstyle",
      label: t("results.tabWorkstyle", locale),
      locked: false,
      icon: (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="14" height="10" rx="1.5" />
          <path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h3A1.5 1.5 0 0 1 13 4.5V6M3 10.5h14" />
        </svg>
      ),
    },
    {
      id: "career",
      label: t("results.tabCareer", locale),
      locked: false,
      icon: (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="8" />
          <path d="M13 7l-2 5-4 1 2-5 4-1z" />
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
    {
      id: "invites",
      label: t("results.tabInvites", locale),
      locked: !isPlus,
      icon: (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="7" r="3" />
          <path d="M1 17c0-3.3 2.7-6 6-6" />
          <path d="M13 11v6M10 14h6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8 md:gap-12">

      {/* Dark sage hero */}
      <ProfileHero
        userName={name}
        completedAt={new Date(assessmentDate).toLocaleDateString(
          isHu ? "hu-HU" : "en-GB",
          { year: "numeric", month: "long", day: "numeric" },
        )}
        personalityType={personalityType ?? t("content.personalityProfileFallback", locale)}
        percentile={percentile ?? ""}
        insight={heroInsight ?? ""}
        accessLevel={accessLevel}
        topDimensions={dimensions.filter((d) => d.code !== "I" && d.score >= 70).map((d) => d.label)}
        watchDimensions={dimensions.filter((d) => d.code !== "I" && d.score < 40).map((d) => d.label)}
        onShare={async () => {
          setShareLoading(true);
          try {
            const res = await fetch("/api/profile/share", { method: "POST" });
            const data = await res.json();
            if (data.token) {
              const url = `${window.location.origin}/share/${data.token}`;
              await navigator.clipboard.writeText(url);
              alert(t("content.shareLinkCopied", locale));
            }
          } catch {
            alert(t("content.shareError", locale));
          } finally {
            setShareLoading(false);
          }
        }}
        shareLoading={shareLoading}
        onDownloadPdf={async () => {
          setPdfLoading(true);
          try {
            const { downloadPdf } = await import("@/components/pdf/TritaPdf");
            const mainDims = dimensions.filter((d) => d.code !== "I");
            // Build bullet-based insights from dimension data
            const sortedDims = [...mainDims].sort((a, b) => b.score - a.score);
            const highDims = mainDims.filter((d) => d.score >= 70);
            const lowDims = mainDims.filter((d) => d.score < 40);

            const strengthDescs: Record<string, { hu: string; en: string }> = {
              "INTE": { hu: "hiteles, manipulációmentes", en: "authentic, manipulation-free" },
              "RESO": { hu: "erős empátia, mély kapcsolódás", en: "strong empathy, deep connection" },
              "TEMP": { hu: "inspiráló, energikus jelenlét", en: "inspiring, energetic presence" },
              "ADAP": { hu: "megbocsátó, rugalmas, türelmes", en: "forgiving, flexible, patient" },
              "THOR": { hu: "szervezettség, kitartás, pontosság", en: "organized, persistent, precise" },
              "OPEN": { hu: "kísérletező, stratégiai gondolkodó", en: "experimental, strategic thinker" },
            };
            const watchDescs: Record<string, { hu: string; en: string }> = {
              "INTE": { hu: "státuszorientáltabb, versengőbb", en: "more status-oriented, competitive" },
              "RESO": { hu: "érzelmileg távolabb, kevesebb empátia", en: "emotionally distant, less empathy" },
              "TEMP": { hu: "kisebb társas láthatóság, visszahúzódóbb", en: "lower social visibility, more reserved" },
              "ADAP": { hu: "élesebb reakciók konfliktusban", en: "sharper reactions in conflict" },
              "THOR": { hu: "kevésbé szervezett, rugalmasabb", en: "less organized, more flexible" },
              "OPEN": { hu: "bevált módszereket preferálja", en: "prefers established methods" },
            };
            const lang = locale;
            const strengthBullets = highDims.length > 0
              ? highDims.map((d) => {
                  const desc = strengthDescs[d.code]?.[lang];
                  return desc ? `${d.label} — ${desc}` : d.label;
                })
              : sortedDims.slice(0, 2).map((d) => {
                  const desc = strengthDescs[d.code]?.[lang];
                  return desc ? `${d.label} — ${desc}` : d.label;
                });
            const watchBullets = lowDims.length > 0
              ? lowDims.map((d) => {
                  const desc = watchDescs[d.code]?.[lang];
                  return desc ? `${d.label} — ${desc}` : d.label;
                })
              : [t("content.noLowDimension", locale)];

            // Profile character
            const profileCharacter = (() => {
              const top2 = sortedDims.slice(0, 2);
              const bottom = sortedDims[sortedDims.length - 1];
              if (!top2[0] || !bottom) return "";
              const top2Suffix = top2[1]
                ? tf("content.profileCharacterTop2Suffix", locale, { label: top2[1].label.toLowerCase() })
                : "";
              return tf("content.profileCharacterHu", locale, {
                top1: top2[0].label.toLowerCase(),
                top2Suffix,
                bottom: bottom.label,
              });
            })();

            // Workplace / risk insights for Plus callouts
            const workplaceInsight = plusContent?.howYouWork[0] ?? "";
            const riskInsight = plusContent?.howYouWork[1] ?? "";

            await downloadPdf({
              locale,
              userName: name,
              completedAt: new Date(assessmentDate).toLocaleDateString(
                isHu ? "hu-HU" : "en-GB",
                { year: "numeric", month: "long", day: "numeric" },
              ),
              personalityType: personalityType ?? "",
              percentile: percentile ?? "",
              heroInsight: heroInsight ?? "",
              plan: accessLevel,
              strengths: strengths ?? "",
              watchAreas: watchAreas ?? "",
              strengthBullets,
              watchBullets,
              profileCharacter,
              topDimensions: highDims.map((d) => d.label),
              watchDimensions: lowDims.map((d) => d.label),
              altruism: (() => {
                const alt = dimensions.find((d) => d.code === "I");
                return alt ? { value: alt.score, description: alt.insight } : undefined;
              })(),
              workplaceInsight,
              riskInsight,
              dimensions: mainDims.map((d) => ({
                name: d.label,
                shortName: d.label.length > 10 ? d.label.slice(0, 10) + "." : d.label,
                value: d.score,
                description: d.insight,
              })),
              teamRoleRoles: (() => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  const { estimateTeamRolesFromTritan } = require("@/lib/team-role-estimate");
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  const { TEAM_ROLES, getTopRoles } = require("@/lib/team-role-scoring");
                  const hexScores = Object.fromEntries(mainDims.map((d) => [d.code, d.score]));
                  if (!("INTE" in hexScores) || !("TEMP" in hexScores)) return [];
                  const estimated = estimateTeamRolesFromTritan(hexScores);
                  const top3 = getTopRoles(estimated, 3);
                  return top3.map((r: { role: string; score: number }, i: number) => ({
                    name: TEAM_ROLES[r.role][locale === "hu" ? "hu" : "en"],
                    subtitle: "",
                    score: r.score,
                    rank: i,
                  }));
                } catch { return []; }
              })(),
              plusContent: plusContent ? {
                howYouWork: plusContent.howYouWork,
                roleFit: plusContent.roleFit,
                takeaways: plusContent.takeaways,
                closingText: plusContent.closingText,
              } : undefined,
              facetDimensions: isPlus ? mainDims.map((d) => ({
                name: d.label,
                value: d.score,
                insight: d.insight,
                description: d.description,
                facets: d.facets,
              })) : undefined,
              observerData: hasObserverData && isPlus ? {
                count: observerCount,
                dimensions: mainDims.map((d) => ({
                  name: d.label,
                  self: d.score,
                  observer: d.observerScore ?? d.score,
                })),
                summaryPoints: [],
              } : undefined,
            });
          } finally {
            setPdfLoading(false);
          }
        }}
        pdfLoading={pdfLoading}
      />

      {/* Progress bar */}
      <ProgressBar
        hasSelfPlus={isPlus}
        observersSent={sentInvitations.length > 0}
        observersCompleted={hasObserverData}
        sentCount={sentInvitations.length}
        receivedCount={observerCount}
        onNavigateToComparison={() => handleTabChange("comparison")}
        onNavigateToInvites={() => handleTabChange("invites")}
      />

      {/* Insight pair */}
      {strengths && watchAreas && (
        <InsightPair
          strengths={(() => {
            const mainDims = dimensions.filter((d) => d.code !== "I");
            const high = mainDims.filter((d) => d.score >= 70);
            if (high.length === 0) {
              const top2 = [...mainDims].sort((a, b) => b.score - a.score).slice(0, 2);
              return top2.map((d) => ({ dimension: d.label, text: d.insight }));
            }
            return high.map((d) => ({ dimension: d.label, text: d.insight }));
          })()}
          watchAreas={(() => {
            const mainDims = dimensions.filter((d) => d.code !== "I");
            const low = mainDims.filter((d) => d.score < 40);
            if (low.length === 0) return [{ text: t("content.noLowDimension", locale) }];
            return low.map((d) => ({ dimension: d.label, text: d.insight }));
          })()}
        />
      )}

      {/* Tab bar — pill style */}
      <div
        ref={tabBarRef}
        className="relative scroll-mt-24 rounded-xl border-[1.5px] border-[var(--color-border-default)] bg-white"
      >
        {/* Él-fade jelzők — csak ott, ahol még van elgörgetett tartalom */}
        {tabFade.left && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 rounded-l-xl bg-gradient-to-r from-white to-transparent" />
        )}
        {tabFade.right && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 rounded-r-xl bg-gradient-to-l from-white to-transparent" />
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
                ? "bg-[var(--color-action-primary-bg)] text-white"
                : "bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]",
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

      {/* Tab content */}
      <div
        key={activeTab}
        className="flex flex-col gap-10 md:gap-14"
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        {activeTab === "results" && (
          <ResultsTab
            dimensions={dimensions}
            onOpenInvites={() => handleTabChange("invites")}
            isPlus={isPlus}
            hasObserverData={hasObserverData}
            locale={locale}
            plusContent={plusContent}
          />
        )}
        {activeTab === "workstyle" && (
          <WorkStyleTab
            dimensions={dimensions}
            isPlus={isPlus}
            locale={locale}
            plusContent={plusContent}
          />
        )}
        {activeTab === "career" && (
          <CareerTab
            dimensions={dimensions}
            growthFocusItems={growthFocusItems}
            hasObserverData={hasObserverData}
            careerBackground={careerBackground}
            locale={locale}
            onOpenInvites={() => handleTabChange("invites")}
          />
        )}
        {activeTab === "comparison" && (
          isPlus ? (
            <ComparisonTabNew
              dimensions={dimensions}
              hasObserverData={hasObserverData}
              observerCount={observerCount}
            />
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
        {activeTab === "invites" && (
          <InvitationsTab
            sentInvitations={sentInvitations}
            receivedInvitations={receivedInvitations}
            isPlus={isPlus}
          />
        )}
      </div>

      {/* Journey bridge CTA — csak self-serve módban; consulting-led alatt az
          eredményoldal kontextuális CTA-i (observer-CTA, érdeklődés-banner)
          terelnek, a generikus journey-kártya duplikáció lenne. A hasznos
          jelzés-kártyák (függő org-meghívó, félbehagyott teszt) maradnak. */}
      {bridgeNextStep ? (
        <div className="space-y-3">
          {!isConsultingLed() ? (
            <JourneyNextStepCard
              eyebrow={t("content.bridgeEyebrow", locale)}
              title={bridgeStageLabel
                ? `${t("content.bridgeJourney", locale)} · ${bridgeStageLabel}`
                : t("content.bridgeJourney", locale)}
              description={bridgeNextStep.explanation}
              primary={bridgeNextStep.primary}
              secondary={bridgeNextStep.secondary}
            />
          ) : null}

          {shouldShowTeamShortcut ? (
            <Card spacing="sm" className="rounded-xl px-4 py-3">
              <p className="text-[12px] leading-relaxed text-ink-body">
                {t("content.bridgeOptionalTeamHint", locale)}{" "}
                <Link
                  href="/onboarding?intent=team"
                  className="font-semibold text-bronze no-underline transition-colors hover:text-bronze-dark"
                >
                  {t("content.bridgeOptionalTeamCta", locale)} →
                </Link>
              </p>
            </Card>
          ) : null}

          {shouldShowOrgExpansionPrompt ? (
            <Card spacing="sm" className="rounded-xl px-4 py-3">
              <p className="text-[12px] leading-relaxed text-ink-body">
                {locale === "hu"
                  ? "Van függő szervezeti meghívásod. Ha szeretnéd, most kiterjesztheted a személyes utadat csapat- és szervezeti nézetre."
                  : "You have a pending organization invite. If you want, you can now extend your personal journey to team and org views."}{" "}
                <Link
                  href={experienceHintDestination ?? "/profile/results"}
                  className="font-semibold text-bronze no-underline transition-colors hover:text-bronze-dark"
                >
                  {locale === "hu" ? "Meghívás megnyitása" : "Open invite"} →
                </Link>
              </p>
            </Card>
          ) : null}

          {shouldShowTeamCreationBanner ? (
            <Card spacing="sm" className="rounded-xl px-4 py-3">
              <p className="text-[12px] leading-relaxed text-ink-body">
                {locale === "hu"
                  ? "Team fókuszt választottál. Ha szeretnéd, indítsd el most az első csapatod."
                  : "You selected a team-focused path. If you want, start your first team now."}{" "}
                <Link
                  href="/onboarding?intent=team"
                  className="font-semibold text-bronze no-underline transition-colors hover:text-bronze-dark"
                >
                  {locale === "hu" ? "Csapat létrehozása" : "Create a team"} →
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
                  className="font-semibold text-bronze no-underline transition-colors hover:text-bronze-dark"
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
