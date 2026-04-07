"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

interface Invoice {
  id: string;
  product: string;
  amount: number;
  currency: string;
  date: string;
  billingoDocumentId: string | null;
  billingoDocumentNumber: string | null;
  invoiceStatus: string;
  stripeReceiptUrl: string | null;
  hasBillingoInvoice: boolean;
}

const PRODUCT_LABELS: Record<string, { hu: string; en: string }> = {
  self_plus: { hu: "Self Plus", en: "Self Plus" },
  self_reflect: { hu: "Self Reflect", en: "Self Reflect" },
  team_snapshot: { hu: "Team Snapshot", en: "Team Snapshot" },
  team_deep_dive: { hu: "Team Deep Dive", en: "Team Deep Dive" },
  candidate_pack: { hu: "Jelölt kredit", en: "Candidate credits" },
  team_subscription: { hu: "Team előfizetés", en: "Team subscription" },
  org_subscription: { hu: "Org előfizetés", en: "Org subscription" },
};

function formatAmount(amount: number, currency: string): string {
  const value = amount / 100;
  if (currency === "huf") return `${Math.round(value).toLocaleString("hu-HU")} Ft`;
  return `€${value.toFixed(2)}`;
}

export function InvoiceList() {
  const { locale } = useLocale();
  const isHu = locale === "hu";
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data.invoices ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDownloadPdf(documentId: string) {
    setDownloadingId(documentId);
    try {
      const res = await fetch(`/api/invoices/${documentId}/pdf`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trita-szamla-${documentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
    setDownloadingId(null);
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-sand">
        <div className="border-b border-sand bg-cream px-4 py-3">
          <div className="h-3 w-40 animate-pulse rounded bg-sand" />
        </div>
        <div className="bg-white p-4">
          <div className="h-3 w-full animate-pulse rounded bg-cream" />
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-sand">
        <div className="flex items-center gap-1.5 border-b border-sand bg-cream px-4 py-3">
          <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2h8l2 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5l2-3z" />
            <path d="M2 5h12M8 9v3M6 11h4" />
          </svg>
          <span className="text-xs font-semibold text-ink-body">
            {isHu ? "Számlák és bizonylatok" : "Invoices & receipts"}
          </span>
        </div>
        <div className="bg-white px-4 py-6 text-center">
          <p className="text-[12px] text-muted">
            {isHu ? "Még nincs számlád." : "No invoices yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-sand">
      {/* Header */}
      <div className="flex items-center gap-1.5 border-b border-sand bg-cream px-4 py-3">
        <svg className="h-3.5 w-3.5 text-muted" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 2h8l2 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5l2-3z" />
          <path d="M2 5h12M8 9v3M6 11h4" />
        </svg>
        <span className="text-xs font-semibold text-ink-body">
          {isHu ? "Számlák és bizonylatok" : "Invoices & receipts"}
        </span>
        <span className="ml-auto rounded-full bg-sand px-2 py-0.5 text-[10px] font-medium text-muted">
          {invoices.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white">
        {/* Column headers */}
        <div className="hidden items-center gap-3 border-b border-sand/60 px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-muted sm:grid sm:grid-cols-[1fr_5rem_6rem_7rem]">
          <span>{isHu ? "Tétel" : "Item"}</span>
          <span className="text-right">{isHu ? "Összeg" : "Amount"}</span>
          <span className="text-right">{isHu ? "Dátum" : "Date"}</span>
          <span className="text-right">{isHu ? "Letöltés" : "Download"}</span>
        </div>

        {/* Rows */}
        {invoices.map((inv) => {
          const label = PRODUCT_LABELS[inv.product]?.[isHu ? "hu" : "en"] ?? inv.product;
          const date = new Date(inv.date).toLocaleDateString(
            isHu ? "hu-HU" : "en-US",
            { year: "numeric", month: "2-digit", day: "2-digit" },
          );

          return (
            <div
              key={inv.id}
              className="flex flex-col gap-2 border-b border-sand/40 px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-[1fr_5rem_6rem_7rem] sm:items-center sm:gap-3 sm:py-2.5"
            >
              {/* Product */}
              <div className="min-w-0">
                <p className="text-[12px] text-ink">{label}</p>
                {inv.billingoDocumentNumber && (
                  <p className="text-[10px] text-muted">{inv.billingoDocumentNumber}</p>
                )}
              </div>

              {/* Amount */}
              <span className="text-[12px] font-medium text-ink sm:text-right">
                {formatAmount(inv.amount, inv.currency)}
              </span>

              {/* Date */}
              <span className="text-[11px] text-muted sm:text-right">
                {date}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1.5 sm:justify-end">
                {inv.hasBillingoInvoice && inv.billingoDocumentId && (
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(inv.billingoDocumentId!)}
                    disabled={downloadingId === inv.billingoDocumentId}
                    className="inline-flex min-h-[28px] items-center gap-1 rounded-md border border-sand px-2 text-[10px] font-medium text-ink-body transition hover:border-sage/40 hover:text-sage disabled:opacity-50"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 2v9M4.5 7.5L8 11l3.5-3.5M3 14h10" />
                    </svg>
                    {downloadingId === inv.billingoDocumentId ? "..." : "PDF"}
                  </button>
                )}
                {inv.stripeReceiptUrl && (
                  <a
                    href={inv.stripeReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[28px] items-center gap-1 rounded-md border border-sand px-2 text-[10px] font-medium text-ink-body transition hover:border-sage/40 hover:text-sage"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3H3v10h10v-3M10 2h4v4M7 9l7-7" />
                    </svg>
                    {isHu ? "Bizonylat" : "Receipt"}
                  </a>
                )}
                {!inv.hasBillingoInvoice && !inv.stripeReceiptUrl && (
                  <span className="text-[10px] text-muted">
                    {inv.invoiceStatus === "failed"
                      ? (isHu ? "Feldolgozás..." : "Processing...")
                      : "—"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
