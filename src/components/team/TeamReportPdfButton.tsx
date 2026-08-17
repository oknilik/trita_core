"use client";

import { useState } from "react";
import { track } from "@/lib/analytics/client";
import { createClientLogger } from "@/lib/client-logger";
import type { SerializedTeamReport } from "@/lib/team-report";

const log = createClientLogger("team-report-pdf");

// PDF-letöltő gomb a publikált csapatriporthoz (P1.1). A PDF-modul
// KIZÁRÓLAG dinamikus importtal töltődik — a react-pdf + file-saver nem
// kerülhet a fő bundle-be (a ProfileTabs onDownloadPdf mintája).
// A kapott `report` már lokalizált (a TeamReportView futtatja át a
// localizeTeamReport-on), és publikált szerializáció: internalNotes nélkül.
export function TeamReportPdfButton({
  report,
  isHu,
}: {
  report: SerializedTeamReport;
  isHu: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          track("results.export", { format: "pdf", surface: "team_report" });
          setLoading(true);
          setFailed(false);
          try {
            const { downloadTeamReportPdf } = await import("@/components/pdf/TeamReportPdf");
            await downloadTeamReportPdf({ report, isHu });
          } catch (err) {
            setFailed(true);
            log.error({ event: "team_report.pdf_export_failed", err }, "Team report PDF export failed");
          } finally {
            setLoading(false);
          }
        }}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--color-surface-card)]/80 px-3 py-1 text-xs font-semibold text-ink-body shadow-sm ring-1 ring-sand transition hover:text-ink disabled:opacity-60"
      >
        {loading ? (
          <span
            aria-hidden
            className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-sand border-t-bronze"
          />
        ) : (
          <span aria-hidden>↓</span>
        )}
        {loading
          ? isHu ? "PDF készül…" : "Preparing PDF…"
          : isHu ? "PDF letöltése" : "Download PDF"}
      </button>
      {failed && (
        <span role="status" className="text-[10px] text-state-error-fg">
          {isHu ? "A PDF-készítés nem sikerült — próbáld újra." : "PDF export failed — try again."}
        </span>
      )}
    </span>
  );
}
