"use client";

import { useState } from "react";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { EmptyState } from "@/components/ui/primitives/EmptyState";
import { CrmDealListRow } from "@/components/admin/crm/CrmDealListRow";
import type { CrmDealRow } from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// Lezártak — WON/LOST (90 nap) + a parkolt (DORMANT) dealek, outcome-
// szűrővel. A win/loss tanulság (outcomeKind + jegyzet) itt olvasható
// vissza — ez a termék-visszacsatolás nyersanyaga.
// ─────────────────────────────────────────────────────────────────────

type ClosedFilter = "ALL" | "WON" | "LOST" | "DORMANT";

const FILTER_LABELS: Record<ClosedFilter, string> = {
  ALL: "Mind",
  WON: "Megnyert",
  LOST: "Lezárt",
  DORMANT: "Később",
};

export function CrmClosedPanel({
  closedRecent,
  dormant,
}: {
  /** WON/LOST az elmúlt 90 napból (closedAt desc). */
  closedRecent: CrmDealRow[];
  /** Parkolt (DORMANT) dealek — nyitottak, de kint a napi nyomás alól. */
  dormant: CrmDealRow[];
}) {
  const [filter, setFilter] = useState<ClosedFilter>("ALL");

  const rows =
    filter === "DORMANT"
      ? dormant
      : filter === "ALL"
        ? [...closedRecent, ...dormant]
        : closedRecent.filter((deal) => deal.stage === filter);

  return (
    <DashboardPanel className="p-5 md:p-6">
      <SectionEyebrow>lezárt ügyek</SectionEyebrow>
      <h2 className="mt-1 font-fraunces text-xl text-ink">Lezárt és későbbre tett ügyek</h2>
      <p className="mt-1 text-xs text-ink-body">
        Az elmúlt 90 nap döntései és azok az ügyek, amelyekkel most nem kell
        foglalkoznod. A lezárás oka és tanulsága itt később is visszanézhető.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Lezárt ügyek szűrője">
        {(Object.keys(FILTER_LABELS) as ClosedFilter[]).map((item) => {
          const active = filter === item;
          return (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setFilter(item)}
              className={`min-h-[40px] rounded-full border px-3.5 text-sm transition ${
                active
                  ? "border-sage bg-sage-soft font-semibold text-ink"
                  : "border-sand bg-surface-card text-muted hover:border-bronze-edge hover:text-ink-body"
              }`}
            >
              {FILTER_LABELS[item]}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="Nincs találat ezzel a szűrővel."
          description="Az ügyeket a részletnézetből zárhatod le vagy teheted későbbre."
        />
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {rows.map((deal) => (
            <CrmDealListRow
              key={deal.id}
              deal={deal}
              variant={deal.stage === "DORMANT" ? "open" : "closed"}
              showStageChip
            />
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}
