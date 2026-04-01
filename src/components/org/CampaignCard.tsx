"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function memberAvatar(_seed: string) {
  return "/avatars/avatar-1.png";
}
import { useRouter } from "next/navigation";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { CampaignWithStats } from "@/lib/org-stats";
import { StatusChip } from "@/components/ui/primitives/StatusChip";

interface CampaignCardProps {
  campaign: CampaignWithStats;
  orgId: string;
  isHu: boolean;
  isManager?: boolean;
  variant: "active" | "draft" | "closed";
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function ProgressBar({
  label,
  count,
  total,
  fillColor,
}: {
  label: string;
  count: number;
  total: number;
  fillColor: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 truncate text-xs text-ink-body">{label}</span>
      <div className="flex-1 h-[5px] rounded-full overflow-hidden bg-sand">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: fillColor }}
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-muted">
        {count}/{total}
      </span>
    </div>
  );
}

export function CampaignCard({
  campaign,
  orgId,
  isHu,
  isManager,
  variant,
}: CampaignCardProps) {
  const router = useRouter();
  const loc: Locale = isHu ? "hu" : "en";
  const [reminding, setReminding] = useState(false);
  const [remindResult, setRemindResult] = useState<string | null>(null);

  const fullyDoneCount = campaign.participants.filter(
    (p) => p.selfDone && p.observerCount > 0
  ).length;
  const notStartedCount = campaign.participants.filter(
    (p) => !p.selfDone
  ).length;

  const dateStr = new Date(campaign.createdAt).toLocaleDateString(
    isHu ? "hu-HU" : "en-GB"
  );

  async function handleRemind() {
    setReminding(true);
    setRemindResult(null);
    try {
      const res = await fetch(
        `/api/org/${orgId}/campaigns/${campaign.id}/remind`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setRemindResult(
          tf(
            data.remindedCount !== 1
              ? "org.card.remindedResultPlural"
              : "org.card.remindedResult",
            loc,
            { count: data.remindedCount }
          )
        );
        router.refresh();
      } else {
        setRemindResult(t("org.card.remindError", loc));
      }
    } catch {
      setRemindResult(t("org.card.remindNetworkError", loc));
    } finally {
      setReminding(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CLOSED VARIANT — compact row
  // ──────────────────────────────────────────────────────────────────────────
  if (variant === "closed") {
    const completionPct =
      campaign.totalCount > 0
        ? Math.round((campaign.selfDoneCount / campaign.totalCount) * 100)
        : 0;
    return (
      <div className="flex items-center justify-between gap-3 py-3 border-b border-sand last:border-0">
        <div className="min-w-0 flex items-center gap-2 flex-1">
          <StatusChip variant="neutral" className="shrink-0">
            {t("org.card.closed", loc)}
          </StatusChip>
          <p className="truncate text-sm font-semibold text-ink">
            {campaign.name}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-muted tabular-nums">
            {completionPct}% {t("org.card.complete", loc)}
          </span>
          <Link
            href={`/org/${orgId}/campaigns/${campaign.id}`}
            className="text-xs font-semibold text-bronze hover:underline whitespace-nowrap"
          >
            {t("org.card.summaryLink", loc)}
          </Link>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DRAFT VARIANT — compact card
  // ──────────────────────────────────────────────────────────────────────────
  if (variant === "draft") {
    return (
      <div className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusChip variant="warning">
                {t("org.card.draft", loc)}
              </StatusChip>
            </div>
            <p className="font-semibold text-ink text-sm">{campaign.name}</p>
            {campaign.description && (
              <p className="mt-0.5 text-xs text-ink-body line-clamp-2">
                {campaign.description}
              </p>
            )}
          </div>
        </div>
        <p className="mb-3 text-xs text-muted">
          {campaign.totalCount}{" "}
          {t(campaign.totalCount === 1 ? "org.card.participantsAdded" : "org.card.participantsAddedPlural", loc)}
        </p>
        <Link
          href={`/org/${orgId}/campaigns/${campaign.id}`}
          className="text-xs font-semibold text-bronze hover:underline"
        >
          {t("org.card.editLink", loc)}
        </Link>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACTIVE VARIANT — full card
  // ──────────────────────────────────────────────────────────────────────────
  const inProgressCount = campaign.participants.filter(
    (p) => p.selfDone && p.observerCount === 0
  ).length;

  return (
    <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <StatusChip variant="success">
              {t("org.card.active", loc)}
            </StatusChip>
          </div>
          <Link
            href={`/org/${orgId}/campaigns/${campaign.id}`}
            className="group block"
          >
            <h3 className="font-fraunces text-xl text-ink group-hover:text-bronze transition-colors leading-tight">
              {campaign.name}
            </h3>
          </Link>
          {campaign.description && (
            <p className="mt-1 text-sm text-ink-body line-clamp-2">
              {campaign.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta line */}
      <p className="mb-4 text-xs text-muted">
        {t("org.card.started", loc)} {dateStr}
        {" · "}
        {campaign.totalCount}{" "}
        {t(campaign.totalCount === 1 ? "org.card.participantSingular" : "org.card.participantPlural", loc)}
      </p>

      {/* Progress bars */}
      {campaign.totalCount > 0 && (
        <div className="mb-5 flex flex-col gap-2.5">
          <ProgressBar
            label={t("org.card.selfDone", loc)}
            count={campaign.selfDoneCount}
            total={campaign.totalCount}
            fillColor="#3d6b5e"
          />
          <ProgressBar
            label={t("org.card.observerDone", loc)}
            count={campaign.observerDoneCount}
            total={campaign.totalCount}
            fillColor="#059669"
          />
          <ProgressBar
            label={t("org.card.fullyComplete", loc)}
            count={fullyDoneCount}
            total={campaign.totalCount}
            fillColor="#6366F1"
          />
        </div>
      )}

      {/* Avatar stack */}
      {campaign.participants.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className="flex -space-x-1.5">
              {campaign.participants.slice(0, 6).map((p) => (
                <div
                  key={p.userId}
                  title={p.username ?? p.email ?? "?"}
                  className={[
                    "inline-block h-8 w-8 rounded-full border-2 overflow-hidden",
                    p.selfDone ? "border-emerald-200" : "border-white",
                  ].join(" ")}
                >
                  <Image
                    src={memberAvatar(p.userId)}
                    alt={p.username ?? p.email ?? "?"}
                    width={32}
                    height={32}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
              {campaign.participants.length > 6 && (
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sand text-xs font-semibold text-ink-body">
                  +{campaign.participants.length - 6}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted">
            {fullyDoneCount} {t("org.card.fullyDoneLabel", loc)} ·{" "}
            {inProgressCount} {t("org.card.inProgress", loc)} ·{" "}
            {notStartedCount} {t("org.card.notStarted", loc)}
          </p>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-sand">
        <Link
          href={`/org/${orgId}/campaigns/${campaign.id}`}
          className="text-sm font-semibold text-bronze hover:underline"
        >
          {t("org.card.viewLink", loc)}
        </Link>

        {isManager && notStartedCount > 0 && (
          <button
            type="button"
            onClick={handleRemind}
            disabled={reminding}
            className="min-h-[36px] rounded-lg border border-sand bg-white px-4 text-xs font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze disabled:opacity-50"
          >
            {reminding
              ? t("org.card.sending", loc)
              : tf("org.card.remindButton", loc, { count: notStartedCount })}
          </button>
        )}

        {remindResult && (
          <span className="text-xs text-ink-body">{remindResult}</span>
        )}
      </div>
    </div>
  );
}
