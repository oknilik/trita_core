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
} from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// CRM fül — négy alnézet a napi hurok sorrendjében: Ma → Beérkező →
// Pipeline → Lezártak. A váltás kliens-oldali (minden adat egy szerver-
// render-ben jön), az induló nézet a ?view= paraméterből jöhet (pl. az
// INQUIRY_RECEIVED notif a Beérkezőre mélylinkel).
// ─────────────────────────────────────────────────────────────────────

export type CrmView = "today" | "inbox" | "pipeline" | "closed";

export function isCrmView(value: string | undefined): value is CrmView {
  return value === "today" || value === "inbox" || value === "pipeline" || value === "closed";
}

export function AdminCrmSection({
  initialView = "today",
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

  const openCount = stageGroups.reduce((sum, group) => sum + group.count, 0);
  const dormant = stageGroups.find((group) => group.stage === "DORMANT")?.deals ?? [];

  const tabs: Array<{ id: CrmView; label: string; count?: number }> = [
    { id: "today", label: "Ma", count: due.length },
    { id: "inbox", label: "Beérkező", count: intake.length },
    { id: "pipeline", label: "Pipeline", count: openCount },
    { id: "closed", label: "Lezártak" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="CRM nézetek"
        className="flex w-max max-w-full gap-1.5 overflow-x-auto rounded-xl border border-sand bg-white p-1.5"
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
              className={`flex min-h-[42px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-sm font-semibold transition ${
                active ? "bg-bronze text-white shadow-sm" : "text-muted hover:bg-cream hover:text-ink"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-micro font-semibold leading-none ${
                    active ? "bg-white text-bronze" : "bg-state-warning-bg text-state-warning-fg"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {view === "today" && <CrmTodayPanel deals={due} />}
      {view === "inbox" && <CrmInboxPanel inquiries={intake} openDeals={openDealOptions} />}
      {view === "pipeline" && <CrmPipelinePanel stageGroups={stageGroups} metrics={metrics} />}
      {view === "closed" && <CrmClosedPanel closedRecent={closedRecent} dormant={dormant} />}
    </div>
  );
}
