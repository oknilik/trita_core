"use client";

import Link from "next/link";
import type { SerializedTeam, CampaignWithStats } from "@/lib/org-stats";

const HEXACO_COLORS: Record<string, string> = {
  H: "#6366F1",
  E: "#8B5CF6",
  X: "#06B6D4",
  A: "#10B981",
  C: "#F59E0B",
  O: "#EF4444",
};

const HEXACO_LABELS_HU: Record<string, string> = {
  H: "Önzetlenség",
  E: "Érzelmi stabilitás",
  X: "Extraverzió",
  A: "Barátságosság",
  C: "Lelkiismeretesség",
  O: "Nyitottság",
};

const HEXACO_LABELS_EN: Record<string, string> = {
  H: "Honesty-Humility",
  E: "Emotionality",
  X: "eXtraversion",
  A: "Agreeableness",
  C: "Conscientiousness",
  O: "Openness",
};

interface OrgOverviewTabProps {
  hexacoAvg: Record<string, number> | null;
  teams: SerializedTeam[];
  orgId: string;
  campaigns: CampaignWithStats[];
  memberCount: number;
  isHu: boolean;
  dateLocale: string;
}

export function OrgOverviewTab({
  hexacoAvg,
  teams,
  orgId,
  campaigns,
  isHu,
}: OrgOverviewTabProps) {
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const dims = ["H", "E", "X", "A", "C", "O"];

  // Compute top2 and bottom1 for insight chips
  let insightChips: { label: string; color: string; kind: "top" | "bottom" }[] = [];
  if (hexacoAvg) {
    const sorted = dims
      .map((d) => ({ d, v: hexacoAvg[d] ?? 0 }))
      .sort((a, b) => b.v - a.v);
    const labels = isHu ? HEXACO_LABELS_HU : HEXACO_LABELS_EN;
    insightChips = [
      { label: labels[sorted[0].d], color: HEXACO_COLORS[sorted[0].d], kind: "top" },
      { label: labels[sorted[1].d], color: HEXACO_COLORS[sorted[1].d], kind: "top" },
      {
        label: labels[sorted[sorted.length - 1].d],
        color: HEXACO_COLORS[sorted[sorted.length - 1].d],
        kind: "bottom",
      },
    ];
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Active campaign banner */}
      {activeCampaigns.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {activeCampaigns.length === 1
                    ? isHu
                      ? `Aktív kampány: ${activeCampaigns[0].name}`
                      : `Active campaign: ${activeCampaigns[0].name}`
                    : isHu
                      ? `${activeCampaigns.length} aktív kampány folyamatban`
                      : `${activeCampaigns.length} active campaigns in progress`}
                </p>
                {activeCampaigns.length === 1 && (
                  <p className="mt-0.5 text-xs text-emerald-700">
                    {activeCampaigns[0].selfDoneCount}/{activeCampaigns[0].totalCount}{" "}
                    {isHu ? "önértékelés kész" : "self-assessments done"}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/org/${orgId}?tab=campaigns`}
              className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline whitespace-nowrap"
            >
              {isHu ? "Kampányok →" : "Campaigns →"}
            </Link>
          </div>
        </div>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Szervezeti személyiség */}
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">
            {isHu ? "// szervezeti profil" : "// org profile"}
          </p>
          <h3 className="mb-4 font-playfair text-xl text-[#1a1814]">
            {isHu ? "Szervezeti személyiség" : "Org personality"}
          </h3>

          {!hexacoAvg ? (
            <div className="rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-6 text-center">
              <p className="text-sm font-semibold text-[#1a1814] mb-1">
                {isHu ? "Nincs elég adat" : "Not enough data"}
              </p>
              <p className="text-xs text-[#5a5650]">
                {isHu
                  ? "Minimum 3 kitöltés szükséges a szervezeti személyiségprofil megjelenítéséhez."
                  : "At least 3 completed assessments are required to display the org personality profile."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {dims.map((d) => {
                const val = hexacoAvg[d] ?? 0;
                const label = isHu ? HEXACO_LABELS_HU[d] : HEXACO_LABELS_EN[d];
                return (
                  <div key={d} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 text-xs text-[#5a5650] truncate">{label}</span>
                    <div className="flex-1 h-[6px] rounded-full overflow-hidden bg-[#e8e4dc]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${val}%`, backgroundColor: HEXACO_COLORS[d] }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs tabular-nums text-[#a09a90]">
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
        </div>

        {/* Right: Csapatok */}
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">
            {isHu ? "// csapatok" : "// teams"}
          </p>
          <h3 className="mb-4 font-playfair text-xl text-[#1a1814]">
            {isHu ? "Csapatok" : "Teams"}
            {teams.length > 0 && (
              <span className="ml-2 font-sans text-sm font-normal text-[#3d3a35]/50">
                ({teams.length})
              </span>
            )}
          </h3>

          {teams.length === 0 ? (
            <div className="rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-6 text-center">
              <p className="text-sm text-[#3d3a35]/60">
                {isHu
                  ? "Még nincs csapat. Hozz létre egyet a Csapatok fülön!"
                  : "No teams yet. Create one in the Teams tab!"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/team/${team.id}`}
                  className="group flex items-center justify-between rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-3.5 transition-all hover:border-[#c8410a]/30 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1a1814] transition-colors group-hover:text-[#c8410a]">
                      {team.name}
                    </p>
                    <p className="text-xs text-[#3d3a35]/60">
                      {team._count.members}{" "}
                      {isHu ? "tag" : team._count.members === 1 ? "member" : "members"}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[#c8410a] opacity-0 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
