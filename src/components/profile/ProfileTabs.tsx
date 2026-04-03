"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { ProfileHero } from "@/components/results/ProfileHero";
import { ProgressBar } from "@/components/results/ProgressBar";
import { InsightPair } from "@/components/results/InsightPair";
import { UpgradeButton } from "./UpgradeButton";
import { ResearchSurvey } from "@/components/dashboard/ResearchSurvey";
import { DimensionStrip } from "@/components/results/DimensionStrip";
import { DimensionAccordion } from "@/components/results/DimensionAccordion";
import { TeamRoles } from "@/components/results/TeamRoles";
import { InlineUpsell } from "@/components/results/InlineUpsell";
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
import type { ProductLayerStatus } from "@/lib/domain/layers-4plus2";
import type { JourneyExperienceHints } from "@/lib/journey/types";

type ProfileLevel = "start" | "plus";
type TabId = "results" | "comparison" | "invites";

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
  hasResearchSurvey: boolean;
  occupationStatus: string | null;
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
  layerStatuses?: ProductLayerStatus[];
  experienceHints?: JourneyExperienceHints;
  experienceHintDestination?: string;
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
  growthFocusItems: SerializedGrowthItem[];
  assessmentResultId: string;
  isPlus: boolean;
  hasObserverData: boolean;
  observerCount: number;
  locale: Locale;
  plusContent?: ProfileTabsProps["plusContent"];
}

function ResultsTab({
  dimensions,
  growthFocusItems,
  assessmentResultId,
  isPlus,
  hasObserverData,
  observerCount,
  locale,
  plusContent,
}: ResultsTabProps) {
  const mainDims = dimensions.filter((d) => d.code !== "I");
  const showObserver = hasObserverData && isPlus;

  const observerDims = mainDims.map((d) => ({
    code: d.code,
    label: d.label,
    color: d.color,
    selfScore: d.score,
    observerScore: d.observerScore,
  }));

  const stripDims = mainDims.map((d) => ({
    name: d.label,
    shortName: d.label.length > 10 ? d.label.slice(0, 10) + "." : d.label,
    value: d.score,
  }));

  const accordionDims = mainDims.map((d) => ({
    code: d.code,
    name: d.label,
    value: d.score,
    description: d.description,
    insight: d.insight,
    facets: d.facets,
  }));

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      {/* 1. Dimension strip — 6 column overview */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-[var(--color-text-muted)]">
          {t("content.stripLabel", locale)}
        </p>
        <DimensionStrip dimensions={stripDims} />
      </div>

      {/* 2. Dimension accordion */}
      <DimensionAccordion
        dimensions={accordionDims}
        showUpsell={!isPlus}
      />

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

      {/* Profile summary dark card — between dimensions and plus content */}
      {isPlus && plusContent && plusContent.takeaways.length > 0 && (
        <div
          className="rounded-2xl p-5 px-6"
          style={{ background: "linear-gradient(135deg, var(--color-text-primary), var(--color-text-strong-deep))" }}
        >
          <p className="mb-2 text-[9px] uppercase tracking-widest" style={{ color: "var(--color-accent-primary-soft)" }}>
            {t("content.profileSummary", locale)}
          </p>
          <div className="flex flex-col gap-2">
            {plusContent.takeaways.slice(0, 2).map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-[6px] h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
                <p className="text-[13px] leading-[1.6] text-white/[0.55]">{t}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Plus content sections */}
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
          <KeyTakeawaysSection
            paragraphs={plusContent.takeaways}
            closingText={plusContent.closingText}
            isUnlocked={true}
          />
        </>
      )}

      {/* 4. TeamRole team roles */}
      <TeamRoles
        hexacoScores={Object.fromEntries(mainDims.map((d) => [d.code, d.score]))}
        locale={locale}
      />

      {/* 4. Inline upsell — after TeamRole, before locked sections */}
      {!isPlus && <InlineUpsell />}

      {/* 5. Locked content preview */}
      {!isPlus && <LockedPreview isPlus={false} />}

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
  hasResearchSurvey,
  occupationStatus,
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
  layerStatuses,
  experienceHints,
  experienceHintDestination,
}: ProfileTabsProps) {
  const { locale: rawLocale } = useLocale();
  const locale = rawLocale as Locale;
  const router = useRouter();
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [surveyOpen, setSurveyOpen] = useState(false);

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
  const shouldShowTeamShortcut = bridgeNextStep
    ? !hasTeamOrOrgMembership &&
      (bridgeNextStep.stage === "SELF_COMPLETED" || bridgeNextStep.stage === "OBSERVER_PENDING")
    : false;
  const shouldShowOrgExpansionPrompt = Boolean(experienceHints?.showOrgExpansionPrompt);
  const shouldShowTeamCreationBanner = Boolean(
    experienceHints?.showTeamCreationBanner && !hasTeamOrOrgMembership,
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
      {/* Research survey modal */}
      <ResearchSurvey
        locale={locale as Locale}
        hasObserverFeedback={hasObserverData}
        occupationStatus={occupationStatus}
        isOpen={surveyOpen}
        onClose={() => setSurveyOpen(false)}
      />

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
              "H": { hu: "hiteles, manipulációmentes", en: "authentic, manipulation-free" },
              "E": { hu: "erős empátia, mély kapcsolódás", en: "strong empathy, deep connection" },
              "X": { hu: "inspiráló, energikus jelenlét", en: "inspiring, energetic presence" },
              "A": { hu: "megbocsátó, rugalmas, türelmes", en: "forgiving, flexible, patient" },
              "C": { hu: "szervezettség, kitartás, pontosság", en: "organized, persistent, precise" },
              "O": { hu: "kísérletező, stratégiai gondolkodó", en: "experimental, strategic thinker" },
            };
            const watchDescs: Record<string, { hu: string; en: string }> = {
              "H": { hu: "státuszorientáltabb, versengőbb", en: "more status-oriented, competitive" },
              "E": { hu: "érzelmileg távolabb, kevesebb empátia", en: "emotionally distant, less empathy" },
              "X": { hu: "kisebb társas láthatóság, visszahúzódóbb", en: "lower social visibility, more reserved" },
              "A": { hu: "élesebb reakciók konfliktusban", en: "sharper reactions in conflict" },
              "C": { hu: "kevésbé szervezett, rugalmasabb", en: "less organized, more flexible" },
              "O": { hu: "bevált módszereket preferálja", en: "prefers established methods" },
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
                  const { estimateTeamRolesFromHexaco } = require("@/lib/team-role-estimate");
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  const { TEAM_ROLES, getTopRoles } = require("@/lib/team-role-scoring");
                  const hexScores = Object.fromEntries(mainDims.map((d) => [d.code, d.score]));
                  if (!("H" in hexScores) || !("X" in hexScores)) return [];
                  const estimated = estimateTeamRolesFromHexaco(hexScores);
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

      {layerStatuses && layerStatuses.length > 0 ? (
        <Card as="section" spacing="md" className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t("content.layerStatusEyebrow", locale)}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {layerStatuses.map((layer) => {
              const statusLabel =
                layer.status === "COMPLETED"
                  ? t("content.layerStatusCompleted", locale)
                  : layer.status === "IN_PROGRESS"
                    ? t("content.layerStatusInProgress", locale)
                  : layer.status === "AVAILABLE"
                    ? t("content.layerStatusAvailable", locale)
                    : t("content.layerStatusLocked", locale);

              const statusClass =
                layer.status === "COMPLETED"
                  ? "bg-sage-soft text-sage-dark"
                  : layer.status === "IN_PROGRESS"
                    ? "bg-[#e9f3ff] text-[#2f5d87]"
                  : layer.status === "AVAILABLE"
                    ? "bg-[var(--color-surface-chip-warm-soft)] text-[var(--color-accent-primary-strong)]"
                    : "bg-cream text-ink-body";

              return (
                <div key={layer.id} className="rounded-xl border border-sand bg-cream px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-ink">{layer.label}</p>
                    <span className={`rounded-full px-2 py-[2px] text-[10px] font-semibold ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-body">{layer.description}</p>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* Journey bridge CTA — single primary direction after self insight */}
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
        className="scroll-mt-24 flex overflow-hidden rounded-xl border-[1.5px] border-[var(--color-border-default)] bg-white"
        role="tablist"
        aria-label="Profile navigation"
      >
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={[
              "flex min-h-[48px] flex-1 items-center justify-center gap-1.5 py-3 text-center text-xs font-medium transition-all",
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
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
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
            growthFocusItems={growthFocusItems}
            assessmentResultId={assessmentResultId}
            isPlus={isPlus}
            hasObserverData={hasObserverData}
            observerCount={observerCount}
            locale={locale}
            plusContent={plusContent}
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
    </div>
  );
}
