"use client";

import {
  DashboardMetricCard,
  DashboardPanel,
} from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { EmptyState } from "@/components/ui/primitives/EmptyState";
import { DEAL_STAGE_LABELS, type DealStage } from "@/lib/crm/constants";
import { huf } from "@/components/admin/crm/crm-ui";
import { CrmDealListRow } from "@/components/admin/crm/CrmDealListRow";
import type { CrmPipelineMetrics, CrmStageGroup } from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// Pipeline — stage-csoportos LISTA (nem kanban): fejlécben darab +
// összérték, felül metrika-kártyák. A next-action-hiány és a lejárt
// lépés soronként vizuális warning (CrmDealListRow).
// ─────────────────────────────────────────────────────────────────────

export function CrmPipelinePanel({
  stageGroups,
  metrics,
}: {
  stageGroups: CrmStageGroup[];
  metrics: CrmPipelineMetrics;
}) {
  const openCount = stageGroups.reduce((sum, group) => sum + group.count, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DashboardMetricCard
          accent="var(--color-action-primary-bg)"
          title="Nyitott pipeline-érték"
          value={huf(metrics.openValueTotal)}
          sub={`${openCount} nyitott deal · SENT ajánlat összege felülírja a becslést`}
        />
        <DashboardMetricCard
          accent="var(--color-state-warning-solid)"
          title="Kint lévő ajánlatok"
          value={huf(metrics.outstandingSentTotal)}
          sub="Kiküldött, még el nem döntött ajánlatok nettó összege"
        />
        <DashboardMetricCard
          accent="var(--color-state-success-solid)"
          title="Win-rate (30 nap)"
          value={metrics.winRate30d != null ? `${metrics.winRate30d}%` : "—"}
          sub={
            metrics.winRate30d != null
              ? "Az utolsó 30 napban lezárt dealek nyerési aránya"
              : "Nem zárult deal az elmúlt 30 napban"
          }
        />
      </div>

      <DashboardPanel className="p-5 md:p-6">
        <SectionEyebrow>pipeline</SectionEyebrow>
        <h2 className="mt-1 font-fraunces text-xl text-ink">Nyitott dealek stage-enként</h2>

        {openCount === 0 ? (
          <EmptyState
            className="mt-4"
            title="Üres a pipeline."
            description="A Beérkezőből kvalifikálhatsz megkeresést, vagy hozz létre dealt kézzel egy ajánlásból / kimenő megkeresésből."
          />
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            {stageGroups.map((group) => (
              <section key={group.stage}>
                <div className="flex flex-wrap items-baseline gap-2 border-b border-sand pb-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
                    {DEAL_STAGE_LABELS[group.stage as DealStage] ?? group.stage}
                  </h3>
                  <span className="text-xs text-muted">
                    {group.count} deal
                    {group.valueTotal > 0 ? ` · ${huf(group.valueTotal)}` : ""}
                  </span>
                </div>
                {group.count === 0 ? (
                  <p className="mt-2 text-xs text-muted">Nincs deal ebben a stage-ben.</p>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    {group.deals.map((deal) => (
                      <CrmDealListRow key={deal.id} deal={deal} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
