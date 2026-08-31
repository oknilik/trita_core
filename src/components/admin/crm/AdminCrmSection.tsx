"use client";

import { useState } from "react";
import { CrmTodayPanel } from "@/components/admin/crm/CrmTodayPanel";
import { CrmInboxPanel } from "@/components/admin/crm/CrmInboxPanel";
import { CrmPipelinePanel } from "@/components/admin/crm/CrmPipelinePanel";
import { CrmClosedPanel } from "@/components/admin/crm/CrmClosedPanel";
import type {
  CrmDealRow,
  CrmIntakeRow,
  CrmOpenDealOption,
  CrmPipelineMetrics,
  CrmStageGroup,
  CrmView,
} from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// CRM fül — három emberi nézetben: Teendők → Aktív ügyek → Lezárt ügyek.
// A váltás kliens-oldali (minden adat egy szerver-
// render-ben jön), az induló nézet a ?view= paraméterből jöhet (pl. az
// INQUIRY_RECEIVED notif a Beérkezőre mélylinkel).
// ─────────────────────────────────────────────────────────────────────

export function AdminCrmSection({
  initialView = "tasks",
  due,
  intake,
  stageGroups,
  metrics,
  closedRecent,
  openDealOptions,
}: {
  initialView?: CrmView;
  due: CrmDealRow[];
  intake: CrmIntakeRow[];
  stageGroups: CrmStageGroup[];
  metrics: CrmPipelineMetrics;
  closedRecent: CrmDealRow[];
  openDealOptions: CrmOpenDealOption[];
}) {
  const [view, setView] = useState<CrmView>(initialView);

  const activeGroups = stageGroups.filter((group) => group.stage !== "DORMANT");
  const openCount = activeGroups.reduce((sum, group) => sum + group.count, 0);
  const dormant = stageGroups.find((group) => group.stage === "DORMANT")?.deals ?? [];

  const tabs: Array<{ id: CrmView; label: string; count?: number }> = [
    { id: "tasks", label: "Teendők", count: due.length + intake.length },
    { id: "pipeline", label: "Aktív ügyek", count: openCount },
    { id: "closed", label: "Lezárt ügyek" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="CRM nézetek"
        className="flex w-full max-w-2xl gap-1.5 overflow-x-auto rounded-2xl border border-sand bg-surface-card p-1.5 shadow-[var(--ui-shadow-sm)]"
      >
        {tabs.map((tab) => {
          const active = view === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setView(tab.id)}
              className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 text-sm font-semibold transition ${
                active ? "bg-sage-soft text-sage-dark shadow-sm" : "text-muted hover:bg-cream hover:text-ink"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-micro font-semibold leading-none ${
                    active ? "bg-surface-card text-sage-dark" : "bg-state-warning-bg text-state-warning-fg"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {view === "tasks" && (
        <div className="flex flex-col gap-4">
          <CrmInboxPanel inquiries={intake} openDeals={openDealOptions} />
          <CrmTodayPanel deals={due} />
        </div>
      )}
      {view === "pipeline" && <CrmPipelinePanel stageGroups={activeGroups} metrics={metrics} />}
      {view === "closed" && <CrmClosedPanel closedRecent={closedRecent} dormant={dormant} />}
    </div>
  );
}
