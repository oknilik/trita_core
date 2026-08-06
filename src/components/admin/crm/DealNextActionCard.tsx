"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { StatusChip } from "@/components/ui/primitives/StatusChip";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { POSTPONE_PRESETS } from "@/lib/crm/constants";
import { isOpenStage, resolveDueBucket } from "@/lib/crm/guards";
import {
  computePostponeAt,
  crmRequest,
  dayInputToIso,
  formatDay,
  isoToDayInput,
} from "@/components/admin/crm/crm-ui";
import type { CrmDealDetailData } from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// Következő-lépés kártya — a pipeline-fegyelem vizuális vezetése: nyitott
// deal next action nélkül warning-keretet és CTA-t kap (nem kényszer).
// Halasztó chipek a POSTPONE_PRESETS-ből; szerkesztés inline űrlappal.
// ─────────────────────────────────────────────────────────────────────

export function DealNextActionCard({ deal }: { deal: CrmDealDetailData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [dateDraft, setDateDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpenStage(deal.stage)) return null;

  const bucket = resolveDueBucket(
    deal.nextActionAt ? new Date(deal.nextActionAt) : null,
    new Date(),
  );

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const result = await crmRequest(`/api/admin/crm/deals/${deal.id}`, {
      method: "PATCH",
      body,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  function openEditor() {
    setDateDraft(deal.nextActionAt ? isoToDayInput(deal.nextActionAt) : "");
    setNoteDraft(deal.nextActionNote ?? "");
    setEditing(true);
  }

  async function saveEditor() {
    if (!dateDraft) return;
    const ok = await patch({
      action: "set_next_action",
      at: dayInputToIso(dateDraft),
      ...(noteDraft.trim() ? { note: noteDraft.trim() } : {}),
    });
    if (ok) setEditing(false);
  }

  const hasAction = deal.nextActionAt !== null;

  return (
    <DashboardPanel
      tone={hasAction ? "white" : "warm"}
      className={`p-5 ${
        !hasAction
          ? "border-state-warning-border"
          : bucket === "overdue"
            ? "border-state-error-border"
            : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <SectionEyebrow tone={hasAction ? "bronze" : "muted"}>következő lépés</SectionEyebrow>
        {hasAction && (
          <StatusChip
            variant={
              bucket === "overdue" ? "error" : bucket === "today" ? "warning" : "neutral"
            }
          >
            {bucket === "overdue"
              ? "Lejárt"
              : bucket === "today"
                ? "Ma esedékes"
                : formatDay(deal.nextActionAt!)}
          </StatusChip>
        )}
      </div>

      {editing ? (
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="date"
            value={dateDraft}
            onChange={(event) => setDateDraft(event.target.value)}
            aria-label="Következő lépés dátuma"
            className="min-h-[44px] rounded-lg border border-sand bg-white px-3 text-sm text-ink outline-none transition focus:border-bronze"
          />
          <input
            type="text"
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            maxLength={1000}
            placeholder="Mi a lépés? (pl. follow-up hívás az ajánlatról)"
            aria-label="Következő lépés jegyzete"
            className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 text-sm text-ink outline-none transition focus:border-bronze"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" loading={busy} disabled={!dateDraft} onClick={() => void saveEditor()}>
              Mentés
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Mégse
            </Button>
          </div>
        </div>
      ) : hasAction ? (
        <>
          <p className="mt-2 text-sm font-semibold text-ink">{formatDay(deal.nextActionAt!)}</p>
          <p className="mt-1 text-sm text-ink-body">
            {deal.nextActionNote || <span className="italic text-muted">Nincs jegyzet.</span>}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand/60 pt-3">
            <span className="text-xs text-muted">Halasztás:</span>
            {POSTPONE_PRESETS.map((days) => (
              <button
                key={days}
                type="button"
                disabled={busy}
                data-testid={`crm-detail-postpone-${days}`}
                onClick={() =>
                  void patch({
                    action: "set_next_action",
                    at: computePostponeAt(days),
                    ...(deal.nextActionNote ? { note: deal.nextActionNote } : {}),
                  })
                }
                className="min-h-[40px] rounded-full border border-sand bg-white px-3 text-sm text-ink-body transition hover:border-bronze-edge hover:text-ink disabled:opacity-60"
              >
                +{days} nap
              </button>
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={openEditor}
              className="min-h-[40px] text-sm text-bronze underline underline-offset-2"
            >
              Szerkesztés
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void patch({ action: "clear_next_action" })}
              className="min-h-[40px] text-sm text-muted underline underline-offset-2 hover:text-ink-body"
            >
              Törlés
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink-body" data-testid="crm-next-action-missing">
            Ennek a dealnek nincs következő lépése — így könnyen elfelejtődik.
            Tűzz ki egyet, és megjelenik a „Ma” panelen, amikor esedékes.
          </p>
          <Button type="button" size="sm" className="mt-3" onClick={openEditor}>
            Következő lépés kitűzése
          </Button>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
          {error}
        </p>
      )}
    </DashboardPanel>
  );
}
