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
      <DashboardPanel className="p-5 md:p-6">
        <SectionEyebrow>aktív ügyek</SectionEyebrow>
        <h2 className="mt-1 font-fraunces text-xl text-ink">Folyamatban lévő ügyek</h2>
        <p className="mt-1 text-xs text-ink-body">
          Az ügyek a jelenlegi állapotuk szerint követik egymást. Minden sorban
          a következő vállalt teendő a legfontosabb jelzés.
        </p>

        {openCount === 0 ? (
          <EmptyState
            className="mt-4"
            title="Nincs aktív ügy."
            description="Az új megkeresésekből a Teendők nézetben hozhatsz létre ügyet."
          />
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            {stageGroups.filter((group) => group.count > 0).map((group) => (
              <section key={group.stage}>
                <div className="flex flex-wrap items-baseline gap-2 border-b border-sand pb-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
                    {DEAL_STAGE_LABELS[group.stage as DealStage] ?? group.stage}
                  </h3>
                  <span className="text-xs text-muted">
                    {group.count} ügy
                    {group.valueTotal > 0 ? ` · ${huf(group.valueTotal)}` : ""}
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  {group.deals.map((deal) => (
                    <CrmDealListRow key={deal.id} deal={deal} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </DashboardPanel>

      <details className="group rounded-2xl border border-sand bg-surface-card shadow-[var(--ui-shadow-sm)]">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-semibold text-ink marker:content-none">
          <span>Üzleti összesítés</span>
          <span className="text-xs font-normal text-muted group-open:hidden">Megnyitás</span>
          <span className="hidden text-xs font-normal text-muted group-open:inline">Bezárás</span>
        </summary>
        <div className="grid grid-cols-1 gap-3 border-t border-sand p-4 sm:grid-cols-3">
          <DashboardMetricCard
            accent="var(--color-action-primary-bg)"
            title="Aktív ügyek értéke"
            value={huf(metrics.openValueTotal)}
            sub={`${openCount} aktív ügy becsült vagy kiküldött ajánlati értéke`}
          />
          <DashboardMetricCard
            accent="var(--color-state-warning-solid)"
            title="Döntésre váró ajánlatok"
            value={huf(metrics.outstandingSentTotal)}
            sub="A kiküldött, még el nem döntött ajánlatok nettó összege"
          />
          <DashboardMetricCard
            accent="var(--color-state-success-solid)"
            title="Sikeres lezárások (30 nap)"
            value={metrics.winRate30d != null ? `${metrics.winRate30d}%` : "–"}
            sub={
              metrics.winRate30d != null
                ? "Az elmúlt 30 napban lezárt ügyek közül megnyert ügyek aránya"
                : "Az elmúlt 30 napban még nem zárult ügy"
            }
          />
        </div>
      </details>
    </div>
  );
}
