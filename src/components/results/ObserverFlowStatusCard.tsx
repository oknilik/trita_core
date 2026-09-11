"use client";

import { t, tf } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { Button } from "@/components/ui/primitives/Button";
import { ChevronRightIcon } from "@/components/ui/icons";

export interface ObserverFlowCardData {
  state: "locked" | "in_progress" | "available";
  receivedCount: number;
  minForReveal: number;
  activeCampaignName: string | null;
}

export function ObserverFlowStatusCard({ flow, isHu, onOpenComparison }: {
  flow: ObserverFlowCardData;
  isHu: boolean;
  onOpenComparison?: () => void;
}) {
  const locale = isHu ? "hu" : "en";
  const available = flow.state === "available";
  const inProgress = flow.state === "in_progress";
  const titleKey = available ? "flowAvailableTitle" : inProgress ? "flowProgressTitle" : "flowLockedTitle";
  const bodyKey = available ? "flowAvailableBody" : inProgress ? "flowProgressBody" : "flowLockedBody";
  return (
    <section className={`rounded-2xl border p-6 md:p-8 ${available ? "border-sage-ring bg-sage-ghost" : "border-sand bg-surface-card"}`}>
      <SectionEyebrow>{t("observer.flowEyebrow", locale)}</SectionEyebrow>
      <h2 className="mt-2 font-fraunces text-heading text-ink">{t(`observer.${titleKey}`, locale)}</h2>
      {inProgress && flow.activeCampaignName ? (
        <p className="mt-2 text-caption font-medium text-ink">{tf("observer.flowCampaign", locale, { name: flow.activeCampaignName })}</p>
      ) : null}
      <p className="mt-2 text-body leading-relaxed text-ink-body">{tf(`observer.${bodyKey}`, locale, { count: flow.receivedCount })}</p>
      {inProgress ? (
        <>
          <p className="mt-3 text-caption leading-relaxed text-ink-body">{t("observer.flowAccessBody", locale)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <progress className="h-2 min-w-0 flex-1 accent-sage" value={Math.min(flow.receivedCount, Math.max(1, flow.minForReveal))} max={Math.max(1, flow.minForReveal)} aria-label={t("observer.flowProgressTitle", locale)} />
            <span className="text-caption tabular-nums text-ink">{flow.receivedCount}/{flow.minForReveal}</span>
          </div>
          <p className="mt-3 text-caption leading-relaxed text-ink-body">{tf("observer.flowRevealBody", locale, { count: flow.minForReveal })}</p>
        </>
      ) : null}
      {available && onOpenComparison ? (
        <Button onClick={onOpenComparison} className="mt-4">{t("observer.flowOpenComparison", locale)}<ChevronRightIcon /></Button>
      ) : null}
      {!available && !inProgress ? <p className="mt-3 text-caption text-ink-body">{t("observer.flowSelfCompleteBody", locale)}</p> : null}
    </section>
  );
}

export function ObserverFlowStrip({ flow, isHu, onOpenInvites, onOpenComparison }: {
  flow: ObserverFlowCardData;
  isHu: boolean;
  onOpenInvites?: () => void;
  onOpenComparison?: () => void;
}) {
  const locale = isHu ? "hu" : "en";
  const available = flow.state === "available";
  const key = available ? "flowStripAvailable" : flow.state === "in_progress" ? "flowStripProgress" : "flowStripLocked";
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sand bg-surface-card px-4 py-3">
      <span className="rounded-full bg-sage-ghost px-3 py-2 text-caption font-semibold text-sage-dark">{t("observer.flowSelfComplete", locale)}</span>
      <Button variant="ghost" onClick={available ? onOpenComparison : onOpenInvites}>
        {tf(`observer.${key}`, locale, { count: flow.receivedCount, min: flow.minForReveal })}
        <ChevronRightIcon className="shrink-0" />
      </Button>
    </div>
  );
}
