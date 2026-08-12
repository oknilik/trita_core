"use client";

import Link from "next/link";
import { Button, getButtonClassName } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { dimColorsCss } from "@/lib/color-system";
import { HEXACO_ORDER } from "@/lib/hexaco";
import { poleAwareDimensionLabel } from "@/lib/profile-content";
import { deficitSlotEligible, strengthSlotEligible } from "@/lib/score-valence";
import { t, type Locale } from "@/lib/i18n";
import type {
  BridgeNextStep,
  ProfileTabsProps,
  SerializedDimension,
  SerializedSentInvitation,
} from "@/components/profile/ProfileTabs";
import type { JourneyExperienceHints } from "@/lib/journey/types";

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
  const workText =
    plusContent?.howYouWorkParts.main ??
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
      label: t("results.summaryWork", locale),
      text: workText,
      tone: "work",
    },
  ];
}

const TONE_CLASSES: Record<SummaryInsight["tone"], string> = {
  strength:
    "border-[var(--color-action-primary-bg)]/20 bg-[var(--color-surface-self-accent-soft)]",
  attention:
    "border-[var(--color-accent-primary)]/25 bg-[var(--color-surface-highlight-warm)]",
  work: "border-[var(--color-border-soft)] bg-surface-card",
};

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
  onOpenDetails,
  onOpenComparison,
  locale,
}: ProfileSummaryProps) {
  const ordered = orderedMainDimensions(dimensions);
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

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {insights.map((insight, index) => (
            <article
              key={insight.tone}
              className={`relative overflow-hidden rounded-2xl border p-5 ${TONE_CLASSES[insight.tone]}`}
            >
              <span className="absolute right-4 top-3 font-fraunces text-[34px] text-ink/[0.06]">
                0{index + 1}
              </span>
              <p className="relative pr-7 text-micro font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                {insight.label}
              </p>
              <p className="relative mt-3 text-body leading-relaxed text-[var(--color-text-secondary)]">
                {insight.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Card as="section" spacing="lg" className="border-[var(--color-border-soft)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
              {t("results.summaryDimensionsEyebrow", locale)}
            </p>
            <h2 className="mt-1.5 font-fraunces text-[22px] text-ink">
              {t("results.summaryDimensionsTitle", locale)}
            </h2>
          </div>
          <p className="max-w-sm text-micro leading-relaxed text-muted sm:text-right">
            {t("results.summaryScaleNote", locale)}
          </p>
        </div>

        <div className="mt-6 grid gap-x-8 gap-y-4 md:grid-cols-2">
          {ordered.map((dimension) => {
            const colors = dimColorsCss(dimension.code);
            return (
              <div key={dimension.code}>
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors.base }} />
                  <span className="min-w-0 flex-1 text-sm font-medium text-ink">{dimension.label}</span>
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-micro font-semibold"
                    style={{ backgroundColor: colors.soft, color: colors.strong }}
                  >
                    {poleAwareDimensionLabel(dimension.code, dimension.score, locale)}
                  </span>
                </div>
                <div
                  className="ml-5 mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border-default)]"
                  role="meter"
                  aria-label={dimension.label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={dimension.score}
                >
                  <div className="h-full rounded-full" style={{ width: `${dimension.score}%`, backgroundColor: colors.base }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

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

      <section className="rounded-2xl border border-[var(--color-border-soft)] bg-surface-card px-5 py-6 text-center md:px-8 md:py-8">
        <p className="font-fraunces text-xl text-ink">
          {t("results.summaryDetailsPrompt", locale)}
        </p>
        <p className="mx-auto mt-2 max-w-xl text-caption leading-relaxed text-muted">
          {t("results.summaryDetailsBody", locale)}
        </p>
        <Button type="button" onClick={onOpenDetails} variant="ghost" className="mt-5 rounded-xl px-5">
          {t("results.summaryOpenDetails", locale)} →
        </Button>
      </section>
    </div>
  );
}
