"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { ProfileHero } from "@/components/results/ProfileHero";
import { ProgressBar } from "@/components/results/ProgressBar";
import { InsightPair } from "@/components/results/InsightPair";
import { UpgradeButton } from "./UpgradeButton";
import { ResearchSurvey } from "@/components/dashboard/ResearchSurvey";
import { DimensionStrip } from "@/components/results/DimensionStrip";
import { DimensionAccordion } from "@/components/results/DimensionAccordion";
import { BelbinRoles } from "@/components/results/BelbinRoles";
import { InlineUpsell } from "@/components/results/InlineUpsell";
import { LockedPreview } from "@/components/results/LockedPreview";
import { HowYouWorkSection } from "@/components/results/HowYouWorkSection";
import { IdealEnvironmentSection } from "@/components/results/IdealEnvironmentSection";
import { RoleFitSection } from "@/components/results/RoleFitSection";
import { KeyTakeawaysSection } from "@/components/results/KeyTakeawaysSection";
import { InvitationsTab } from "@/components/results/InvitationsTab";
import { AltruismCard } from "@/components/results/AltruismCard";
import { ComparisonTab as ComparisonTabNew } from "@/components/results/ComparisonTab";

type ProfileLevel = "start" | "plus" | "reflect";
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
}

// ─── Shared paywall components ──────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width="20" height="20" viewBox="0 0 20 20"
      fill="none" stroke="#c17f4a" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="3" y="9" width="14" height="10" rx="2" />
      <path d="M7 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function TabPaywall({ tier, tierLabel, price, teaser, isHu }: {
  tier: string;
  tierLabel: string;
  price: string;
  teaser: string;
  isHu: boolean;
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
        label={isHu ? `Feloldás — ${price}` : `Unlock — ${price}`}
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
  isReflect: boolean;
  hasObserverData: boolean;
  observerCount: number;
  isHu: boolean;
  locale: string;
  plusContent?: ProfileTabsProps["plusContent"];
}

function ResultsTab({
  dimensions,
  growthFocusItems,
  assessmentResultId,
  isPlus,
  isReflect,
  hasObserverData,
  observerCount,
  isHu,
  locale,
  plusContent,
}: ResultsTabProps) {
  const mainDims = dimensions.filter((d) => d.code !== "I");
  const showObserver = hasObserverData && isReflect;

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
        <p className="mb-1.5 text-[11px] font-medium text-[#8a8a9a]">
          {isHu ? "Gyors áttekintés — a 6 fő dimenzió mentén" : "Quick overview — across the 6 key dimensions"}
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
          style={{ background: "linear-gradient(135deg, #1a1a2e, #2a2740)" }}
        >
          <p className="mb-2 text-[9px] uppercase tracking-widest" style={{ color: "#e8a96a" }}>
            {isHu ? "Profil összefoglaló" : "Profile summary"}
          </p>
          <div className="flex flex-col gap-2">
            {plusContent.takeaways.slice(0, 2).map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-[6px] h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#3d6b5e" }} />
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

      {/* 4. Belbin team roles */}
      <BelbinRoles
        hexacoScores={Object.fromEntries(mainDims.map((d) => [d.code, d.score]))}
        locale={locale}
      />

      {/* 4. Inline upsell — after Belbin, before locked sections */}
      {!isPlus && <InlineUpsell />}

      {/* 5. Locked content preview — 2 compact rows */}
      {!isReflect && <LockedPreview isPlus={isPlus} />}

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
}: ProfileTabsProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [surveyOpen, setSurveyOpen] = useState(false);

  const isHu = locale === "hu";
  const isPlus = accessLevel !== "start";
  const isReflect = accessLevel === "reflect";
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

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
      label: isHu ? "Eredmények" : "Results",
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
      label: isHu ? "Összehasonlítás" : "Comparison",
      locked: !isReflect,
      icon: (
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10h14M3 5h7M3 15h7M13 5l4 5-4 5" />
        </svg>
      ),
    },
    {
      id: "invites",
      label: isHu ? "Meghívók" : "Invites",
      locked: !isReflect,
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
        personalityType={personalityType ?? (isHu ? "Személyiségprofil" : "Personality profile")}
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
              alert(isHu ? "Link másolva a vágólapra!" : "Link copied to clipboard!");
            }
          } catch {
            alert(isHu ? "Hiba történt" : "An error occurred");
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
            const lang = isHu ? "hu" : "en";
            const strengthBullets = highDims.length > 0
              ? highDims.map((d) => {
                  const desc = strengthDescs[d.code]?.[lang];
                  return desc ? `${d.label} — ${desc}` : d.label;
                })
              : [isHu ? "kiegyensúlyozott profil" : "balanced profile"];
            const watchBullets = lowDims.length > 0
              ? lowDims.map((d) => {
                  const desc = watchDescs[d.code]?.[lang];
                  return desc ? `${d.label} — ${desc}` : d.label;
                })
              : [isHu ? "nincs kritikusan alacsony dimenzió" : "no critically low dimension"];

            // Profile character
            const profileCharacter = (() => {
              const top2 = sortedDims.slice(0, 2);
              const bottom = sortedDims[sortedDims.length - 1];
              if (!top2[0] || !bottom) return "";
              return isHu
                ? `A profilod fő karaktere: magas ${top2[0].label.toLowerCase()}${top2[1] ? `, magas ${top2[1].label.toLowerCase()}` : ""}. ${bottom.label} területen nyílhat tér a fejlődésre.`
                : `Your profile character: high ${top2[0].label.toLowerCase()}${top2[1] ? `, high ${top2[1].label.toLowerCase()}` : ""}. ${bottom.label} is where growth potential lies.`;
            })();

            // Workplace / risk insights for Plus callouts
            const workplaceInsight = plusContent?.howYouWork[0] ?? "";
            const riskInsight = plusContent?.howYouWork[1] ?? "";

            await downloadPdf({
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
              belbinRoles: (() => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  const { estimateBelbinFromHexaco } = require("@/lib/belbin-estimate");
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  const { BELBIN_ROLES, getTopRoles } = require("@/lib/belbin-scoring");
                  const hexScores = Object.fromEntries(mainDims.map((d) => [d.code, d.score]));
                  if (!("H" in hexScores) || !("X" in hexScores)) return [];
                  const estimated = estimateBelbinFromHexaco(hexScores);
                  const top3 = getTopRoles(estimated, 3);
                  return top3.map((r: { role: string; score: number }, i: number) => ({
                    name: isHu ? BELBIN_ROLES[r.role].hu : BELBIN_ROLES[r.role].en,
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
              observerData: hasObserverData && isReflect ? {
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
        hasSelfReflect={isReflect}
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
            if (high.length === 0) return [{ text: isHu ? "kiegyensúlyozott profil" : "balanced profile" }];
            return high.map((d) => ({ dimension: d.label, text: d.insight }));
          })()}
          watchAreas={(() => {
            const mainDims = dimensions.filter((d) => d.code !== "I");
            const low = mainDims.filter((d) => d.score < 40);
            if (low.length === 0) return [{ text: isHu ? "nincs kritikusan alacsony dimenzió" : "no critically low dimension" }];
            return low.map((d) => ({ dimension: d.label, text: d.insight }));
          })()}
        />
      )}

      {/* Tab bar — pill style */}
      <div
        ref={tabBarRef}
        className="scroll-mt-24 flex overflow-hidden rounded-xl border-[1.5px] border-[#e8e0d3] bg-white"
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
              i < TABS.length - 1 && "border-r border-[#e8e0d3]",
              activeTab === tab.id
                ? "bg-[#3d6b5e] text-white"
                : "bg-white text-[#8a8a9a] hover:bg-[#f2ede6]",
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
            isReflect={isReflect}
            hasObserverData={hasObserverData}
            observerCount={observerCount}
            isHu={isHu}
            locale={locale}
            plusContent={plusContent}
          />
        )}
        {activeTab === "comparison" && (
          isReflect ? (
            <ComparisonTabNew
              dimensions={dimensions}
              hasObserverData={hasObserverData}
              observerCount={observerCount}
            />
          ) : (
            <TabPaywall
              tier="self_reflect"
              tierLabel="Self Reflect"
              price="€12"
              isHu={isHu}
              teaser={
                isHu
                  ? "Az observer összehasonlítás megmutatja, hogyan látnak mások — és hol tér el az önképed a külső visszajelzésektől."
                  : "Observer comparison shows how others see you — and where your self-image diverges from external feedback."
              }
            />
          )
        )}
        {activeTab === "invites" && (
          <InvitationsTab
            sentInvitations={sentInvitations}
            receivedInvitations={receivedInvitations}
            isPlus={isPlus}
            isReflect={isReflect}
          />
        )}
      </div>
    </div>
  );
}
