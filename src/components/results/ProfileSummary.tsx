"use client";

import Link from "next/link";
import { Button, getButtonClassName } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { HEXACO_ORDER } from "@/lib/hexaco";
import { deficitSlotEligible, strengthSlotEligible } from "@/lib/score-valence";
import { t, type Locale } from "@/lib/i18n";
import type {
  BridgeNextStep,
  ProfileTabsProps,
  SerializedDimension,
  SerializedSentInvitation,
} from "@/components/profile/ProfileTabs";
import type { JourneyExperienceHints } from "@/lib/journey/types";
import { ResultClarityFeedback } from "@/components/results/ResultClarityFeedback";

interface ProfileSummaryProps {
  dimensions: SerializedDimension[];
  plusContent?: ProfileTabsProps["plusContent"];
  bridgeNextStep?: BridgeNextStep;
  observerFlow?: ProfileTabsProps["observerFlow"];
  sentInvitations: SerializedSentInvitation[];
  observerCount: number;
  hasObserverData: boolean;
  experienceHints?: JourneyExperienceHints;
  experienceHintDestination?: string;
  clarityFeedbackSubmitted: boolean;
  onOpenDetails: () => void;
  onOpenComparison: () => void;
  locale: Locale;
}

interface SummaryInsight {
  label: string;
  text: string;
  tone: "strength" | "attention" | "work";
}

function orderedMainDimensions(dimensions: SerializedDimension[]): SerializedDimension[] {
  return HEXACO_ORDER
    .map((code) => dimensions.find((dimension) => dimension.code === code))
    .filter((dimension): dimension is SerializedDimension => Boolean(dimension));
}

export function buildProfileSummaryInsights(
  dimensions: SerializedDimension[],
  plusContent: ProfileTabsProps["plusContent"] | undefined,
  locale: Locale,
): SummaryInsight[] {
  const ordered = orderedMainDimensions(dimensions);
  const ranked = [...ordered].sort((a, b) => b.score - a.score);
  const strongest =
    ranked.find((dimension) => strengthSlotEligible(dimension.code, "self") && dimension.score >= 70) ??
    ranked[0];
  const attention = [...ordered]
    .filter((dimension) => deficitSlotEligible(dimension.code) && dimension.score < 40)
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
    {
      label: t("results.summaryNatural", locale),
      text: mainText,
      tone: "strength",
    },
    {
      label: t("results.summaryAttention", locale),
      text: attentionText,
      tone: "attention",
    },
    {
      label: t("results.summaryGrowth", locale),
      text: growthText,
      tone: "work",
    },
  ];
}

function NextStepSummary({
  bridgeNextStep,
  observerFlow,
  sentInvitations,
  observerCount,
  hasObserverData,
  onOpenComparison,
  locale,
}: Pick<
  ProfileSummaryProps,
  | "bridgeNextStep"
  | "observerFlow"
  | "sentInvitations"
  | "observerCount"
  | "hasObserverData"
  | "onOpenComparison"
  | "locale"
>) {
  if (!bridgeNextStep) return null;

  const target = observerFlow?.minForReveal ?? 3;
  const isObserverStep =
    !hasObserverData &&
    (observerFlow?.state === "in_progress" || sentInvitations.length > 0 || observerCount > 0);
  const progress = Math.min(100, Math.round((observerCount / Math.max(target, 1)) * 100));

  return (
    <Card
      as="section"
      surface="self"
      spacing="lg"
      className="overflow-hidden border-[var(--color-action-primary-bg)]/20 bg-gradient-to-br from-[var(--color-surface-self-accent-soft)] to-surface-card"
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-accent-self-deep)]">
            {t("results.summaryNextStep", locale)}
          </p>
          <h2 className="mt-2 font-fraunces text-[22px] leading-tight text-ink">
            {bridgeNextStep.primary.label}
          </h2>
          <p className="mt-2 max-w-2xl text-caption leading-relaxed text-ink-body">
            {bridgeNextStep.explanation}
          </p>
          {isObserverStep ? (
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-micro font-semibold text-muted">
                <span>{t("results.summaryOutsideFeedback", locale)}</span>
                <span>{observerCount}/{target}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border-default)]">
                <div
                  className="h-full rounded-full bg-[var(--color-action-primary-bg)] transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
          <Link
            href={bridgeNextStep.primary.href}
            className={getButtonClassName({ size: "md", className: "justify-center rounded-xl px-5" })}
          >
            {bridgeNextStep.primary.label}
          </Link>
          {isObserverStep ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenComparison}
              className="justify-center rounded-xl"
            >
              {t("results.summaryOpenOutside", locale)}
            </Button>
          ) : bridgeNextStep.secondary ? (
            <Link
              href={bridgeNextStep.secondary.href}
              className={getButtonClassName({ variant: "ghost", size: "sm", className: "justify-center rounded-xl" })}
            >
              {bridgeNextStep.secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function ProfileSummary({
  dimensions,
  plusContent,
  bridgeNextStep,
  observerFlow,
  sentInvitations,
  observerCount,
  hasObserverData,
  experienceHints,
  experienceHintDestination,
  clarityFeedbackSubmitted,
  onOpenDetails,
  onOpenComparison,
  locale,
}: ProfileSummaryProps) {
  const insights = buildProfileSummaryInsights(dimensions, plusContent, locale);

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <section aria-labelledby="summary-heading">
        <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
          {t("results.summaryEyebrow", locale)}
        </p>
        <h2 id="summary-heading" className="mt-2 max-w-2xl font-fraunces text-[26px] leading-tight text-ink md:text-[30px]">
          {t("results.summaryTitle", locale)}
        </h2>
        <p className="mt-2 max-w-2xl text-caption leading-relaxed text-muted">
          {t("results.summaryBody", locale)}
        </p>

        <div className="mt-7 overflow-hidden rounded-[20px] border border-[var(--color-border-soft)] bg-surface-card px-5 md:px-7">
          {insights.map((insight, index) => (
            <article
              key={insight.tone}
              className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 border-t border-[var(--color-border-soft)] py-5 first:border-t-0 md:grid-cols-[42px_minmax(0,1fr)] md:py-6"
            >
              <span className="pt-0.5 font-mono text-micro font-semibold tracking-widest text-[var(--color-accent-primary-strong)]">
                0{index + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">{insight.label}</h3>
                <p className="mt-1.5 max-w-2xl text-caption leading-relaxed text-ink-body">
                  {insight.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="summary-explore-heading">
        <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
          {t("results.summaryExploreEyebrow", locale)}
        </p>
        <h2 id="summary-explore-heading" className="mt-2 font-fraunces text-[24px] leading-tight text-ink">
          {t("results.summaryExploreTitle", locale)}
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
          <button
            type="button"
            onClick={onOpenDetails}
            className="group flex min-h-[116px] w-full items-center justify-between gap-5 rounded-[18px] bg-sage px-5 py-5 text-left text-[var(--color-action-primary-fg)] shadow-[var(--ui-shadow-sm)] transition hover:bg-sage-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)] focus-visible:ring-offset-2 md:px-6"
          >
            <span>
              <strong className="block font-fraunces text-[22px] font-medium">
                {t("results.summaryDetailsPrompt", locale)}
              </strong>
              <span className="mt-1.5 block max-w-sm text-xs leading-relaxed text-[var(--color-text-on-inverse-muted)]">
                {t("results.summaryDetailsMeta", locale)}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg transition group-hover:translate-x-0.5 group-hover:bg-white/15"
            >
              →
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenComparison}
            className="group flex min-h-[116px] w-full items-center justify-between gap-5 rounded-[18px] border border-[var(--color-border-soft)] bg-surface-card px-5 py-5 text-left shadow-[var(--ui-shadow-sm)] transition hover:border-[var(--color-state-hover-border)] hover:bg-[var(--color-state-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-state-focus-ring)] focus-visible:ring-offset-2 md:px-6"
          >
            <span>
              <strong className="block font-fraunces text-[20px] font-medium text-ink">
                {t("results.summaryComparisonTitle", locale)}
              </strong>
              <span className="mt-1.5 block text-xs leading-relaxed text-muted">
                {t(hasObserverData ? "results.summaryComparisonReadyBody" : "results.summaryComparisonStartBody", locale)}
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-lg text-sage-dark transition group-hover:translate-x-0.5">
              →
            </span>
          </button>
        </div>
      </section>

      <NextStepSummary
        bridgeNextStep={bridgeNextStep}
        observerFlow={observerFlow}
        sentInvitations={sentInvitations}
        observerCount={observerCount}
        hasObserverData={hasObserverData}
        onOpenComparison={onOpenComparison}
        locale={locale}
      />

      {experienceHints?.showOrgExpansionPrompt || experienceHints?.showAssessmentContinuation ? (
        <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-3 text-caption leading-relaxed text-ink-body">
          {experienceHints.showOrgExpansionPrompt ? (
            <p>
              {t("results.summaryPendingOrg", locale)}{" "}
              <Link
                href={experienceHintDestination ?? "/profile/results"}
                className="font-semibold text-[var(--color-accent-primary-strong)] no-underline"
              >
                {t("results.summaryOpenInvitation", locale)} →
              </Link>
            </p>
          ) : null}
          {experienceHints.showAssessmentContinuation ? (
            <p>
              {t("results.summaryAssessmentInProgress", locale)}{" "}
              <Link href="/assessment" className="font-semibold text-[var(--color-accent-primary-strong)] no-underline">
                {t("results.summaryContinue", locale)} →
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {!clarityFeedbackSubmitted ? (
        <ResultClarityFeedback initialSubmitted={false} locale={locale} />
      ) : null}
    </div>
  );
}
