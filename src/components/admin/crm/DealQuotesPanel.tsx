"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { StatusChip } from "@/components/ui/primitives/StatusChip";
import { ConfirmModal } from "@/components/ui/Modal";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_TONES,
  type QuoteStatus,
} from "@/lib/crm/constants";
import { formatQuoteNo } from "@/lib/crm/guards";
import {
  CRM_INPUT_CLASS,
  crmRequest,
  formatDay,
  huf,
  toneToChipVariant,
} from "@/components/admin/crm/crm-ui";
import type { CrmDetailQuoteRow } from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// Ajánlatok panel — quoteNo · cím · nettó · effektív óradíj (belső szám,
// admin-only) · státusz-chip · érvényesség. Életciklus-akciók státusz
// szerint: DRAFT szerkeszthető/törölhető; SENT-től immutábilis, onnan
// Elfogadva (deal → WON!) / Elutasítva / Másolat. Új DRAFT a kalkulátorból.
// ─────────────────────────────────────────────────────────────────────

export function DealQuotesPanel({
  dealId,
  quotes,
}: {
  dealId: string;
  quotes: CrmDetailQuoteRow[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [acceptId, setAcceptId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function run(
    quoteId: string,
    request: () => ReturnType<typeof crmRequest>,
  ): Promise<boolean> {
    setBusyId(quoteId);
    setError(null);
    const result = await request();
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  const patchQuote = (quoteId: string, body: Record<string, unknown>) =>
    run(quoteId, () =>
      crmRequest(`/api/admin/crm/quotes/${quoteId}`, { method: "PATCH", body }),
    );

  return (
    <DashboardPanel className="p-5">
      <div id="ajanlatok" className="scroll-mt-6" />
      <div className="flex items-center justify-between gap-2">
        <SectionEyebrow>ajánlatok</SectionEyebrow>
        <Link
          href={`/admin/quote?dealId=${dealId}`}
          className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg bg-action-primary-bg px-3.5 py-2 text-sm font-semibold text-action-primary-fg transition hover:bg-action-primary-bg-hover"
        >
          Ajánlat készítése
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-state-error-bg px-3 py-2 text-sm text-state-error-fg">
          {error}
        </p>
      )}

      {quotes.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Még nincs ajánlat. A kalkulátorban összeállíthatod az árat és a
          tartalmat, majd innen készítheted el a PDF-et.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {quotes.map((quote) => {
            const busy = busyId === quote.id;
            const status = quote.status as QuoteStatus;
            return (
              <div key={quote.id} className="rounded-xl border border-sand bg-surface-card p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-ink">
                    {formatQuoteNo(quote.quoteNo, new Date(quote.createdAt))}
                  </span>
                  <StatusChip
                    variant={toneToChipVariant(QUOTE_STATUS_TONES[status] ?? "neutral")}
                  >
                    {QUOTE_STATUS_LABELS[status] ?? quote.status}
                  </StatusChip>
                  <span className="ml-auto text-sm font-semibold tabular-nums text-ink">
                    {huf(quote.netTotal)}
                  </span>
                </div>
                {quote.title && <p className="mt-1 text-sm text-ink-body">{quote.title}</p>}
                <p className="mt-1 text-xs text-muted">
                  {quote.sentAt ? `Kiküldve: ${formatDay(quote.sentAt)} · ` : ""}
                  {quote.validUntil
                    ? `Érvényes: ${formatDay(quote.validUntil)}-ig`
                    : "Nincs érvényességi dátum"}
                </p>
                {quote.status === "DECLINED" && quote.declineReason && (
                  <p className="mt-1 text-xs italic text-ink-body">
                    Elutasítás oka: „{quote.declineReason}”
                  </p>
                )}

                {declineId === quote.id ? (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={declineReason}
                      onChange={(event) => setDeclineReason(event.target.value)}
                      maxLength={1000}
                      placeholder="Elutasítás oka (opcionális)"
                      aria-label="Elutasítás oka"
                      className={`${CRM_INPUT_CLASS} flex-1`}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        loading={busy}
                        onClick={async () => {
                          const ok = await patchQuote(quote.id, {
                            action: "mark_declined",
                            ...(declineReason.trim() ? { reason: declineReason.trim() } : {}),
                          });
                          if (ok) {
                            setDeclineId(null);
                            setDeclineReason("");
                          }
                        }}
                      >
                        Elutasítva
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setDeclineId(null)}>
                        Mégse
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-sand/60 pt-2">
                    {quote.status === "DRAFT" && (
                      <>
                        <Link
                          href={`/admin/quote?dealId=${dealId}&from=${quote.id}`}
                          className="inline-flex min-h-[40px] items-center rounded-lg bg-action-primary-bg px-3 py-2 text-sm font-semibold text-action-primary-fg transition hover:bg-action-primary-bg-hover"
                        >
                          Ajánlat folytatása
                        </Link>
                        <Link
                          href={`/admin/crm/quotes/${quote.id}/documents`}
                          className="inline-flex min-h-[40px] items-center rounded-lg border border-sand bg-surface-card px-3 py-2 text-sm font-semibold text-ink-body transition hover:bg-cream"
                        >
                          PDF és dokumentumok
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void patchQuote(quote.id, { action: "mark_sent" })}
                        >
                          Elküldtem az ügyfélnek
                        </Button>
                      </>
                    )}
                    {quote.status === "SENT" && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => setAcceptId(quote.id)}
                        >
                          Elfogadás rögzítése
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            setDeclineReason("");
                            setDeclineId(quote.id);
                          }}
                        >
                          Elutasítás rögzítése
                        </Button>
                        <Link
                          href={`/admin/crm/quotes/${quote.id}/documents`}
                          className="inline-flex min-h-[40px] items-center rounded-lg border border-sand bg-surface-card px-3 py-2 text-sm font-semibold text-ink-body transition hover:bg-cream"
                        >
                          PDF és dokumentumok
                        </Link>
                      </>
                    )}
                    {quote.status !== "DRAFT" && quote.status !== "SENT" && (
                      <Link
                        href={`/admin/crm/quotes/${quote.id}/documents`}
                        className="inline-flex min-h-[40px] items-center rounded-lg border border-sand bg-surface-card px-3 py-2 text-sm font-semibold text-ink-body transition hover:bg-cream"
                      >
                        PDF és dokumentumok
                      </Link>
                    )}
                    <details className="ml-auto">
                      <summary className="flex min-h-[40px] cursor-pointer list-none items-center text-sm text-muted marker:content-none hover:text-ink">
                        További műveletek
                      </summary>
                      <div className="mt-1 flex flex-wrap justify-end gap-2 rounded-xl border border-sand bg-cream/60 p-2">
                        {(quote.effectiveHourlyRate != null || quote.discountPct > 0) && (
                          <span className="self-center px-1 text-xs text-muted">
                            {quote.effectiveHourlyRate != null
                              ? `Effektív óradíj: ${huf(quote.effectiveHourlyRate)}`
                              : ""}
                            {quote.effectiveHourlyRate != null && quote.discountPct > 0 ? " · " : ""}
                            {quote.discountPct > 0 ? `Kedvezmény: ${quote.discountPct}%` : ""}
                          </span>
                        )}
                        {quote.status !== "DRAFT" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              void run(quote.id, () =>
                                crmRequest(`/api/admin/crm/quotes/${quote.id}/duplicate`, {
                                  method: "POST",
                                }),
                              )
                            }
                          >
                            Másolat készítése
                          </Button>
                        )}
                        {quote.status === "DRAFT" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => setDeleteId(quote.id)}
                          >
                            Piszkozat törlése
                          </Button>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Elfogadás: a deal automatikusan megnyertre zárul */}
      <ConfirmModal
        isOpen={acceptId !== null}
        onClose={() => setAcceptId(null)}
        onConfirm={() => {
          if (!acceptId) return;
          void patchQuote(acceptId, { action: "mark_accepted" }).then((ok) => {
            if (ok) setAcceptId(null);
          });
        }}
        title="Elfogadta az ügyfél az ajánlatot?"
        description="Az elfogadás rögzítésével az ügy automatikusan megnyertként zárul, és lekerül a napi teendők közül."
        confirmText="Igen, elfogadta"
        cancelText="Mégse"
        isLoading={busyId === acceptId}
      />

      {/* DRAFT törlése */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          void run(deleteId, () =>
            crmRequest(`/api/admin/crm/quotes/${deleteId}`, { method: "DELETE" }),
          ).then((ok) => {
            if (ok) setDeleteId(null);
          });
        }}
        title="Piszkozat törlése?"
        description="Csak piszkozat törölhető – kiküldött ajánlatnak nyoma marad. Ez a művelet nem vonható vissza."
        confirmText="Törlés"
        cancelText="Mégse"
        variant="danger"
        isLoading={busyId === deleteId}
      />
    </DashboardPanel>
  );
}
