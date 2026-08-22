"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { StatusChip } from "@/components/ui/primitives/StatusChip";
import { EmptyState } from "@/components/ui/primitives/EmptyState";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import {
  DEAL_STAGE_LABELS,
  DEAL_STAGE_TONES,
  POSTPONE_PRESETS,
  type DealStage,
} from "@/lib/crm/constants";
import { resolveDueBucket } from "@/lib/crm/guards";
import {
  computePostponeAt,
  crmRequest,
  formatDay,
  toneToChipVariant,
} from "@/components/admin/crm/crm-ui";
import { QuickLogForm } from "@/components/admin/crm/QuickLogForm";
import type { CrmDealRow } from "@/components/admin/crm/types";
import { NewsletterEngagementBadge } from "@/components/admin/crm/NewsletterEngagementBadge";

// ─────────────────────────────────────────────────────────────────────
// „Ma” panel — lejárt + ma esedékes next actionű nyitott dealek, a napi
// hurok belépője. Sor-akciók: Megnyitás · halasztó chipek (egy PATCH) ·
// „Kész” → gyors-naplózó modal (naplózás + új következő lépés egy POST).
// ─────────────────────────────────────────────────────────────────────

export function CrmTodayPanel({ deals }: { deals: CrmDealRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [doneDeal, setDoneDeal] = useState<CrmDealRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function postpone(deal: CrmDealRow, days: number) {
    setBusyId(deal.id);
    setError(null);
    const result = await crmRequest(`/api/admin/crm/deals/${deal.id}`, {
      method: "PATCH",
      body: {
        action: "set_next_action",
        at: computePostponeAt(days),
        // A jegyzet megmarad a halasztásnál — a lépés nem változott, csak a nap.
        ...(deal.nextActionNote ? { note: deal.nextActionNote } : {}),
      },
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <DashboardPanel tone="warm" className="p-5 md:p-6">
      <SectionEyebrow>ma</SectionEyebrow>
      <h2 className="mt-1 font-fraunces text-xl text-ink">
        Mit kell ma tennem? {deals.length > 0 ? `(${deals.length})` : ""}
      </h2>
      <p className="mt-1 text-xs text-ink-body">
        Lejárt és ma esedékes következő lépések. „Kész” = naplózod, mi történt,
        és rögtön kitűzöd a következőt — egy mentésben.
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
          {error}
        </p>
      )}

      {deals.length === 0 ? (
        <EmptyState
          data-testid="crm-today-empty"
          className="mt-4"
          title="Minden esedékes lépés megvan mára."
          description="Új teendő a Pipeline nézetben tűzhető ki — nyitott deal ne maradjon következő lépés nélkül."
        />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {deals.map((deal) => {
            const bucket = resolveDueBucket(
              deal.nextActionAt ? new Date(deal.nextActionAt) : null,
              new Date(),
            );
            const busy = busyId === deal.id;
            return (
              <div
                key={deal.id}
                data-testid="crm-today-row"
                className={`rounded-xl border bg-surface-card p-4 ${
                  bucket === "overdue" ? "border-state-error-border" : "border-sand"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {deal.nextActionAt && (
                    <StatusChip variant={bucket === "overdue" ? "error" : "warning"}>
                      {bucket === "overdue"
                        ? `Lejárt · ${formatDay(deal.nextActionAt)}`
                        : "Ma esedékes"}
                    </StatusChip>
                  )}
                  <StatusChip
                    variant={toneToChipVariant(
                      DEAL_STAGE_TONES[deal.stage as DealStage] ?? "neutral",
                    )}
                  >
                    {DEAL_STAGE_LABELS[deal.stage as DealStage] ?? deal.stage}
                  </StatusChip>
                  <Link
                    href={`/admin/crm/${deal.id}`}
                    className="min-w-0 text-sm font-semibold text-ink underline-offset-2 [overflow-wrap:anywhere] hover:underline"
                  >
                    {deal.title}
                  </Link>
                  {deal.company && <span className="text-xs text-muted">· {deal.company}</span>}
                  <NewsletterEngagementBadge engagement={deal.newsletter} />
                </div>

                <p className="mt-2 text-sm text-ink-body">
                  {deal.nextActionNote || (
                    <span className="italic text-muted">Nincs jegyzet a lépéshez.</span>
                  )}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand/60 pt-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setDoneDeal(deal)}
                    className="min-h-[40px] rounded-lg bg-action-primary-bg px-4 text-sm font-semibold text-action-primary-fg transition hover:bg-action-primary-bg-hover disabled:opacity-60"
                  >
                    Kész
                  </button>
                  <span className="text-xs text-muted">Halasztás:</span>
                  {POSTPONE_PRESETS.map((days) => (
                    <button
                      key={days}
                      type="button"
                      disabled={busy}
                      data-testid={`crm-postpone-${days}`}
                      onClick={() => void postpone(deal, days)}
                      className="min-h-[40px] rounded-full border border-sand bg-surface-card px-3 text-sm text-ink-body transition hover:border-bronze-edge hover:text-ink disabled:opacity-60"
                    >
                      +{days} nap
                    </button>
                  ))}
                  <Link
                    href={`/admin/crm/${deal.id}`}
                    className="ml-auto inline-flex min-h-[40px] items-center rounded-lg border border-sand bg-surface-card px-4 py-2 text-sm font-semibold text-ink-body transition hover:bg-cream"
                  >
                    Megnyitás
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={doneDeal !== null}
        onClose={() => setDoneDeal(null)}
        eyebrow="lépés elintézve"
        title={doneDeal?.title ?? ""}
        description="Naplózd, mi történt, és tűzd ki a következő lépést — egy mentés."
      >
        {doneDeal && (
          <QuickLogForm
            dealId={doneDeal.id}
            nextActionOpenByDefault
            clearNextActionWhenEmpty
            onSaved={() => setDoneDeal(null)}
          />
        )}
      </Modal>
    </DashboardPanel>
  );
}
