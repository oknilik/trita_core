import Link from "next/link";
import { DashboardPanel, DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";
import { CAMPAIGN_STEP_LABELS } from "@/lib/campaign-steps-core";

// Mérés-idővonal — a csapathoz kötött kampányok listája (tanácsadó/vezető).
// A tanácsadói narratíva gerince: mi futott, mikor, mi aktív éppen.

export interface TeamMeasurementItem {
  id: string;
  orgId: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  closedAt: string | null;
}

// A lépés-címkék kanonikus forrása a campaign-steps-core (UX-audit #13:
// egy fogalom = egy szó, egy helyről) — itt nincs saját másolat.
const TYPE_LABELS: Record<string, { hu: string; en: string }> = CAMPAIGN_STEP_LABELS;

const STATUS_CHIPS: Record<string, { hu: string; en: string; cls: string }> = {
  DRAFT: { hu: "Vázlat", en: "Draft", cls: "bg-sand text-ink-body" },
  ACTIVE: { hu: "Aktív", en: "Active", cls: "bg-state-success-bg text-state-success-fg" },
  CLOSED: { hu: "Lezárt", en: "Closed", cls: "bg-cream text-muted border border-sand" },
};

export function TeamMeasurementTimeline({
  items,
  isHu,
}: {
  items: TeamMeasurementItem[];
  isHu: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <DashboardSectionHeader label={isHu ? "Mérések" : "Measurements"} className="mb-4" />
      <DashboardPanel className="p-2">
        <ul className="flex flex-col divide-y divide-sand">
          {items.map((item) => {
            const typeLabel = TYPE_LABELS[item.type]
              ? isHu
                ? TYPE_LABELS[item.type].hu
                : TYPE_LABELS[item.type].en
              : item.type;
            const chip = STATUS_CHIPS[item.status];
            const dateStr = new Date(item.createdAt).toLocaleDateString(
              isHu ? "hu-HU" : "en-GB",
              { year: "numeric", month: "short", day: "numeric" },
            );
            const closedStr = item.closedAt
              ? new Date(item.closedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : null;
            return (
              <li key={item.id}>
                <Link
                  href={`/org/${item.orgId}/campaigns/${item.id}`}
                  className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 rounded-[10px] px-3.5 py-2.5 transition hover:bg-cream"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-ink">{item.name}</span>
                    <span className="text-note text-muted">{typeLabel}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-note text-muted">
                      {dateStr}
                      {closedStr ? ` – ${closedStr}` : ""}
                    </span>
                    {chip && (
                      <span className={`rounded-full px-2.5 py-0.5 text-note font-semibold ${chip.cls}`}>
                        {isHu ? chip.hu : chip.en}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </DashboardPanel>
    </section>
  );
}
