"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { ProfileHeader } from "./ProfileHeader";
import { DimensionOverview } from "./DimensionOverview";
import { FacetBreakdown } from "./FacetBreakdown";
import { GrowthFocus } from "./GrowthFocus";
import { CareerFit } from "./CareerFit";
import { ObserverComparison } from "./ObserverComparison";
import { BlindSpotAnalysis } from "./BlindSpotAnalysis";
import { UpgradeButton } from "./UpgradeButton";
import { DimensionCard } from "@/components/dashboard/DimensionCard";
import { InviteSection } from "@/components/dashboard/InviteSection";
import { ResearchSurvey } from "@/components/dashboard/ResearchSurvey";
import { JourneyProgress } from "@/components/dashboard/JourneyProgress";
import { DiscardDraftButton } from "@/components/dashboard/DiscardDraftButton";
import { BelbinTeaser } from "./BelbinTeaser";

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

// Dimension colors matching HEXACO/BFAS palette — for visual cohesion with the cards above
const DIM_COLORS = ["#6366f1", "#ec4899", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

function FacetPlaceholder() {
  // Each group = one dimension with 2 sub-bars underneath
  const groups = [
    { color: DIM_COLORS[0], b1: "68%", b2: "52%", opacity: 0.75, blur: 0   },
    { color: DIM_COLORS[1], b1: "81%", b2: "44%", opacity: 0.55, blur: 1.5 },
    { color: DIM_COLORS[2], b1: "58%", b2: "73%", opacity: 0.35, blur: 3   },
    { color: DIM_COLORS[3], b1: "44%", b2: "62%", opacity: 0.2,  blur: 5   },
  ];
  return (
    <div className="space-y-4 rounded-2xl border border-sand bg-white p-6">
      {groups.map((g, i) => (
        <div
          key={i}
          className="flex items-start gap-3"
          style={{ opacity: g.opacity, filter: g.blur ? `blur(${g.blur}px)` : undefined }}
        >
          <div className="mt-0.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: g.color }} />
          <div className="flex-1 space-y-2">
            <div className="h-2 w-full rounded-full bg-warm-mid">
              <div className="h-full rounded-full" style={{ width: g.b1, backgroundColor: `${g.color}60` }} />
            </div>
            <div className="h-2 w-full rounded-full bg-warm-mid">
              <div className="h-full rounded-full" style={{ width: g.b2, backgroundColor: `${g.color}40` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GrowthPlaceholder() {
  const items = [
    { titleW: "52%", d1: "78%", opacity: 0.75, blur: 0   },
    { titleW: "44%", d1: "68%", opacity: 0.55, blur: 1.5 },
    { titleW: "58%", d1: "82%", opacity: 0.35, blur: 3   },
  ];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-4 rounded-xl border border-sand bg-white p-4"
          style={{ opacity: item.opacity, filter: item.blur ? `blur(${item.blur}px)` : undefined }}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sand bg-cream">
            <span className="font-mono text-xs font-bold text-muted">#{i + 1}</span>
          </div>
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 rounded bg-sand" style={{ width: item.titleW }} />
            <div className="h-2 rounded bg-sand/60" style={{ width: item.d1 }} />
            <div className="h-1.5 w-full rounded-full bg-warm-mid">
              <div className="h-full w-2/3 rounded-full bg-sage/18" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CareerPlaceholder() {
  const cards = [
    { titleW: "58%", barW: "82%", opacity: 0.75, blur: 0   },
    { titleW: "50%", barW: "74%", opacity: 0.55, blur: 1.5 },
    { titleW: "64%", barW: "66%", opacity: 0.35, blur: 3   },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-xl border border-sand bg-white p-4"
          style={{ opacity: card.opacity, filter: card.blur ? `blur(${card.blur}px)` : undefined }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="h-3 rounded bg-sand" style={{ width: card.titleW }} />
            <div className="h-5 w-10 shrink-0 rounded-full bg-sand" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-warm-mid">
            <div className="h-full rounded-full bg-sage/20" style={{ width: card.barW }} />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 rounded bg-sand" style={{ width: "88%" }} />
            <div className="h-2 rounded bg-sand/60" style={{ width: "68%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ObserverPlaceholder() {
  const rows = [
    { selfW: "72%", obsW: "55%", color: DIM_COLORS[0], opacity: 0.75, blur: 0   },
    { selfW: "45%", obsW: "68%", color: DIM_COLORS[1], opacity: 0.55, blur: 1.5 },
    { selfW: "80%", obsW: "72%", color: DIM_COLORS[2], opacity: 0.35, blur: 3   },
    { selfW: "55%", obsW: "40%", color: DIM_COLORS[3], opacity: 0.2,  blur: 5   },
  ];
  return (
    <div className="space-y-4 rounded-2xl border border-sand bg-white p-6">
      <div className="mb-5 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-ink" />
          <div className="h-2 w-14 rounded bg-sand" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-sage/40" />
          <div className="h-2 w-14 rounded bg-sand" />
        </div>
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          className="space-y-1.5"
          style={{ opacity: row.opacity, filter: row.blur ? `blur(${row.blur}px)` : undefined }}
        >
          <div className="flex items-center gap-2">
            <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} />
            <div className="h-2.5 w-24 rounded bg-sand" />
          </div>
          <div className="flex items-center gap-2 pl-4">
            <div className="h-1.5 flex-1 rounded-full bg-warm-mid">
              <div className="h-full rounded-full" style={{ width: row.selfW, backgroundColor: `${row.color}60` }} />
            </div>
          </div>
          <div className="flex items-center gap-2 pl-4">
            <div className="h-1.5 flex-1 rounded-full bg-warm-mid">
              <div className="h-full rounded-full bg-sage/25" style={{ width: row.obsW }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BlindSpotPlaceholder() {
  const cards = [
    { gapW: "35%", opacity: 0.75, blur: 0   },
    { gapW: "58%", opacity: 0.5,  blur: 2   },
    { gapW: "22%", opacity: 0.3,  blur: 4.5 },
  ];
  return (
    <div className="space-y-3">
      {cards.map((card, i) => (
        <div
          key={i}
          className="flex items-start gap-4 rounded-xl border border-sand bg-white p-4"
          style={{ opacity: card.opacity, filter: card.blur ? `blur(${card.blur}px)` : undefined }}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sand bg-cream">
            <div className="h-3 w-3 rounded-sm bg-sand" />
          </div>
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 rounded bg-sand" style={{ width: "55%" }} />
            <div className="h-2 rounded bg-sand/60" style={{ width: "80%" }} />
            <div className="mt-1 flex items-center gap-2">
              <div className="text-[10px] text-muted">gap</div>
              <div className="h-1.5 flex-1 rounded-full bg-warm-mid">
                <div className="h-full rounded-full bg-sage/30" style={{ width: card.gapW }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section lock (peek only, no CTA) ────────────────────────────────────────

type SectionVariant = "facets" | "growth" | "career" | "observer" | "blindspot";

function SectionLock({ variant }: { variant: SectionVariant }) {
  const placeholder =
    variant === "facets"    ? <FacetPlaceholder /> :
    variant === "growth"    ? <GrowthPlaceholder /> :
    variant === "observer"  ? <ObserverPlaceholder /> :
    variant === "blindspot" ? <BlindSpotPlaceholder /> :
    <CareerPlaceholder />;

  return (
    <div className="overflow-hidden rounded-2xl border border-sand bg-white">
      <div className="pointer-events-none relative select-none px-6 pb-2 pt-6" aria-hidden="true">
        {placeholder}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white" />
      </div>
    </div>
  );
}

// ─── Upgrade banner (single CTA at page bottom) ───────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <circle cx="7" cy="7" r="6.5" fill="#c17f4a" fillOpacity="0.1" />
      <path d="M4.5 7l2 2 3-3" stroke="#c17f4a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UpgradeBanner({ accessLevel, isHu }: { accessLevel: "start" | "plus"; isHu: boolean }) {
  if (accessLevel === "start") {
    // Show both Plus and Reflect side by side so the user can pick
    const plusBullets = isHu
      ? ["25 részletes alskála", "Fejlődési fókuszok", "Karrierillesztés"]
      : ["25 detailed subscales", "Growth focus areas", "Career fit"];
    const reflectBullets = isHu
      ? ["Minden Self Plus tartalom", "3 observer meghívó küldése", "Vakfolt-elemzés"]
      : ["Everything in Self Plus", "Send 3 observer invitations", "Blind spot analysis"];

    return (
      <div className="overflow-hidden rounded-2xl border border-sand bg-white">
        <div className="h-[3px] bg-sage" />
        <div className="px-6 py-8 md:px-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bronze">
            {isHu ? "// válassz csomagot" : "// choose a plan"}
          </p>
          <h3 className="mt-2 font-fraunces text-2xl text-ink">
            {isHu ? "Mélyíts a profilodon" : "Go deeper on your profile"}
          </h3>
          <p className="mt-1.5 text-sm text-ink-body">
            {isHu
              ? "Mindkettő egyszeri vásárlás — válaszd, mennyire mélyen szeretnél megismerni magad."
              : "Both are one-time purchases — choose how deep you want to go."}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Self Plus card */}
            <div className="flex flex-col rounded-xl border border-sand p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {isHu ? "egyéni · egyszeri" : "individual · one-time"}
              </p>
              <p className="mt-1.5 font-fraunces text-lg text-ink">Self Plus</p>
              <p className="mt-0.5 text-2xl font-semibold text-ink">€7</p>
              <ul className="mt-4 flex flex-col gap-1.5">
                {plusBullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-ink-body">
                    <CheckIcon />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <UpgradeButton
                  tier="self_plus"
                  label={isHu ? "Megveszem — €7" : "Buy — €7"}
                />
              </div>
            </div>

            {/* Self Reflect card — highlighted */}
            <div className="flex flex-col rounded-xl border-2 border-sage p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {isHu ? "egyéni · egyszeri" : "individual · one-time"}
                </p>
                <span className="rounded-full bg-sage px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white">
                  {isHu ? "teljes" : "full"}
                </span>
              </div>
              <p className="mt-1.5 font-fraunces text-lg text-ink">Self Reflect</p>
              <p className="mt-0.5 text-2xl font-semibold text-ink">€12</p>
              <ul className="mt-4 flex flex-col gap-1.5">
                {reflectBullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-ink-body">
                    <CheckIcon />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <UpgradeButton
                  tier="self_reflect"
                  label={isHu ? "Megveszem — €12" : "Buy — €12"}
                />
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            {isHu ? "Egyszeri vásárlás · nincs előfizetés" : "One-time purchase · no subscription"}
          </p>
        </div>
      </div>
    );
  }

  // Plus user → single Reflect upgrade
  const reflectBullets = isHu
    ? ["Összehasonlítás külső visszajelzésekkel", "3 observer meghívó küldése", "Vakfolt-elemzés"]
    : ["Comparison with observer feedback", "Send 3 observer invitations", "Blind spot analysis"];

  return (
    <div className="overflow-hidden rounded-2xl border border-sand bg-white text-center">
      <div className="h-[3px] bg-sage" />
      <div className="px-6 py-10 md:px-12">
        <h3 className="font-fraunces text-2xl text-ink">
          {isHu ? "Tudd meg, hogyan látnak mások" : "See how others see you"}
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-body">
          {isHu
            ? "Az observer visszajelzések feltárják, hol tér el az önképed a külső megítéléstől."
            : "Observer feedback reveals where your self-image diverges from how others perceive you."}
        </p>
        <ul className="mt-6 inline-flex flex-col gap-2 text-left">
          {reflectBullets.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-ink-body">
              <CheckIcon />
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <UpgradeButton
            tier="self_reflect"
            label={isHu ? "Tükör feloldása — €12" : "Unlock mirror — €12"}
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          {isHu ? "Egyszeri vásárlás · nincs előfizetés" : "One-time purchase · no subscription"}
        </p>
      </div>
    </div>
  );
}

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

  const radarDims = mainDims.map((d) => ({
    code: d.code,
    label: d.label,
    color: d.color,
    score: d.score,
    observerScore: showObserver ? d.observerScore : undefined,
  }));

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      {/* 1. Dimension overview — always visible */}
      <DimensionOverview
        dimensions={radarDims}
        showObserver={showObserver}
        locale={locale as Locale}
      />

      {/* 2. Dimension detail cards with modal — always visible */}
      <section>
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-bronze">
          {isHu ? "// dimenziók" : "// dimensions"}
        </p>
        <h2 className="mt-2 mb-6 font-fraunces text-2xl text-ink">
          {isHu ? "A dimenziók részletesen" : "Dimensions in detail"}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {mainDims.map((dim, idx) => (
            <DimensionCard
              key={dim.code}
              code={dim.code}
              label={dim.label}
              labelByLocale={dim.labelByLocale as Partial<Record<Locale, string>>}
              color={dim.color}
              score={dim.score}
              insight={dim.insight}
              description={dim.description}
              descriptionByLocale={dim.descriptionByLocale as Partial<Record<Locale, string>>}
              insights={dim.insights}
              insightsByLocale={dim.insightsByLocale as Partial<Record<Locale, { low: string; mid: string; high: string }>>}
              facets={dim.facets}
              aspects={dim.aspects}
              delay={idx * 0.06}
              assessmentResultId={assessmentResultId}
              existingFeedback={null}
              hideFeedback={true}
              facetsLocked={!isPlus}
            />
          ))}
        </div>
      </section>

      {/* 3. Belbin team role teaser — HEXACO users only */}
      <BelbinTeaser
        hexacoScores={Object.fromEntries(mainDims.map((d) => [d.code, d.score]))}
        locale={locale}
      />

      {/* 4. "Mi áll a dimenziók mögött?" — Plus+ */}
      <div>
        <div className="mb-6 flex items-center gap-2.5">
          <h2 className="font-fraunces text-2xl text-ink">
            {isHu ? "Mi áll a dimenziók mögött?" : "What drives your dimensions?"}
          </h2>
          {!isPlus && (
            <>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#8a8a9a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="3" y="9" width="14" height="10" rx="2" /><path d="M7 9V6a3 3 0 0 1 6 0v3" />
              </svg>
              <span className="rounded-full bg-warm-mid px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                Self Plus
              </span>
            </>
          )}
        </div>
        {isPlus ? (
          <FacetBreakdown
            dimensions={mainDims.map((d) => ({
              code: d.code,
              label: d.label,
              color: d.color,
              facets: d.facets,
            }))}
            locale={locale as Locale}
          />
        ) : (
          <SectionLock variant="facets" />
        )}
      </div>

      {/* 4. "Hol fejlődhetsz a leggyorsabban?" — Plus+ */}
      <div>
        <div className="mb-6 flex items-center gap-2.5">
          <h2 className="font-fraunces text-2xl text-ink">
            {isHu ? "Hol fejlődhetsz a leggyorsabban?" : "Where can you grow fastest?"}
          </h2>
          {!isPlus && (
            <>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#8a8a9a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="3" y="9" width="14" height="10" rx="2" /><path d="M7 9V6a3 3 0 0 1 6 0v3" />
              </svg>
              <span className="rounded-full bg-warm-mid px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                Self Plus
              </span>
            </>
          )}
        </div>
        {isPlus ? (
          <GrowthFocus items={growthFocusItems} locale={locale as Locale} />
        ) : (
          <SectionLock variant="growth" />
        )}
      </div>

      {/* 5. "Milyen szerepkörök illenek hozzád?" — Plus+ */}
      <div>
        <div className="mb-6 flex items-center gap-2.5">
          <h2 className="font-fraunces text-2xl text-ink">
            {isHu ? "Milyen szerepkörök illenek hozzád?" : "Which roles fit you?"}
          </h2>
          {!isPlus && (
            <>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#8a8a9a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="3" y="9" width="14" height="10" rx="2" /><path d="M7 9V6a3 3 0 0 1 6 0v3" />
              </svg>
              <span className="rounded-full bg-warm-mid px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                Self Plus
              </span>
            </>
          )}
        </div>
        {isPlus ? (
          <CareerFit
            dimensions={Object.fromEntries(mainDims.map((d) => [d.code, d.score]))}
            locale={locale as Locale}
          />
        ) : (
          <SectionLock variant="career" />
        )}
      </div>

      {/* 6. "Hogyan látnak mások?" — Reflect+ */}
      <div>
        <div className="mb-6 flex items-center gap-2.5">
          <h2 className="font-fraunces text-2xl text-ink">
            {isHu ? "Hogyan látnak mások?" : "How do others see you?"}
          </h2>
          {!isReflect && (
            <>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#8a8a9a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="3" y="9" width="14" height="10" rx="2" /><path d="M7 9V6a3 3 0 0 1 6 0v3" />
              </svg>
              <span className="rounded-full bg-warm-mid px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                Self Reflect
              </span>
            </>
          )}
        </div>
        {isReflect ? (
          <ObserverComparison
            dimensions={observerDims}
            observerCount={observerCount}
            hasObserverData={hasObserverData}
            locale={locale as Locale}
          />
        ) : (
          <SectionLock variant="observer" />
        )}
      </div>

      {/* 7. "Mik a vakfoltjaid?" — Reflect+ */}
      <div>
        <div className="mb-6 flex items-center gap-2.5">
          <h2 className="font-fraunces text-2xl text-ink">
            {isHu ? "Mik a vakfoltjaid?" : "What are your blind spots?"}
          </h2>
          {!isReflect && (
            <>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#8a8a9a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="3" y="9" width="14" height="10" rx="2" /><path d="M7 9V6a3 3 0 0 1 6 0v3" />
              </svg>
              <span className="rounded-full bg-warm-mid px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted">
                Self Reflect
              </span>
            </>
          )}
        </div>
        {isReflect ? (
          <BlindSpotAnalysis
            dimensions={observerDims.map((d) => ({
              ...d,
              observerScore: d.observerScore ?? d.selfScore,
            }))}
            hasObserverData={hasObserverData}
            locale={locale as Locale}
          />
        ) : (
          <SectionLock variant="blindspot" />
        )}
      </div>

      {/* Upgrade banner — single CTA, level-aware */}
      {!isReflect && (
        <UpgradeBanner
          accessLevel={isPlus ? "plus" : "start"}
          isHu={isHu}
        />
      )}

    </div>
  );
}

interface ComparisonTabProps {
  dimensions: SerializedDimension[];
  hasObserverData: boolean;
  observerCount: number;
  isReflect: boolean;
  isHu: boolean;
  locale: string;
}

function ComparisonTab({
  dimensions,
  hasObserverData,
  observerCount,
  isReflect,
  isHu,
  locale,
}: ComparisonTabProps) {
  if (!isReflect) {
    return (
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
    );
  }

  const mainDims = dimensions.filter((d) => d.code !== "I");
  const observerDims = mainDims.map((d) => ({
    code: d.code,
    label: d.label,
    color: d.color,
    selfScore: d.score,
    observerScore: d.observerScore,
  }));

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <ObserverComparison
        dimensions={observerDims}
        observerCount={observerCount}
        hasObserverData={hasObserverData}
        locale={locale as Locale}
      />
      <div>
        <h2 className="mb-6 font-fraunces text-2xl text-ink">
          {isHu ? "Vakfolt-elemzés" : "Blind spot analysis"}
        </h2>
        <BlindSpotAnalysis
          dimensions={observerDims.map((d) => ({
            ...d,
            observerScore: d.observerScore ?? d.selfScore,
          }))}
          hasObserverData={hasObserverData}
          locale={locale as Locale}
        />
      </div>
    </div>
  );
}

interface InvitesTabProps {
  sentInvitations: SerializedSentInvitation[];
  receivedInvitations: SerializedReceivedInvitation[];
  isReflect: boolean;
  isHu: boolean;
  locale: string;
}

function InvitesTab({
  sentInvitations,
  receivedInvitations,
  isReflect,
  isHu,
  locale,
}: InvitesTabProps) {
  if (!isReflect) {
    return (
      <TabPaywall
        tier="self_reflect"
        tierLabel="Self Reflect"
        price="€12"
        isHu={isHu}
        teaser={
          isHu
            ? "A Self Reflect csomaggal meghívhatsz másokat observer-ként, akik kitöltik a felmérést rólad — és te látod, hogyan látnak."
            : "With Self Reflect you can invite others as observers to rate you — and see how they perceive you."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Observer invite management */}
      <InviteSection initialInvitations={sentInvitations} hasObserverAccess={true} />

      {/* Received invitations */}
      {receivedInvitations.length > 0 && (
        <section className="rounded-2xl border border-sand bg-white p-6 md:p-8">
          <h2 className="font-fraunces text-xl text-ink">
            {isHu ? "Beérkező meghívók" : "Received invitations"}
          </h2>
          <p className="mt-2 text-sm text-ink-body">
            {isHu
              ? "Ezek az emberek hívtak meg téged observer-ként."
              : "These people invited you as an observer."}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {receivedInvitations.map((inv) => {
              const name = inv.inviterUsername ?? (isHu ? "Névtelen" : "Anonymous");
              const isPending = inv.status === "PENDING";
              const isExpired = new Date(inv.expiresAt) < new Date();
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-sand px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        inv.status === "COMPLETED"
                          ? "bg-emerald-500"
                          : inv.status === "CANCELED" || isExpired
                            ? "bg-sand"
                            : "bg-amber-400"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-ink">{name}</p>
                      <p className="text-xs text-muted">
                        {inv.status === "COMPLETED"
                          ? isHu ? "Kitöltve" : "Completed"
                          : inv.status === "CANCELED"
                            ? isHu ? "Visszavonva" : "Canceled"
                            : isExpired
                              ? isHu ? "Lejárt" : "Expired"
                              : isHu ? "Függőben" : "Pending"}
                      </p>
                    </div>
                  </div>
                  {isPending && !isExpired && (
                    <Link
                      href={`/observe/${inv.token}`}
                      className="text-sm font-semibold text-bronze hover:text-bronze-dark"
                    >
                      {isHu ? "Kitölt →" : "Fill in →"}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
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
}: ProfileTabsProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [surveyOpen, setSurveyOpen] = useState(false);

  const isHu = locale === "hu";
  const isPlus = accessLevel !== "start";
  const isReflect = accessLevel === "reflect";

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

      {/* In-progress draft banner */}
      {hasDraft && draftTotalQuestions > 0 && (
        <div className="rounded-xl border border-sand bg-white p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                {isHu ? "Folyamatban lévő teszt" : "Assessment in progress"}
              </p>
              <p className="mt-0.5 text-sm text-ink-body">
                {isHu
                  ? `${draftAnsweredCount} / ${draftTotalQuestions} kérdés megválaszolva`
                  : `${draftAnsweredCount} / ${draftTotalQuestions} questions answered`}
              </p>
              <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-sage transition-all"
                  style={{
                    width: `${Math.round((draftAnsweredCount / draftTotalQuestions) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Link
                href="/assessment"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark"
              >
                {isHu ? "Folytatom →" : "Continue →"}
              </Link>
              <DiscardDraftButton />
            </div>
          </div>
        </div>
      )}

      {/* Profile header — above tabs */}
      <ProfileHeader
        name={name}
        assessmentDate={new Date(assessmentDate)}
        accessLevel={accessLevel}
        locale={locale}
      />

      {/* Research journey progress */}
      <JourneyProgress
        locale={locale as Locale}
        initialHasInvites={sentInvitations.length > 0}
        initialPendingInvites={pendingInvitesCount}
        hasObserverFeedback={hasObserverData}
        completedObserversCount={observerCount}
        onTabChange={(tab) => handleTabChange(tab)}
        surveySubmitted={hasResearchSurvey}
        onOpenSurvey={() => setSurveyOpen(true)}
      />

      {/* Tab bar */}
      <div
        ref={tabBarRef}
        className="scroll-mt-24 rounded-2xl border border-sand bg-white p-2 shadow-sm"
      >
        <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Profile navigation">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-3 text-xs font-semibold transition-all duration-200 md:flex-row md:gap-2 md:text-sm ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-sage to-sage-deep text-white shadow-md shadow-sage/25"
                  : "text-muted hover:bg-cream hover:text-ink-body"
              }`}
            >
              {tab.locked ? (
                <svg viewBox="0 0 12 14" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="6" width="10" height="7" rx="1.5" />
                  <path d="M3 6V4a3 3 0 0 1 6 0v2" />
                </svg>
              ) : tab.icon}
              <span className="truncate">{tab.label}</span>
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
            growthFocusItems={growthFocusItems}
            assessmentResultId={assessmentResultId}
            isPlus={isPlus}
            isReflect={isReflect}
            hasObserverData={hasObserverData}
            observerCount={observerCount}
            isHu={isHu}
            locale={locale}
          />
        )}
        {activeTab === "comparison" && (
          <ComparisonTab
            dimensions={dimensions}
            hasObserverData={hasObserverData}
            observerCount={observerCount}
            isReflect={isReflect}
            isHu={isHu}
            locale={locale}
          />
        )}
        {activeTab === "invites" && (
          <InvitesTab
            sentInvitations={sentInvitations}
            receivedInvitations={receivedInvitations}
            isReflect={isReflect}
            isHu={isHu}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}
