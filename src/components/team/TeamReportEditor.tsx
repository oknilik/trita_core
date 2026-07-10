"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedTeamReport } from "@/lib/team-report";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";

// Tanácsadói riport-szerkesztő. Csak ORG_CONSULTANT látja (a team page
// szerver-oldalon kapuz). Vázlat → mentés → publikálás; a publikált
// riport nem szerkeszthető, új riportot kell nyitni.

interface Props {
  teamId: string;
  reports: SerializedTeamReport[];
  isHu: boolean;
}

type NarrativeKey =
  | "title"
  | "summary"
  | "strengths"
  | "risks"
  | "recommendations"
  | "interviewFindings"
  | "internalNotes";

const FIELDS: Array<{
  key: NarrativeKey;
  hu: string;
  en: string;
  rows: number;
  internal?: boolean;
}> = [
  { key: "title", hu: "Riport címe", en: "Report title", rows: 1 },
  { key: "summary", hu: "Összefoglaló", en: "Summary", rows: 4 },
  { key: "strengths", hu: "Erősségek", en: "Strengths", rows: 3 },
  { key: "risks", hu: "Kockázatok", en: "Risks", rows: 3 },
  { key: "recommendations", hu: "Ajánlások", en: "Recommendations", rows: 3 },
  { key: "interviewFindings", hu: "Interjúk tanulságai", en: "Interview insights", rows: 4 },
  { key: "internalNotes", hu: "Belső jegyzet (nem publikálódik)", en: "Internal notes (never published)", rows: 3, internal: true },
];

export function TeamReportEditor({ teamId, reports, isHu }: Props) {
  const router = useRouter();
  const draft = reports.find((r) => r.status === "DRAFT") ?? null;
  const [values, setValues] = useState<Record<NarrativeKey, string>>({
    title: draft?.title ?? "",
    summary: draft?.summary ?? "",
    strengths: draft?.strengths ?? "",
    risks: draft?.risks ?? "",
    recommendations: draft?.recommendations ?? "",
    interviewFindings: draft?.interviewFindings ?? "",
    internalNotes: draft?.internalNotes ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  async function createDraft() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${teamId}/report`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Hiba");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba történt");
    } finally {
      setBusy(false);
    }
  }

  async function saveOrPublish(action: "save" | "publish") {
    if (!draft) return;
    if (
      action === "publish" &&
      !window.confirm(
        isHu
          ? "Publikálod a riportot? A publikált riport nem szerkeszthető, és a szervezet tagjai számára láthatóvá válik (a belső jegyzet kivételével)."
          : "Publish this report? Published reports are immutable and become visible to the organization (except internal notes).",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${teamId}/report`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: draft.id, action, ...values }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Hiba");
      setSavedAt(new Date().toLocaleTimeString(isHu ? "hu-HU" : "en-GB"));
      if (action === "publish") router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba történt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardPanel className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-bronze">
            {isHu ? "// tanácsadói riport" : "// consultant report"}
          </p>
          <h3 className="mt-1 font-fraunces text-xl text-ink">
            {draft
              ? isHu ? "Riport-vázlat szerkesztése" : "Edit report draft"
              : isHu ? "Új riport" : "New report"}
          </h3>
        </div>
        {savedAt && (
          <span className="text-xs text-muted">
            {isHu ? "Mentve: " : "Saved: "}
            {savedAt}
          </span>
        )}
      </div>

      {!draft ? (
        <div>
          <p className="mb-4 text-sm text-ink-body">
            {isHu
              ? "Nyiss egy riport-vázlatot: a rendszer elkészíti az aggregátum-pillanatképet, te pedig hozzáadod a narratív értékelést és az interjúk tanulságait."
              : "Open a report draft: the system captures the aggregate snapshot, and you add the narrative assessment and interview insights."}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={createDraft}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:opacity-50"
          >
            {isHu ? "Riport-vázlat létrehozása" : "Create report draft"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {FIELDS.map((field) => (
            <label key={field.key} className="flex flex-col gap-1">
              <span
                className={`text-[11px] font-medium ${
                  field.internal ? "text-amber-700" : "text-ink-body"
                }`}
              >
                {isHu ? field.hu : field.en}
              </span>
              {field.rows === 1 ? (
                <input
                  type="text"
                  value={values[field.key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                  className="min-h-[44px] rounded-lg border border-sand bg-white px-3 text-sm text-ink"
                />
              ) : (
                <textarea
                  value={values[field.key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field.key]: e.target.value }))
                  }
                  rows={field.rows}
                  className={`rounded-lg border bg-white px-3 py-2 text-sm text-ink ${
                    field.internal ? "border-amber-200 bg-amber-50/40" : "border-sand"
                  }`}
                />
              )}
            </label>
          ))}

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="flex flex-wrap gap-2 border-t border-sand pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => saveOrPublish("save")}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-sand bg-white px-5 text-sm font-semibold text-ink-body transition hover:text-ink disabled:opacity-50"
            >
              {isHu ? "Mentés" : "Save"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => saveOrPublish("publish")}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:opacity-50"
            >
              {isHu ? "Publikálás (validálás)" : "Publish (validate)"}
            </button>
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
