"use client";

import Image from "next/image";
import Link from "next/link";

function memberAvatar(_seed: string) {
  return "/avatars/avatar-1.png";
}
import type { TeamPageData } from "@/lib/team-stats";

interface TeamOverviewTabProps {
  data: TeamPageData;
  isHu: boolean;
  dateLocale: string;
  locale: string;
}

const DIM_ORDER = ["H", "E", "X", "A", "C", "O"] as const;

const STRENGTH_INSIGHTS_HU: Record<string, string> = {
  H: "Kiemelkedő etikai alapok és megbízhatóság a csapatban.",
  E: "Érzelmi reziliencia és stabilitás jellemzi a csapatot.",
  X: "Magas energiaszint, társas nyitottság, jó csapatdinamika.",
  A: "Kiváló együttműködési készség és empatikus kommunikáció.",
  C: "Kiemelkedő szervezettség, megbízható feladatvégzés.",
  O: "Kreatív gondolkodás, kíváncsiság, innovációra való nyitottság.",
};

const STRENGTH_INSIGHTS_EN: Record<string, string> = {
  H: "Strong ethical foundation and reliability.",
  E: "Strong emotional resilience in the team.",
  X: "High energy and social openness.",
  A: "Excellent cooperation and empathy.",
  C: "High organization and reliable execution.",
  O: "Creative thinking and openness to innovation.",
};

const GROWTH_INSIGHTS_HU: Record<string, string> = {
  H: "Az etikai normák és elvárások tudatosabb kommunikációja erősítheti a bizalmat.",
  E: "Az érzelmi kommunikáció és empátia fejlesztése értékes lehet a csapatban.",
  X: "A proaktív kommunikáció és csapatkapcsolatok erősítése hasznos fejlesztési irány.",
  A: "A konfliktusmegoldás és közvetlen visszajelzés kultúrájának fejlesztése ajánlott.",
  C: "Strukturált folyamatok és prioritizálási eszközök bevezetése segíthet.",
  O: "A változásokra való nyitottság és kreatív gondolkodás erősítése hasznos lehet.",
};

const GROWTH_INSIGHTS_EN: Record<string, string> = {
  H: "More explicit communication of ethical norms can strengthen trust.",
  E: "Developing emotional communication and empathy is valuable.",
  X: "Strengthening proactive communication and team connections is a useful direction.",
  A: "Building a culture of conflict resolution and direct feedback is recommended.",
  C: "Introducing structured processes and prioritization tools can help.",
  O: "Building openness to change and creative thinking can be beneficial.",
};

const AVATAR_COLORS = [
  "#6366F1",
  "#EC4899",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4",
];

function getAvatarColor(name: string): string {
  const hash = name
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function TeamOverviewTab({
  data,
  isHu,
  dateLocale,
  locale,
}: TeamOverviewTabProps) {
  const strengthInsights = isHu ? STRENGTH_INSIGHTS_HU : STRENGTH_INSIGHTS_EN;
  const growthInsights = isHu ? GROWTH_INSIGHTS_HU : GROWTH_INSIGHTS_EN;

  // Compute std devs for diversity
  let diverseDim: string | null = null;
  let diverseStdDev = 0;
  if (data.members.length >= 2) {
    const stdDevs: Record<string, number> = {};
    for (const code of DIM_ORDER) {
      const vals = data.members
        .map((m) => m.scores?.[code])
        .filter((v): v is number => v !== null && v !== undefined);
      if (vals.length >= 2) {
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance =
          vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
        stdDevs[code] = Math.round(Math.sqrt(variance));
      }
    }
    const entry = Object.entries(stdDevs).sort((a, b) => b[1] - a[1])[0];
    if (entry) {
      diverseDim = entry[0];
      diverseStdDev = entry[1];
    }
  }

  const topDimConfig = data.topDim
    ? data.dimConfigs.find((d) => d.code === data.topDim!.code)
    : null;
  const bottomDimConfig = data.bottomDim
    ? data.dimConfigs.find((d) => d.code === data.bottomDim!.code)
    : null;
  const diverseDimConfig = diverseDim
    ? data.dimConfigs.find((d) => d.code === diverseDim)
    : null;

  const { activeCampaign } = data;

  return (
    <div className="flex flex-col gap-6 pt-6">
      {/* Active campaign banner */}
      {activeCampaign && (
        <div className="rounded-2xl border-[1.5px] border-[#1D9E75] bg-gradient-to-r from-[#f0fdf4] to-[#ecfdf5] p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Pulsing green dot */}
            <span className="relative mt-1 flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[#1a1814] truncate">
                  {activeCampaign.name}
                </p>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {isHu ? "Aktív" : "Active"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#5a5650]">
                {activeCampaign.teamSelfDoneCount}/
                {activeCampaign.teamParticipantCount}{" "}
                {isHu ? "önértékelés" : "self-assessment"} ·{" "}
                {activeCampaign.teamObserverDoneCount}/
                {activeCampaign.teamParticipantCount}{" "}
                {isHu ? "observer" : "observer"} ·{" "}
                {activeCampaign.daysActive} {isHu ? "nap" : "days"}
              </p>
            </div>
          </div>
          <Link
            href={`/org/${activeCampaign.orgId}/campaigns/${activeCampaign.id}`}
            className="min-h-[36px] self-start md:self-auto inline-flex items-center rounded-lg bg-[#1D9E75] px-4 text-xs font-semibold text-white transition hover:bg-[#158c66] whitespace-nowrap shrink-0"
          >
            {isHu ? "Kampány nézete →" : "View campaign →"}
          </Link>
        </div>
      )}

      {/* Empty state: no completed assessments */}
      {data.completedCount === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[#e8e4dc] bg-white p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[#a09a90]">
            // {isHu ? "nincs adat" : "no data yet"}
          </p>
          <p className="mt-3 font-playfair text-xl text-[#1a1814]">
            {isHu
              ? "Még nincs kitöltött értékelés"
              : "No completed assessments yet"}
          </p>
          <p className="mt-2 text-sm text-[#5a5650]">
            {isHu
              ? "Indíts egy 360° kampányt, hogy a csapattagok megkezdhessék az értékeléseket."
              : "Start a 360° campaign so team members can begin their assessments."}
          </p>
          {data.orgId && (
            <a
              href={`/org/${data.orgId}?tab=campaigns`}
              className="mt-5 inline-flex min-h-[44px] items-center rounded-lg bg-[#c8410a] px-5 text-sm font-semibold text-white transition hover:bg-[#b53a09]"
            >
              {isHu ? "Kampány indítása" : "Start a campaign"}
            </a>
          )}
        </div>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: HEXACO profile card */}
        <div className="rounded-2xl border border-[#e8e4dc] bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-[#f0ede6] flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#c8410a]">
                // {isHu ? "csapat átlag · önkép" : "team avg · self"}
              </p>
              <h2 className="font-playfair text-xl text-[#1a1814] mt-0.5">
                HEXACO {isHu ? "profil" : "profile"}
              </h2>
            </div>
            <p className="text-xs text-[#a09a90] shrink-0">
              {data.completedCount} {isHu ? "fő · önértékelés" : "members · self"}
            </p>
          </div>
          <div className="p-6">
            {data.dimAvg === null ? (
              <div className="rounded-xl bg-[#faf9f6] border border-[#e8e4dc] p-6 text-center">
                <p className="text-sm text-[#5a5650]">
                  {isHu
                    ? "Még nincs kitöltött assessment. A profilok megjelenítéséhez legalább 1 tag töltse ki."
                    : "No completed assessments yet."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {data.dimConfigs.map((dim) => {
                    const value = data.dimAvg?.[dim.code];
                    if (value === undefined) return null;
                    const insight = value >= 70
                      ? (isHu ? strengthInsights[dim.code] : (STRENGTH_INSIGHTS_EN[dim.code] ?? ""))
                      : (isHu ? growthInsights[dim.code] : (GROWTH_INSIGHTS_EN[dim.code] ?? ""));
                    return (
                      <div key={dim.code} className="group relative flex items-center gap-3">
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-lg bg-[#1a1814] p-3 text-xs text-white shadow-lg group-hover:block">
                          <p className="mb-1 font-semibold">{dim.label}: {value}%</p>
                          <p className="text-[11px] leading-relaxed text-[#a09a90]">{insight}</p>
                        </div>
                        {/* Dim code pill */}
                        <span
                          className="w-8 h-6 rounded flex items-center justify-center text-[10px] font-mono font-semibold text-white shrink-0"
                          style={{ backgroundColor: dim.color }}
                        >
                          {dim.code}
                        </span>
                        {/* Dim label */}
                        <span className="w-[130px] text-xs text-[#5a5650] truncate shrink-0">
                          {dim.label}
                        </span>
                        {/* Bar */}
                        <div className="flex-1 h-[5px] bg-[#e8e4dc] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${value}%`,
                              backgroundColor: dim.color + "cc",
                            }}
                          />
                        </div>
                        {/* Value */}
                        <span className="text-xs text-[#3d3a35] w-10 text-right tabular-nums font-mono shrink-0">
                          {value}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Observer note */}
                <div className="mt-4 border-t border-[#f0ede6] pt-4">
                  <p className="font-mono text-[11px] text-[#a09a90]">
                    {isHu
                      ? "Observer adat: nincs — indíts 360° kampányt az összehasonlításhoz"
                      : "No observer data — start a 360° campaign for comparison"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Csapatdinamika */}
          <div className="rounded-2xl border border-[#e8e4dc] bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-[#f0ede6]">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#c8410a]">
                // {isHu ? "csapatdinamika" : "team dynamics"}
              </p>
              <h2 className="font-playfair text-xl text-[#1a1814] mt-0.5">
                {isHu ? "Kulcs jellemzők" : "Key characteristics"}
              </h2>
            </div>
            <div className="p-6">
              {!data.dimAvg ? (
                <p className="text-sm text-[#5a5650]">
                  {isHu
                    ? "Nincs elég adat az elemzéshez."
                    : "Not enough data for analysis."}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Strength */}
                  {topDimConfig && data.topDim && (
                    <div className="bg-[#e8f7f1] border border-[#a0d8c4] rounded-xl p-4">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#059669] mb-1">
                        // {isHu ? "csapat erőssége" : "team strength"}
                      </p>
                      <p className="text-sm font-semibold text-[#1a1814]">
                        {topDimConfig.code} · {topDimConfig.label}
                      </p>
                      <p className="text-xs text-[#3d3a35]/70 mt-1">
                        {data.topDim.value}% —{" "}
                        {strengthInsights[topDimConfig.code] ?? ""}
                      </p>
                    </div>
                  )}

                  {/* Growth area */}
                  {bottomDimConfig &&
                    data.bottomDim &&
                    data.bottomDim.code !== data.topDim?.code && (
                      <div className="bg-[#fff8ee] border border-[#f5d99a] rounded-xl p-4">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-[#b45309] mb-1">
                          // {isHu ? "fejlesztési terület" : "growth area"}
                        </p>
                        <p className="text-sm font-semibold text-[#1a1814]">
                          {bottomDimConfig.code} · {bottomDimConfig.label}
                        </p>
                        <p className="text-xs text-[#3d3a35]/70 mt-1">
                          {data.bottomDim.value}% —{" "}
                          {growthInsights[bottomDimConfig.code] ?? ""}
                        </p>
                      </div>
                    )}

                  {/* Diversity */}
                  {diverseDimConfig && diverseStdDev >= 8 && (
                    <div className="bg-[#eee9fc] border border-[#c8bef5] rounded-xl p-4">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#7c3aed] mb-1">
                        // {isHu ? "legnagyobb sokszínűség" : "most diverse"}
                      </p>
                      <p className="text-sm font-semibold text-[#1a1814]">
                        {diverseDimConfig.code} · {diverseDimConfig.label}
                      </p>
                      <p className="text-xs text-[#3d3a35]/70 mt-1">
                        ±{diverseStdDev} —{" "}
                        {isHu
                          ? "A csapattagok eltérő megközelítéseket és perspektívákat hoznak erre a területre."
                          : "Team members bring diverse perspectives to this area."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Members mini list */}
          <div className="rounded-2xl border border-[#e8e4dc] bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-[#f0ede6] flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#c8410a]">
                  // {isHu ? "tagok" : "members"}
                </p>
                <h2 className="font-playfair text-xl text-[#1a1814] mt-0.5">
                  {isHu ? `Csapattagok (${data.memberCount})` : `Members (${data.memberCount})`}
                </h2>
              </div>
            </div>
            <div className="p-4 max-h-60 overflow-y-auto">
              {data.members.length === 0 ? (
                <p className="text-xs text-[#a09a90] text-center py-4">
                  {isHu ? "Még nincsenek tagok." : "No members yet."}
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-[#f0ede6]">
                  {data.members.map((member) => {
                    const selfDone = member.scores !== null;
                    const avatarColor = getAvatarColor(member.displayName);
                    const initials = getInitials(member.displayName);
                    const top3Text = member.top3Dims
                      .map((d) => `${d.code}:${d.value}%`)
                      .join(" · ");

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Image
                            src={memberAvatar(member.id)}
                            alt={member.displayName}
                            width={32}
                            height={32}
                            unoptimized
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1a1814] truncate">
                              {member.displayName}
                            </p>
                            {top3Text && (
                              <p className="text-[10px] font-mono text-[#a09a90] truncate">
                                {top3Text}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {selfDone ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              {isHu ? "✓ Kész" : "✓ Done"}
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#e8e4dc] px-2 py-0.5 text-[10px] text-[#a09a90]">
                              {isHu ? "◌ Függőben" : "◌ Pending"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
