"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TeamReportActionItem } from "@/lib/team-report";
import { actionStatus, summarizeTeamActions } from "@/lib/team-action-tracking";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

export function TeamActionTracker({
  teamId,
  reportId,
  initialItems,
  isHu,
  canManage,
}: {
  teamId: string;
  reportId: string;
  initialItems: TeamReportActionItem[];
  isHu: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const todayIso = new Date().toISOString().slice(0, 10);
  const summary = useMemo(
    () => summarizeTeamActions(items, todayIso),
    [items, todayIso],
  );

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/team/${teamId}/report/actions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          actionItems: items.map((item) => ({
            ...item,
            owner: item.owner?.trim() || undefined,
            dueDate: item.dueDate || undefined,
            status: actionStatus(item),
          })),
        }),
      });
      if (!response.ok) throw new Error("SAVE_FAILED");
      setMessage(isHu ? "A követési állapot mentve." : "Tracking status saved.");
      router.refresh();
    } catch {
      setMessage(isHu ? "A mentés nem sikerült. Próbáld újra." : "Saving failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const statusLabels = {
    not_started: isHu ? "Még nem indult" : "Not started",
    in_progress: isHu ? "Folyamatban" : "In progress",
    blocked: isHu ? "Elakadt" : "Blocked",
    done: isHu ? "Kész" : "Done",
  };

  return (
    <section aria-labelledby="action-tracking-title">
      <div className="mb-3">
        <SectionEyebrow>{isHu ? "heti vezetői fókusz" : "weekly leadership focus"}</SectionEyebrow>
        <h2 id="action-tracking-title" className="mt-1 font-fraunces text-xl text-ink">
          {isHu ? "Akciókövetés" : "Action tracking"}
        </h2>
      </div>
      <DashboardPanel className="p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            [isHu ? "Kész" : "Done", summary.done],
            [isHu ? "Folyamatban" : "In progress", summary.inProgress],
            [isHu ? "Elakadt" : "Blocked", summary.blocked],
            [isHu ? "Lejárt" : "Overdue", summary.overdue],
            [isHu ? "7 napon belül" : "Due in 7 days", summary.dueSoon],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-sand bg-cream/50 p-3">
              <p className="font-fraunces text-2xl text-ink">{value}</p>
              <p className="text-micro text-muted">{label}</p>
            </div>
          ))}
        </div>

        {(summary.blocked > 0 || summary.overdue > 0) && (
          <p className="mt-3 rounded-xl border border-state-warning-border bg-state-warning-bg px-3 py-2 text-xs font-medium text-state-warning-fg">
            {isHu
              ? `${summary.blocked} elakadt és ${summary.overdue} lejárt akció kér vezetői döntést.`
              : `${summary.blocked} blocked and ${summary.overdue} overdue actions need a leadership decision.`}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-xl border border-sand bg-surface-card p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-0.5 text-micro text-muted">{item.timeframe} {isHu ? "napos fókusz" : "day focus"}</p>
                </div>
                {!canManage ? (
                  <span className="rounded-full bg-cream px-2.5 py-1 text-micro font-semibold text-ink-body">
                    {statusLabels[actionStatus(item)]}
                  </span>
                ) : null}
              </div>
              {canManage ? (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    value={item.owner ?? ""}
                    placeholder={isHu ? "Felelős" : "Owner"}
                    onChange={(event) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, owner: event.target.value } : entry))}
                    className="min-h-[42px] rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink"
                  />
                  <input
                    type="date"
                    value={item.dueDate ?? ""}
                    aria-label={isHu ? "Határidő" : "Due date"}
                    onChange={(event) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, dueDate: event.target.value } : entry))}
                    className="min-h-[42px] rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink"
                  />
                  <select
                    value={actionStatus(item)}
                    aria-label={isHu ? "Státusz" : "Status"}
                    onChange={(event) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, status: event.target.value as TeamReportActionItem["status"] } : entry))}
                    className="min-h-[42px] rounded-lg border border-sand bg-surface-card px-3 text-sm text-ink"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              ) : (
                <p className="mt-2 text-xs text-ink-body">
                  {item.owner ? `${isHu ? "Felelős" : "Owner"}: ${item.owner}` : isHu ? "Nincs felelős megadva" : "No owner assigned"}
                  {item.dueDate ? ` · ${isHu ? "Határidő" : "Due"}: ${item.dueDate}` : ""}
                </p>
              )}
            </div>
          ))}
        </div>
        {canManage ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" disabled={busy} onClick={save} className="inline-flex min-h-[42px] items-center rounded-lg bg-sage px-4 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark disabled:opacity-50">
              {busy ? (isHu ? "Mentés…" : "Saving…") : (isHu ? "Követés mentése" : "Save tracking")}
            </button>
            {message ? <p className="text-xs text-muted" role="status">{message}</p> : null}
          </div>
        ) : null}
      </DashboardPanel>
    </section>
  );
}
