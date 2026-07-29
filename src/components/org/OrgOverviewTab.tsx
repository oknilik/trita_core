"use client";

import Link from "next/link";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { SerializedTeam, CampaignWithStats } from "@/lib/org-stats";
import { Card } from "@/components/ui/primitives/Card";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { NextStepBanner } from "./NextStepBanner";
import { RemindPendingButton } from "./RemindPendingButton";

const TRITAN_COLORS: Record<string, string> = {
  INTE: "var(--color-visual-gradient-indigo)",
  RESO: "var(--color-visual-gradient-violet)",
  TEMP: "#06B6D4",
  ADAP: "var(--color-state-success-strong)",
  THOR: "var(--color-state-warning-strong)",
  OPEN: "#EF4444",
};

const TRITAN_LABELS_HU: Record<string, string> = {
  INTE: "Becsületesség-Alázat",
  RESO: "Emocionalitás",
  TEMP: "Extraverzió",
  ADAP: "Barátságosság",
  THOR: "Lelkiismeretesség",
  OPEN: "Nyitottság",
};

const TRITAN_LABELS_EN: Record<string, string> = {
  INTE: "Honesty-Humility",
  RESO: "Emotionality",
  TEMP: "eXtraversion",
  ADAP: "Agreeableness",
  THOR: "Conscientiousness",
  OPEN: "Openness",
};

interface OrgOverviewTabProps {
  tritanAvg: Record<string, number> | null;
  teams: SerializedTeam[];
  orgId: string;
  campaigns: CampaignWithStats[];
  memberCount: number;
  completedMemberCount: number;
  activeCampaignCount: number;
  isHu: boolean;
  dateLocale: string;
  isManager: boolean;
}

export function OrgOverviewTab({
  tritanAvg,
  teams,
  orgId,
  campaigns,
  memberCount,
  completedMemberCount,
  activeCampaignCount,
  isHu,
  isManager,
}: OrgOverviewTabProps) {
  const loc: Locale = isHu ? "hu" : "en";
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const dims = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"];

  // Compute top2 and bottom1 for insight chips
  let insightChips: { label: string; color: string; kind: "top" | "bottom" }[] = [];
  if (tritanAvg) {
    const sorted = dims
      .map((d) => ({ d, v: tritanAvg[d] ?? 0 }))
      .sort((a, b) => b.v - a.v);
    const labels = isHu ? TRITAN_LABELS_HU : TRITAN_LABELS_EN;
    insightChips = [
      { label: labels[sorted[0].d], color: TRITAN_COLORS[sorted[0].d], kind: "top" },
      { label: labels[sorted[1].d], color: TRITAN_COLORS[sorted[1].d], kind: "top" },
      {
        label: labels[sorted[sorted.length - 1].d],
        color: TRITAN_COLORS[sorted[sorted.length - 1].d],
        kind: "bottom",
      },
    ];
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Next step banner */}
      <NextStepBanner
        orgId={orgId}
        memberCount={memberCount}
        activeCampaignCount={activeCampaignCount}
        completedMemberCount={completedMemberCount}
        tritanAvg={tritanAvg}
        isHu={isHu}
      />

      {/* Active campaign banner */}
      {activeCampaigns.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {activeCampaigns.length === 1
                    ? tf("org.overview.activeCampaignSingle", loc, { name: activeCampaigns[0].name })
                    : tf("org.overview.activeCampaignMultiple", loc, { count: activeCampaigns.length })}
                </p>
                {activeCampaigns.length === 1 && (
                  <p className="mt-0.5 text-xs text-emerald-700">
                    {activeCampaigns[0].selfDoneCount}/{activeCampaigns[0].totalCount}{" "}
                    {t("org.overview.selfAssessmentsDone", loc)}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/org/${orgId}?tab=campaigns`}
              className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline whitespace-nowrap"
            >
              {t("org.overview.campaignsLink", loc)}
            </Link>
          </div>
        </div>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Szervezeti személyiség */}
        <Card spacing="lg">
          <SectionEyebrow className="mb-1">
            {t("org.overview.profileEyebrow", loc)}
          </SectionEyebrow>
          <h3 className="mb-4 font-fraunces text-xl text-ink">
            {t("org.overview.profileTitle", loc)}
          </h3>

          {!tritanAvg ? (
            <div className="flex flex-col gap-4 rounded-xl border border-sand bg-cream p-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-caption font-semibold text-ink">
                    {tf("org.overview.completionProgress", loc, { count: completedMemberCount })}
                  </p>
                  <span className="font-mono text-micro text-muted">
                    {Math.round((completedMemberCount / 3) * 100)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-sage transition-all duration-700"
                    style={{ width: `${Math.min((completedMemberCount / 3) * 100, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-ink-body">
                  {t("org.overview.profileHint", loc)}
                </p>
              </div>
              {isManager && (
                <RemindPendingButton orgId={orgId} isHu={isHu} />
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {dims.map((d) => {
                const val = tritanAvg[d] ?? 0;
                const label = isHu ? TRITAN_LABELS_HU[d] : TRITAN_LABELS_EN[d];
                return (
                  <div key={d} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 text-xs text-ink-body truncate">{label}</span>
                    <div className="flex-1 h-[6px] rounded-full overflow-hidden bg-sand">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${val}%`, backgroundColor: TRITAN_COLORS[d] }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs tabular-nums text-muted">
                      {val}
                    </span>
                  </div>
                );
              })}

              {/* Insight chips */}
              {insightChips.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {insightChips.map((chip, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: chip.color + "18",
                        color: chip.color,
                      }}
                    >
                      {chip.kind === "top" ? "↑" : "↓"} {chip.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Right: Csapatok */}
        <Card spacing="lg">
          <SectionEyebrow className="mb-1">
            {t("org.overview.teamsEyebrow", loc)}
          </SectionEyebrow>
          <h3 className="mb-4 font-fraunces text-xl text-ink">
            {t("org.overview.teamsTitle", loc)}
            {teams.length > 0 && (
              <span className="ml-2 font-sans text-sm font-normal text-ink-body/50">
                ({teams.length})
              </span>
            )}
          </h3>

          {teams.length === 0 ? (
            <div className="rounded-xl border border-sand bg-cream p-6 text-center">
              <p className="text-sm text-ink-body/60">
                {t("org.overview.noTeams", loc)}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/team/${team.id}`}
                  className="group flex items-center justify-between rounded-xl border border-sand bg-cream p-3.5 transition-all hover:border-sage/30 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink transition-colors group-hover:text-bronze">
                      {team.name}
                    </p>
                    <p className="text-xs text-ink-body/60">
                      {team._count.members}{" "}
                      {t(team._count.members === 1 ? "org.overview.teamMemberCount" : "org.overview.teamMembersCount", loc)}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-bronze opacity-0 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
