"use client";

import { TeamHeatmap } from "@/components/manager/TeamHeatmap";
import { TeamInsights } from "@/components/manager/TeamInsights";
import type { TeamPageData } from "@/lib/team-stats";

interface TeamProfileTabProps {
  heatmapRows: TeamPageData["heatmapRows"];
  dimConfigs: TeamPageData["dimConfigs"];
  locale: string;
  isHu: boolean;
}

export function TeamProfileTab({
  heatmapRows,
  dimConfigs,
  locale,
  isHu,
}: TeamProfileTabProps) {
  const hasData =
    heatmapRows.length > 0 &&
    heatmapRows.some((r) =>
      Object.values(r.scores).some((v) => v !== null)
    );

  if (!hasData) {
    return (
      <div className="pt-6">
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-[#5a5650]">
            {heatmapRows.length === 0
              ? isHu
                ? "Még nincs csapattag. Hívj meg valakit a Tagok fülön!"
                : "No team members yet. Invite someone on the Members tab!"
              : isHu
              ? "Még egyik csapattag sem töltötte ki az assessmentet."
              : "No team members have completed an assessment yet."}
          </p>
        </div>
      </div>
    );
  }

  const dims = dimConfigs.map((d) => ({
    code: d.code,
    label: d.label,
    color: d.color,
  }));

  return (
    <div className="flex flex-col gap-8 pt-6">
      {/* Heatmap */}
      <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8 overflow-x-auto">
        <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
          {isHu ? "// személyiségprofil" : "// personality profile"}
        </p>
        <h2 className="font-playfair text-xl text-[#1a1814] mb-1">
          {isHu ? "Csapat személyiségprofil" : "Team Personality Heatmap"}
        </h2>
        <p className="mb-6 text-sm text-[#3d3a35]/70">
          {isHu
            ? "Minden oszlop egy HEXACO személyiségdimenziót mutat — minél mélyebb a szín, annál magasabb a pontszám."
            : "Each column represents a HEXACO personality dimension — deeper color means a higher score."}
        </p>
        <TeamHeatmap rows={heatmapRows} dims={dims} isHu={isHu} />
      </section>

      {/* Team insights */}
      {heatmapRows.some((r) =>
        dimConfigs.some((d) => r.scores[d.code] !== null)
      ) && (
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// elemzés" : "// analysis"}
          </p>
          <h2 className="font-playfair text-xl text-[#1a1814] mb-5">
            {isHu ? "Csapatelemzés" : "Team Analysis"}
          </h2>
          <TeamInsights rows={heatmapRows} dims={dims} isHu={isHu} />
        </section>
      )}
    </div>
  );
}
