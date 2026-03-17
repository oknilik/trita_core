"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function memberAvatar(_seed: string) {
  return "/avatars/avatar-1.png";
}
import { useRouter } from "next/navigation";
import type { CampaignWithStats } from "@/lib/org-stats";

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
      <span className="w-36 truncate text-xs text-[#5a5650]">{label}</span>
      <div className="flex-1 h-[5px] rounded-full overflow-hidden bg-[#e8e4dc]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: fillColor }}
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-[#a09a90]">
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
          isHu
            ? `${data.remindedCount} személynek küldtünk emlékeztetőt`
            : `Reminded ${data.remindedCount} participant${data.remindedCount !== 1 ? "s" : ""}`
        );
        router.refresh();
      } else {
        setRemindResult(isHu ? "Hiba történt" : "Something went wrong");
      }
    } catch {
      setRemindResult(isHu ? "Hálózati hiba" : "Network error");
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
      <div className="flex items-center justify-between gap-3 py-3 border-b border-[#e8e4dc] last:border-0">
        <div className="min-w-0 flex items-center gap-2 flex-1">
          <span className="shrink-0 rounded-full bg-[#e8e4dc] px-2.5 py-0.5 text-xs font-semibold text-[#3d3a35]">
            {isHu ? "Lezárt" : "Closed"}
          </span>
          <p className="truncate text-sm font-semibold text-[#1a1814]">
            {campaign.name}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-[#a09a90] tabular-nums">
            {completionPct}% {isHu ? "teljes" : "complete"}
          </span>
          <Link
            href={`/org/${orgId}/campaigns/${campaign.id}`}
            className="text-xs font-semibold text-[#c8410a] hover:underline whitespace-nowrap"
          >
            {isHu ? "Összesítő →" : "Summary →"}
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
      <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {isHu ? "Vázlat" : "Draft"}
              </span>
            </div>
            <p className="font-semibold text-[#1a1814] text-sm">{campaign.name}</p>
            {campaign.description && (
              <p className="mt-0.5 text-xs text-[#5a5650] line-clamp-2">
                {campaign.description}
              </p>
            )}
          </div>
        </div>
        <p className="mb-3 text-xs text-[#a09a90]">
          {campaign.totalCount}{" "}
          {isHu
            ? "résztvevő hozzáadva"
            : campaign.totalCount === 1
              ? "participant added"
              : "participants added"}
        </p>
        <Link
          href={`/org/${orgId}/campaigns/${campaign.id}`}
          className="text-xs font-semibold text-[#c8410a] hover:underline"
        >
          {isHu ? "Szerkesztés →" : "Edit →"}
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
    <div className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              {isHu ? "Aktív" : "Active"}
            </span>
          </div>
          <Link
            href={`/org/${orgId}/campaigns/${campaign.id}`}
            className="group block"
          >
            <h3 className="font-playfair text-xl text-[#1a1814] group-hover:text-[#c8410a] transition-colors leading-tight">
              {campaign.name}
            </h3>
          </Link>
          {campaign.description && (
            <p className="mt-1 text-sm text-[#5a5650] line-clamp-2">
              {campaign.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta line */}
      <p className="mb-4 text-xs text-[#a09a90]">
        {isHu ? "Indítva:" : "Started:"} {dateStr}
        {" · "}
        {campaign.totalCount}{" "}
        {isHu
          ? "résztvevő"
          : campaign.totalCount === 1
            ? "participant"
            : "participants"}
      </p>

      {/* Progress bars */}
      {campaign.totalCount > 0 && (
        <div className="mb-5 flex flex-col gap-2.5">
          <ProgressBar
            label={isHu ? "Önértékelés kész" : "Self-assessment done"}
            count={campaign.selfDoneCount}
            total={campaign.totalCount}
            fillColor="#c8410a"
          />
          <ProgressBar
            label={isHu ? "Observer kész" : "Observer done"}
            count={campaign.observerDoneCount}
            total={campaign.totalCount}
            fillColor="#059669"
          />
          <ProgressBar
            label={isHu ? "Teljes befejezés" : "Fully complete"}
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
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#e8e4dc] text-xs font-semibold text-[#5a5650]">
                  +{campaign.participants.length - 6}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-[#a09a90]">
            {fullyDoneCount} {isHu ? "teljes" : "complete"} ·{" "}
            {inProgressCount} {isHu ? "folyamatban" : "in progress"} ·{" "}
            {notStartedCount} {isHu ? "nem kezdte" : "not started"}
          </p>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#e8e4dc]">
        <Link
          href={`/org/${orgId}/campaigns/${campaign.id}`}
          className="text-sm font-semibold text-[#c8410a] hover:underline"
        >
          {isHu ? "Kampány nézete →" : "View campaign →"}
        </Link>

        {isManager && notStartedCount > 0 && (
          <button
            type="button"
            onClick={handleRemind}
            disabled={reminding}
            className="min-h-[36px] rounded-lg border border-[#e8e4dc] bg-white px-4 text-xs font-semibold text-[#3d3a35] transition hover:border-[#c8410a]/40 hover:text-[#c8410a] disabled:opacity-50"
          >
            {reminding
              ? isHu ? "Küldés…" : "Sending…"
              : isHu
                ? `Emlékeztető (${notStartedCount})`
                : `Remind (${notStartedCount})`}
          </button>
        )}

        {remindResult && (
          <span className="text-xs text-[#5a5650]">{remindResult}</span>
        )}
      </div>
    </div>
  );
}
