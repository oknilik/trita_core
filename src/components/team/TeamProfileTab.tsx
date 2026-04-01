"use client";

import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { TeamHeatmap } from "@/components/manager/TeamHeatmap";
import { TeamInsights } from "@/components/manager/TeamInsights";
import { Card } from "@/components/ui/primitives/Card";
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
  const loc: Locale = isHu ? "hu" : "en";
  const hasData =
    heatmapRows.length > 0 &&
    heatmapRows.some((r) =>
      Object.values(r.scores).some((v) => v !== null)
    );

  if (!hasData) {
    return (
      <div className="pt-6">
        <Card spacing="lg" className="p-10 text-center">
          <p className="text-sm text-ink-body">
            {heatmapRows.length === 0
              ? t("teamComp.noMembersProfile", loc)
              : t("teamComp.noAssessmentProfile", loc)}
          </p>
        </Card>
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
      <Card as="section" spacing="lg" className="overflow-x-auto md:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-1">
          {t("teamComp.personalityProfileEyebrow", loc)}
        </p>
        <h2 className="font-fraunces text-xl text-ink mb-1">
          {t("teamComp.teamHeatmapTitle", loc)}
        </h2>
        <p className="mb-6 text-sm text-ink-body/70">
          {t("teamComp.heatmapDesc", loc)}
        </p>
        <TeamHeatmap rows={heatmapRows} dims={dims} isHu={isHu} />
      </Card>

      {/* Team insights */}
      {heatmapRows.some((r) =>
        dimConfigs.some((d) => r.scores[d.code] !== null)
      ) && (
        <Card as="section" spacing="lg" className="md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-1">
            {t("teamComp.analysisEyebrow", loc)}
          </p>
          <h2 className="font-fraunces text-xl text-ink mb-5">
            {t("teamComp.teamAnalysis", loc)}
          </h2>
          <TeamInsights rows={heatmapRows} dims={dims} isHu={isHu} />
        </Card>
      )}
    </div>
  );
}
