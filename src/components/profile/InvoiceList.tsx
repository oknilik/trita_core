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
      <div className="rounded-2xl border border-sand bg-white p-6">
        <div className="h-4 w-32 animate-pulse rounded bg-sand" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sand bg-white p-8 text-center">
        <p className="text-sm text-ink-body">
          {isHu ? "Még nincs számlád." : "No invoices yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sand bg-white shadow-[0_10px_26px_rgba(26,26,46,0.03)]">
      <div className="border-b border-sand px-5 py-3">
        <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {isHu ? "// számlák és bizonylatok" : "// invoices & receipts"}
        </p>
      </div>
      <div className="divide-y divide-sand">
        {invoices.map((inv) => {
          const label = PRODUCT_LABELS[inv.product]?.[isHu ? "hu" : "en"] ?? inv.product;
          const date = new Date(inv.date).toLocaleDateString(
            isHu ? "hu-HU" : "en-US",
            { year: "numeric", month: "short", day: "numeric" },
          );

          return (
            <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink">{label}</p>
                <p className="text-[11px] text-muted">
                  {date} · {formatAmount(inv.amount, inv.currency)}
                  {inv.billingoDocumentNumber && (
                    <> · {inv.billingoDocumentNumber}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {inv.hasBillingoInvoice && inv.billingoDocumentId && (
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(inv.billingoDocumentId!)}
                    disabled={downloadingId === inv.billingoDocumentId}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-sand bg-white px-3 text-[11px] font-semibold text-ink-body transition hover:border-sage/40 hover:text-sage disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 2v9M4.5 7.5L8 11l3.5-3.5M3 14h10" />
                    </svg>
                    {downloadingId === inv.billingoDocumentId
                      ? "..."
                      : isHu ? "Számla" : "Invoice"}
                  </button>
                )}
                {inv.stripeReceiptUrl && (
                  <a
                    href={inv.stripeReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-sand bg-white px-3 text-[11px] font-semibold text-ink-body transition hover:border-sage/40 hover:text-sage"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3H3v10h10v-3M10 2h4v4M7 9l7-7" />
                    </svg>
                    {isHu ? "Bizonylat" : "Receipt"}
                  </a>
                )}
                {!inv.hasBillingoInvoice && !inv.stripeReceiptUrl && (
                  <span className="text-[10px] text-muted">
                    {inv.invoiceStatus === "failed"
                      ? (isHu ? "Számla feldolgozás alatt" : "Invoice processing")
                      : (isHu ? "Nincs számla" : "No invoice")}
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
