"use client";

import Link from "next/link";
import { StatusChip } from "@/components/ui/primitives/StatusChip";
import {
  DEAL_STAGE_LABELS,
  DEAL_STAGE_TONES,
  OUTCOME_KIND_LABELS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_TONES,
  type DealStage,
  type OutcomeKind,
  type QuoteStatus,
} from "@/lib/crm/constants";
import { resolveDueBucket } from "@/lib/crm/guards";
import {
  formatDay,
  huf,
  relativeDayLabel,
  toneToChipVariant,
} from "@/components/admin/crm/crm-ui";
import type { CrmDealRow } from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// Közös deal-sor a Pipeline és a Lezártak listákhoz. A „minden nyitott
// dealnek legyen következő lépése” fegyelem itt vizuális: hiányzó next
// action = warning-chip, lejárt = error — kényszer nélkül, de láthatóan.
// ─────────────────────────────────────────────────────────────────────

/** Pipeline-érték: a kint lévő SENT quote konkrét száma nyer a becslés felett. */
export function dealDisplayValue(deal: CrmDealRow): number | null {
  const sent = deal.quotes.find((quote) => quote.status === "SENT");
  if (sent) return sent.netTotal;
  const accepted = deal.quotes.find((quote) => quote.status === "ACCEPTED");
  if (accepted) return accepted.netTotal;
  return deal.expectedValue;
}

export function CrmDealListRow({
  deal,
  variant = "open",
  showStageChip = false,
}: {
  deal: CrmDealRow;
  /** open: next-action fókusz · closed: outcome fókusz. */
  variant?: "open" | "closed";
  showStageChip?: boolean;
}) {
  const latestQuote = deal.quotes[0] ?? null;
  const value = dealDisplayValue(deal);
  const bucket =
    variant === "open"
      ? resolveDueBucket(deal.nextActionAt ? new Date(deal.nextActionAt) : null, new Date())
      : "none";

  return (
    <div
      data-testid="crm-deal-row"
      className="flex flex-col gap-2 rounded-xl border border-sand bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {showStageChip && (
            <StatusChip
              variant={toneToChipVariant(DEAL_STAGE_TONES[deal.stage as DealStage] ?? "neutral")}
            >
              {DEAL_STAGE_LABELS[deal.stage as DealStage] ?? deal.stage}
            </StatusChip>
          )}
          <Link
            href={`/admin/crm/${deal.id}`}
            className="truncate text-sm font-semibold text-ink underline-offset-2 hover:underline"
          >
            {deal.title}
          </Link>
          {deal.company && <span className="shrink-0 text-xs text-muted">· {deal.company}</span>}
        </div>
        <p className="mt-1 text-xs text-muted">
          {deal.contactName}
          {deal.lastActivityAt
            ? ` · utolsó aktivitás: ${relativeDayLabel(deal.lastActivityAt)}`
            : " · még nincs aktivitás"}
          {variant === "closed" && deal.closedAt ? ` · lezárva: ${formatDay(deal.closedAt)}` : ""}
        </p>
        {variant === "closed" && deal.outcomeNote && (
          <p className="mt-1 text-xs italic text-ink-body">„{deal.outcomeNote}”</p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {variant === "open" ? (
          bucket === "none" ? (
            <StatusChip variant="warning" data-testid="crm-no-next-action">
              Nincs következő lépés
            </StatusChip>
          ) : bucket === "overdue" ? (
            <StatusChip variant="error">Lejárt · {formatDay(deal.nextActionAt!)}</StatusChip>
          ) : bucket === "today" ? (
            <StatusChip variant="warning">Ma esedékes</StatusChip>
          ) : (
            <StatusChip variant="neutral">{formatDay(deal.nextActionAt!)}</StatusChip>
          )
        ) : (
          deal.outcomeKind && (
            <StatusChip variant="neutral">
              {OUTCOME_KIND_LABELS[deal.outcomeKind as OutcomeKind] ?? deal.outcomeKind}
            </StatusChip>
          )
        )}
        {latestQuote && (
          <StatusChip
            variant={toneToChipVariant(
              QUOTE_STATUS_TONES[latestQuote.status as QuoteStatus] ?? "neutral",
            )}
          >
            Ajánlat: {QUOTE_STATUS_LABELS[latestQuote.status as QuoteStatus] ?? latestQuote.status}
          </StatusChip>
        )}
        <span className="text-sm font-semibold tabular-nums text-ink">
          {value != null ? huf(value) : "—"}
        </span>
      </div>
    </div>
  );
}
