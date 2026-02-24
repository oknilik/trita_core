"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { t, tf, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { FadeIn } from "@/components/landing/FadeIn";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { DimensionCard } from "@/components/dashboard/DimensionCard";
import { DimensionHighlights } from "@/components/dashboard/DimensionHighlights";
import { ObserverComparison } from "@/components/dashboard/ObserverComparison";
import { InviteSection } from "@/components/dashboard/InviteSection";
import { RetakeButton } from "@/components/dashboard/RetakeButton";
import { JourneyProgress } from "@/components/dashboard/JourneyProgress";
import { ProfileInsights } from "@/components/dashboard/ProfileInsights";
import { ResearchSurvey } from "@/components/dashboard/ResearchSurvey";

type TabId = "results" | "comparison" | "invites";

// Serializable score type (passed from server component)
export interface SerializedScore {
  code: string;
  label: string;
  labelByLocale?: Partial<Record<Locale, string>>;
  color: string;
  score: number;
  insight: string;
  inverted?: boolean;
  facets?: { code: string; label: string; score: number }[];
  aspects?: { code: string; label: string; score: number }[];
}

export interface SerializedDimConfig {
  description: string;
  descriptionByLocale?: Partial<Record<Locale, string>>;
  insights: { low: string; mid: string; high: string };
  insightsByLocale?: Partial<Record<Locale, { low: string; mid: string; high: string }>>;
  labelByLocale?: Partial<Record<Locale, string>>;
}

export interface SerializedInvitation {
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

export interface SerializedObserverComparison {
  count: number;
  dimensions: {
    code: string;
    label: string;
    labelByLocale?: Partial<Record<Locale, string>>;
    color: string;
    selfScore: number;
    observerScore: number;
  }[];
}

export interface SerializedFeedback {
  dimensionCode: string;
  accuracyRating: number;
  comment: string | null;
}

export interface SerializedFacetDivergence {
  dimCode: string;
  dimLabel: string;
  dimColor: string;
  subCode: string;
  subLabel: string;
  subType: "facet" | "aspect";
  selfScore: number;
  observerScore: number;
  delta: number;
}

export interface DashboardTabsProps {
  activeTab: TabId;

  // Results tab
  mainScores: SerializedScore[] | null;
  altruismScore: SerializedScore | null;
  dimConfigs: Record<string, SerializedDimConfig>;
  assessmentResultId: string;
  feedbackMap: Record<string, SerializedFeedback>;
  profileOverviewTestName: string;
  isLikert: boolean;
  hasDraft: boolean;
  rawDimensions: Record<string, number>;
  testType: string;

  // Comparison tab
  observerComparison: SerializedObserverComparison | null;
  facetDivergences: SerializedFacetDivergence[];
  completedObserversCount: number;
  avgConfidence: number | null;
  hasObserverFeedback: boolean;

  // Invites tab
  sentInvitations: SerializedInvitation[];
  receivedInvitations: SerializedReceivedInvitation[];
  hasInvites: boolean;
  pendingInvitesCount: number;
  surveySubmitted: boolean;
  occupationStatus: string | null;
}

export function DashboardTabs(props: DashboardTabsProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>(props.activeTab);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      // Preserve hash so /dashboard?tab=invites#invite keeps working.
      router.push(url.pathname + url.search + url.hash, { scroll: false });
      setTimeout(() => {
        tabBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    },
    [router],
  );

  // Support direct hash navigation (e.g. /dashboard#invite from landing).
  // Hash targets live inside tab panels, so we must activate the matching tab first.
  useEffect(() => {
    const hash = window.location.hash;
    const wantedTab: TabId | null =
      hash === "#invite" ? "invites" :
      hash === "#comparison" ? "comparison" :
      hash === "#results" ? "results" :
      null;
    if (!wantedTab) return;
    if (activeTab !== wantedTab) {
      setActiveTab(wantedTab);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", wantedTab);
      router.replace(url.pathname + url.search + url.hash, { scroll: false });
    }
    // After the tab panel renders, scroll to the anchor target.
    window.setTimeout(() => {
      const target = document.getElementById(hash.slice(1));
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Allow nested components to open the research survey modal.
  useEffect(() => {
    const onOpenSurvey = () => setSurveyModalOpen(true);
    window.addEventListener("dashboard:open-survey", onOpenSurvey);
    return () => window.removeEventListener("dashboard:open-survey", onOpenSurvey);
  }, []);

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: "results",
      label: t("dashboard.tabResults", locale),
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
      label: t("dashboard.tabComparison", locale),
      icon: (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10h14M3 5h7M3 15h7M13 5l4 5-4 5" />
        </svg>
      ),
    },
    {
      id: "invites",
      label: t("dashboard.tabInvites", locale),
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
      {/* Journey progress — visible on all tabs */}
      <FadeIn>
        <section className="relative rounded-2xl border border-indigo-100/50 bg-gradient-to-br from-indigo-50/80 via-white to-white glass-effect p-8 md:p-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              {t("dashboard.guidedTag", locale)}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {t("dashboard.nextStepTitle", locale)}
              </h2>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              {t("dashboard.guidedPraise", locale)}
            </p>
          </div>
          <JourneyProgress
            locale={locale}
            initialHasInvites={props.hasInvites}
            initialPendingInvites={props.pendingInvitesCount}
            hasObserverFeedback={props.hasObserverFeedback}
            completedObserversCount={props.completedObserversCount}
            onTabChange={handleTabChange}
            surveySubmitted={props.surveySubmitted}
            onOpenSurvey={() => setSurveyModalOpen(true)}
          />
          <ResearchSurvey
            locale={locale}
            hasObserverFeedback={props.hasObserverFeedback}
            occupationStatus={props.occupationStatus}
            isOpen={surveyModalOpen}
            onClose={() => setSurveyModalOpen(false)}
          />
        </section>
      </FadeIn>

      {/* Tab bar */}
      <div ref={tabBarRef} className="scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <div
          className="grid grid-cols-3 gap-1.5"
          role="tablist"
          aria-label="Dashboard navigation"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-3 text-xs font-semibold transition-all duration-200 md:flex-row md:gap-2 md:text-sm ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels — key forces remount on tab switch so animations replay */}
      <div
        key={activeTab}
        className="flex flex-col gap-8 md:gap-12"
        style={{ animation: "fadeIn 0.3s ease-out" }}
      >
        {activeTab === "results" && (
          <div id="results" className="scroll-mt-24">
            <ResultsTabPanel
            mainScores={props.mainScores}
            altruismScore={props.altruismScore}
            dimConfigs={props.dimConfigs}
            assessmentResultId={props.assessmentResultId}
            feedbackMap={props.feedbackMap}
            profileOverviewTestName={props.profileOverviewTestName}
            isLikert={props.isLikert}
            hasDraft={props.hasDraft}
            rawDimensions={props.rawDimensions}
            testType={props.testType}
            locale={locale}
          />
          </div>
        )}
        {activeTab === "comparison" && (
          <div id="comparison" className="scroll-mt-24">
            <ComparisonTabPanel
            observerComparison={props.observerComparison}
            facetDivergences={props.facetDivergences}
            completedObserversCount={props.completedObserversCount}
            avgConfidence={props.avgConfidence}
            hasObserverFeedback={props.hasObserverFeedback}
            surveySubmitted={props.surveySubmitted}
            onTabChange={handleTabChange}
            locale={locale}
          />
          </div>
        )}
        {activeTab === "invites" && (
          <div id="invite" className="scroll-mt-24">
            <InvitesTabPanel
            sentInvitations={props.sentInvitations}
            receivedInvitations={props.receivedInvitations}
            locale={locale}
          />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Results tab ─────────────────────────────────────────────────────────────

interface ResultsTabPanelProps {
  mainScores: SerializedScore[] | null;
  altruismScore: SerializedScore | null;
  dimConfigs: Record<string, SerializedDimConfig>;
  assessmentResultId: string;
  feedbackMap: Record<string, SerializedFeedback>;
  profileOverviewTestName: string;
  isLikert: boolean;
  hasDraft: boolean;
  rawDimensions: Record<string, number>;
  testType: string;
  locale: Locale;
}

function ResultsTabPanel({
  mainScores,
  altruismScore,
  dimConfigs,
  assessmentResultId,
  feedbackMap,
  profileOverviewTestName,
  isLikert,
  hasDraft,
  rawDimensions,
  testType,
  locale,
}: ResultsTabPanelProps) {
  // For inverted dimensions (e.g. Neuroticism), lower raw score = better outcome.
  // Use effectiveScore for ranking: inverted ? (100 - score) : score
  const effectiveScore = (d: SerializedScore) => d.inverted ? 100 - d.score : d.score;
  const sorted = mainScores ? [...mainScores].sort((a, b) => effectiveScore(b) - effectiveScore(a)) : null;
  const strongest = sorted?.[0];
  const weakest = sorted?.[sorted.length - 1];

  return (
    <>
      {/* Chart overview + highlights */}
      <FadeIn delay={0.05}>
        <section className="rounded-2xl border border-gray-100/50 bg-white p-8 md:p-12 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {tf("dashboard.profileOverview", locale, { testName: profileOverviewTestName })}
            </h2>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {tf("dashboard.overviewLikert", locale, {
              count: mainScores?.length ?? 0,
            })}
          </p>

          {mainScores && (
            <div className="mt-6 grid items-start gap-6 md:grid-cols-[1fr_13rem]">
              <div className="flex items-center justify-center">
                <div className="h-[21rem] w-[21rem] md:h-[24rem] md:w-[24rem]">
                  <RadarChart
                    dimensions={mainScores.map((d) => ({
                      code: d.code,
                      color: d.color,
                      score: d.score,
                    }))}
                  />
                </div>
              </div>

              {strongest && weakest && (
                <DimensionHighlights
                  strongest={{
                    label: strongest.label,
                    labelByLocale: strongest.labelByLocale,
                    score: strongest.score,
                  }}
                  weakest={{
                    label: weakest.label,
                    labelByLocale: weakest.labelByLocale,
                    score: weakest.score,
                  }}
                />
              )}
            </div>
          )}
        </section>
      </FadeIn>

      {/* Detailed dimension cards */}
      {isLikert && mainScores && (
        <FadeIn delay={0.1}>
          <section className="rounded-2xl border border-gray-100/50 bg-white p-8 md:p-12 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {t("dashboard.detailedTitle", locale)}
              </h2>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {t("dashboard.detailedBody", locale)}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {mainScores.map((item, idx) => {
                const dimConfig = dimConfigs[item.code];
                return (
                  <DimensionCard
                    key={item.code}
                    code={item.code}
                    label={item.label}
                    labelByLocale={dimConfig?.labelByLocale}
                    color={item.color}
                    score={item.score}
                    insight={item.insight}
                    description={dimConfig?.description ?? ""}
                    descriptionByLocale={dimConfig?.descriptionByLocale}
                    insights={dimConfig?.insights ?? { low: "", mid: "", high: "" }}
                    insightsByLocale={dimConfig?.insightsByLocale}
                    facets={item.facets}
                    aspects={item.aspects}
                    delay={idx * 0.08}
                    assessmentResultId={assessmentResultId}
                    existingFeedback={feedbackMap[item.code]}
                  />
                );
              })}
            </div>

            {/* Altruism interstitial scale */}
            {altruismScore && (() => {
              const dimConfig = dimConfigs["I"];
              return (
                <div className="mt-8 border-t border-gray-100 pt-8">
                  <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500">
                      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">{t("dashboard.altruismTitle", locale)}</p>
                      <p className="mt-0.5 text-xs text-emerald-700">{t("dashboard.altruismBody", locale)}</p>
                    </div>
                  </div>
                  <div className="max-w-sm">
                    <DimensionCard
                      code={altruismScore.code}
                      label={altruismScore.label}
                      labelByLocale={dimConfig?.labelByLocale}
                      color={altruismScore.color}
                      score={altruismScore.score}
                      insight={altruismScore.insight}
                      description={dimConfig?.description ?? ""}
                      descriptionByLocale={dimConfig?.descriptionByLocale}
                      insights={dimConfig?.insights ?? { low: "", mid: "", high: "" }}
                      insightsByLocale={dimConfig?.insightsByLocale}
                      facets={altruismScore.facets}
                      delay={0}
                      assessmentResultId={assessmentResultId}
                      existingFeedback={feedbackMap["I"]}
                    />
                  </div>
                </div>
              );
            })()}
          </section>
        </FadeIn>
      )}

      {/* Profile insights */}
      {isLikert && (
        <FadeIn delay={0.12}>
          <ProfileInsights dimensions={rawDimensions} testType={testType} />
        </FadeIn>
      )}

      {/* Retake CTA */}
      <FadeIn delay={0.15}>
        <section className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            {hasDraft ? (
              <Link
                href="/assessment"
                className="inline-flex min-h-[44px] items-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                {t("actions.continueDraft", locale)}
              </Link>
            ) : (
              <RetakeButton />
            )}
          </div>
        </section>
      </FadeIn>
    </>
  );
}

// ─── Comparison tab ───────────────────────────────────────────────────────────

interface ComparisonTabPanelProps {
  observerComparison: SerializedObserverComparison | null;
  facetDivergences: SerializedFacetDivergence[];
  completedObserversCount: number;
  avgConfidence: number | null;
  hasObserverFeedback: boolean;
  surveySubmitted: boolean;
  onTabChange: (tab: TabId) => void;
  locale: Locale;
}

function ComparisonTabPanel({
  observerComparison,
  facetDivergences,
  completedObserversCount,
  avgConfidence,
  hasObserverFeedback,
  surveySubmitted,
  onTabChange,
  locale,
}: ComparisonTabPanelProps) {
  // Anonymity gate: fewer than 2 responses
  if (completedObserversCount < 2) {
    return (
      <FadeIn>
        <section className="rounded-2xl border border-gray-100/50 bg-white p-8 md:p-12 shadow-lg text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <svg className="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
            {t("comparison.title", locale)}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900">
            {t("comparison.anonGateTitle", locale)}
          </h2>
          <p className="mt-3 text-sm text-gray-600 max-w-sm mx-auto">
            {t("comparison.anonGateBody", locale)}
          </p>
          <p className="mt-3 text-sm font-semibold text-indigo-600">
            {tf("comparison.anonGateProgress", locale, { count: completedObserversCount })}
          </p>
          <button
            type="button"
            onClick={() => onTabChange("invites")}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            {t("comparison.anonGateCta", locale)}
          </button>
        </section>
      </FadeIn>
    );
  }

  if (!observerComparison) return null;

  return (
    <>
      <FadeIn delay={0.05}>
        <ObserverComparison
          observerCount={observerComparison.count}
          avgConfidence={avgConfidence}
          facetDivergences={facetDivergences}
          surveySubmitted={surveySubmitted}
        />
      </FadeIn>

    </>
  );
}

// ─── Invites tab ──────────────────────────────────────────────────────────────

interface InvitesTabPanelProps {
  sentInvitations: SerializedInvitation[];
  receivedInvitations: SerializedReceivedInvitation[];
  locale: Locale;
}

function InvitesTabPanel({
  sentInvitations,
  receivedInvitations,
  locale,
}: InvitesTabPanelProps) {
  return (
    <>
      {/* Invite section */}
      <FadeIn delay={0.1}>
        <div className="relative overflow-hidden rounded-2xl scroll-mt-24">
          <InviteSection initialInvitations={sentInvitations} />
        </div>
      </FadeIn>

      {/* Received invitations */}
      {receivedInvitations.length > 0 && (
        <FadeIn delay={0.15}>
          <section className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t("dashboard.invitesReceivedTitle", locale)}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t("dashboard.invitesReceivedBody", locale)}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {receivedInvitations.map((inv) => {
                const inviterName = inv.inviterUsername ?? t("common.inviterFallback", locale);
                const isPending = inv.status === "PENDING";
                const isExpired = new Date(inv.expiresAt) < new Date();
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          inv.status === "COMPLETED"
                            ? "bg-emerald-500"
                            : inv.status === "CANCELED" || isExpired
                              ? "bg-gray-300"
                              : "bg-amber-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{inviterName}</p>
                        <p className="text-xs text-gray-500">
                          {inv.status === "COMPLETED"
                            ? t("common.statusCompleted", locale)
                            : inv.status === "CANCELED"
                              ? t("common.statusCanceled", locale)
                              : isExpired
                                ? t("common.statusExpired", locale)
                                : t("common.statusPending", locale)}
                        </p>
                      </div>
                    </div>
                    {isPending && !isExpired && (
                      <Link
                        href={`/observe/${inv.token}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {t("actions.openFill", locale)}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </FadeIn>
      )}
    </>
  );
}
