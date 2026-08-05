"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SerializedTeamReport, TeamReportActionItem } from "@/lib/team-report";
import type { ReportTranslationEn } from "@/lib/team-report-i18n";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { TeamReportView } from "@/components/team/TeamReportView";
import { CelebrationBurst } from "@/components/ui/CelebrationBurst";

// Tanácsadói riport-szerkesztő. Csak ORG_CONSULTANT látja (a team page
// szerver-oldalon kapuz). Vázlat → mentés → előnézet → publikálás; a
// publikált riport nem szerkeszthető, új riportot kell nyitni.
// Az előnézet menti a narratívát, újraépíti az aggregátumokat, és pontosan
// azt mutatja, amit a vezetők publikálás után látni fognak.

interface Props {
  teamId: string;
  orgId?: string | null;
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
  | "leadershipGuide"
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
  { key: "leadershipGuide", hu: "Hogyan vezesd ezt a csapatot", en: "How to lead this team", rows: 4 },
  { key: "internalNotes", hu: "Belső jegyzet (nem publikálódik)", en: "Internal notes (never published)", rows: 3, internal: true },
];

const TIMEFRAMES = ["30", "60", "90"] as const;

const ERROR_LABELS: Record<string, { hu: string; en: string }> = {
  DRAFT_EXISTS: {
    hu: "Már van nyitott vázlat — előbb publikáld vagy fejezd be.",
    en: "There is already an open draft — publish or finish it first.",
  },
  NOT_LATEST: {
    hu: "Csak a legutolsó publikált riport vonható vissza.",
    en: "Only the latest published report can be unpublished.",
  },
  NOT_PUBLISHED: {
    hu: "Ez a riport nincs publikálva.",
    en: "This report is not published.",
  },
  ALREADY_PUBLISHED: {
    hu: "Az aktuális publikált riport nem szerkeszthető és nem törölhető közvetlenül — előbb vond vissza.",
    en: "The current published report cannot be edited or deleted directly — unpublish it first.",
  },
  TRANSLATE_FAILED: {
    hu: "A fordítás nem sikerült — próbáld újra kicsit később.",
    en: "Translation failed — try again in a moment.",
  },
  TRANSLATE_NOT_CONFIGURED: {
    hu: "A fordítás-szolgáltatás nincs konfigurálva (hiányzó API-kulcs).",
    en: "The translation service is not configured (missing API key).",
  },
};

// A fordítás-panel szerkeszthető mezői (a belső jegyzet nem publikálódik,
// ezért nem fordítjuk).
const TRANSLATION_FIELDS: Array<{
  key: keyof Pick<
    ReportTranslationEn,
    | "summary"
    | "strengths"
    | "risks"
    | "recommendations"
    | "interviewFindings"
    | "leadershipGuide"
  >;
  label: string;
  rows: number;
}> = [
  { key: "summary", label: "Summary", rows: 4 },
  { key: "strengths", label: "Strengths", rows: 3 },
  { key: "risks", label: "Risks", rows: 3 },
  { key: "recommendations", label: "Recommendations", rows: 3 },
  { key: "interviewFindings", label: "Interview insights", rows: 4 },
  { key: "leadershipGuide", label: "How to lead this team", rows: 4 },
];

export function TeamReportEditor({ teamId, orgId = null, reports, isHu }: Props) {
  const router = useRouter();
  const draft = reports.find((r) => r.status === "DRAFT") ?? null;
  const publishedReports = [...reports]
    .filter((r) => r.status === "PUBLISHED")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  const latestPublished = publishedReports[0] ?? null;
  const olderPublished = publishedReports.slice(1);
  const [values, setValues] = useState<Record<NarrativeKey, string>>({
    title: draft?.title ?? "",
    summary: draft?.summary ?? "",
    strengths: draft?.strengths ?? "",
    risks: draft?.risks ?? "",
    recommendations: draft?.recommendations ?? "",
    interviewFindings: draft?.interviewFindings ?? "",
    leadershipGuide: draft?.leadershipGuide ?? "",
    internalNotes: draft?.internalNotes ?? "",
  });
  const [actionItems, setActionItems] = useState<TeamReportActionItem[]>(
    draft?.actionItems ?? [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [preview, setPreview] = useState<SerializedTeamReport | null>(null);
  // Publikálás-rituálé (F3): egyszeri, visszafogott szirom-animáció a
  // sikeres publikálás pillanatában — a konzultánsi munka csúcspontja.
  const [celebrating, setCelebrating] = useState(false);
  // Angol fordítás: gépi javaslat → tanácsadói szerkesztés → jóváhagyás.
  const [translation, setTranslation] = useState<ReportTranslationEn | null>(
    draft?.translationsEn?.en ?? null,
  );
  const [translating, setTranslating] = useState(false);

  // A state-et a szervertől visszakapott riportból seedeljük, mert a
  // router.refresh() a már mountolt komponens useState-jét nem inicializálja
  // újra (üresen maradnának a mezők, mentéskor felülírva a tartalmat).
  function seedFromReport(report: SerializedTeamReport) {
    setValues({
      title: report.title ?? "",
      summary: report.summary ?? "",
      strengths: report.strengths ?? "",
      risks: report.risks ?? "",
      recommendations: report.recommendations ?? "",
      interviewFindings: report.interviewFindings ?? "",
      leadershipGuide: report.leadershipGuide ?? "",
      internalNotes: report.internalNotes ?? "",
    });
    setActionItems(report.actionItems ?? []);
    setTranslation(report.translationsEn?.en ?? null);
  }

  // Gépi fordítás-javaslat generálása (nem ment — a tanácsadó előbb átnézi).
  async function generateTranslation() {
    if (!draft) return;
    setTranslating(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${teamId}/report/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: draft.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "TRANSLATE_FAILED");
      const { translation: generated } = (await res.json()) as {
        translation: ReportTranslationEn;
      };
      setTranslation(generated);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const known = ERROR_LABELS[code];
      setError(known ? (isHu ? known.hu : known.en) : code || "Hiba történt");
    } finally {
      setTranslating(false);
    }
  }

  // Fordítás mentése; approve=true → jóváhagyás (ettől jelenik meg a
  // felhasználónak angol lekérésnél).
  async function saveTranslation(approve: boolean) {
    if (!draft || !translation) return;
    setBusy(true);
    setError(null);
    try {
      const payload: ReportTranslationEn = {
        ...translation,
        status: approve ? "approved" : "draft",
        approvedAt: approve ? new Date().toISOString() : null,
      };
      const res = await fetch(`/api/team/${teamId}/report`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: draft.id,
          action: "save",
          translationsEn: { en: payload },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Hiba");
      setTranslation(payload);
      setSavedAt(new Date().toLocaleTimeString(isHu ? "hu-HU" : "en-GB"));
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const known = ERROR_LABELS[code];
      setError(known ? (isHu ? known.hu : known.en) : code || "Hiba történt");
    } finally {
      setBusy(false);
    }
  }

  async function createDraft() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${teamId}/report`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Hiba");
      const { report } = (await res.json()) as { report: SerializedTeamReport };
      seedFromReport(report);
      router.refresh();
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const known = ERROR_LABELS[code];
      setError(known ? (isHu ? known.hu : known.en) : code || "Hiba történt");
    } finally {
      setBusy(false);
    }
  }

  async function deleteReport(report: SerializedTeamReport) {
    const isCurrentDraft = report.id === draft?.id;
    if (
      !window.confirm(
        isCurrentDraft
          ? isHu
            ? "Véglegesen törlöd ezt a vázlatot? A művelet nem vonható vissza."
            : "Permanently delete this draft? This cannot be undone."
          : isHu
            ? "Véglegesen törlöd ezt a korábbi riportot? A művelet nem vonható vissza."
            : "Permanently delete this earlier report? This cannot be undone.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${teamId}/report`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Hiba");
      if (isCurrentDraft) {
        setValues({
          title: "",
          summary: "",
          strengths: "",
          risks: "",
          recommendations: "",
          interviewFindings: "",
          leadershipGuide: "",
          internalNotes: "",
        });
        setActionItems([]);
        setPreview(null);
      }
      router.refresh();
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const known = ERROR_LABELS[code];
      setError(known ? (isHu ? known.hu : known.en) : code || "Hiba történt");
    } finally {
      setBusy(false);
    }
  }

  async function unpublish(reportId: string) {
    if (
      !window.confirm(
        isHu
          ? "Visszavonod a riportot? A szervezet tagjai számára eltűnik, és vázlatként újra szerkeszthető lesz."
          : "Unpublish this report? It will disappear for organization members and become an editable draft again.",
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
        body: JSON.stringify({ reportId, action: "unpublish" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Hiba");
      const { report } = (await res.json()) as { report: SerializedTeamReport };
      seedFromReport(report);
      setPreview(null);
      router.refresh();
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const known = ERROR_LABELS[code];
      setError(known ? (isHu ? known.hu : known.en) : code || "Hiba történt");
    } finally {
      setBusy(false);
    }
  }

  async function saveOrPublish(action: "save" | "preview" | "publish") {
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
        body: JSON.stringify({
          reportId: draft.id,
          action,
          ...values,
          actionItems: actionItems.filter((item) => item.title.trim().length > 0),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Hiba");
      setSavedAt(new Date().toLocaleTimeString(isHu ? "hu-HU" : "en-GB"));
      if (action === "preview") {
        const { report } = (await res.json()) as { report: SerializedTeamReport };
        // A belső jegyzetet kivesszük, hogy az előnézet a vezetői nézettel
        // legyen azonos.
        setPreview({ ...report, internalNotes: null });
      }
      if (action === "publish") {
        setPreview(null);
        setCelebrating(true);
        router.refresh();
      }
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const known = ERROR_LABELS[code];
      setError(known ? (isHu ? known.hu : known.en) : code || "Hiba történt");
    } finally {
      setBusy(false);
    }
  }

  if (preview) {
    return (
      <div className="flex flex-col gap-4">
        <DashboardPanel className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-ink-body">
            {isHu
              ? "Előnézet — pontosan így látják majd a vezetők a publikálás után."
              : "Preview — exactly what managers will see after publishing."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setPreview(null)}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-sand bg-white px-5 text-sm font-semibold text-ink-body transition hover:text-ink disabled:opacity-50"
            >
              {isHu ? "Vissza a szerkesztéshez" : "Back to editing"}
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
        </DashboardPanel>
        <TeamReportView report={preview} isHu={isHu} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
    {celebrating && <CelebrationBurst onDone={() => setCelebrating(false)} />}
    <DashboardPanel className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionEyebrow>
            {isHu ? "tanácsadói riport" : "consultant report"}
          </SectionEyebrow>
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
          {orgId && (draft.aggregates?.evidence?.measuredEdgeCount ?? 0) === 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-amber-200 bg-amber-50/60 px-3.5 py-2.5">
              <p className="text-xs text-amber-800">
                {isHu
                  ? "A riport kapcsolati adatalapja most csak becslés — nincs mért bizalmi kör."
                  : "The report's relationship data basis is estimate-only — no measured trust round yet."}
              </p>
              <Link
                href={`/org/${orgId}/campaigns/new?team=${teamId}`}
                className="text-xs font-semibold text-amber-800 underline transition hover:text-amber-900"
              >
                {isHu ? "Bizalmi kör indítása →" : "Start a trust round →"}
              </Link>
            </div>
          )}
          <p className="text-xs text-muted">
            {isHu
              ? "A narratív mezők a csapatadatokból generált javaslattal indulnak — szerkeszd és egészítsd ki a tanácsadói értékeléssel."
              : "Narrative fields start with suggestions generated from team data — edit and extend them with your consultant assessment."}
          </p>
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

          <div className="flex flex-col gap-2 border-t border-sand pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-ink-body">
                {isHu ? "Akcióterv (30/60/90 nap)" : "Action plan (30/60/90 days)"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setActionItems((items) => [
                    ...items,
                    { title: "", description: "", timeframe: "30" },
                  ])
                }
                className="text-xs font-semibold text-sage transition-colors hover:text-sage-dark"
              >
                {isHu ? "+ Új lépés" : "+ Add step"}
              </button>
            </div>
            {actionItems.length === 0 && (
              <p className="text-xs text-muted">
                {isHu
                  ? "Strukturált, átadható lépések a vezetőknek — cím, leírás, időtáv."
                  : "Structured, hand-off-ready steps for managers — title, description, timeframe."}
              </p>
            )}
            {actionItems.map((item, index) => (
              <div key={index} className="flex flex-col gap-2 rounded-lg border border-sand bg-cream/40 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={item.title}
                    placeholder={isHu ? "Lépés címe" : "Step title"}
                    onChange={(e) =>
                      setActionItems((items) =>
                        items.map((it, i) => (i === index ? { ...it, title: e.target.value } : it)),
                      )
                    }
                    className="min-h-[44px] flex-1 rounded-lg border border-sand bg-white px-3 text-sm text-ink"
                  />
                  <select
                    value={item.timeframe}
                    onChange={(e) =>
                      setActionItems((items) =>
                        items.map((it, i) =>
                          i === index
                            ? { ...it, timeframe: e.target.value as TeamReportActionItem["timeframe"] }
                            : it,
                        ),
                      )
                    }
                    className="min-h-[44px] rounded-lg border border-sand bg-white px-2 text-sm text-ink"
                  >
                    {TIMEFRAMES.map((tf) => (
                      <option key={tf} value={tf}>
                        {tf} {isHu ? "nap" : "days"}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label={isHu ? "Lépés törlése" : "Remove step"}
                    onClick={() =>
                      setActionItems((items) => items.filter((_, i) => i !== index))
                    }
                    className="min-h-[44px] rounded-lg border border-sand bg-white px-3 text-sm text-ink-body transition hover:text-rose-600"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={item.description}
                  placeholder={isHu ? "Mit és hogyan — átadható részletességgel" : "What and how — hand-off-ready detail"}
                  rows={2}
                  onChange={(e) =>
                    setActionItems((items) =>
                      items.map((it, i) =>
                        i === index ? { ...it, description: e.target.value } : it,
                      ),
                    )
                  }
                  className="rounded-lg border border-sand bg-white px-3 py-2 text-sm text-ink"
                />
              </div>
            ))}
          </div>

          {/* ── Angol fordítás — gépi javaslat + tanácsadói jóváhagyás ── */}
          <div className="flex flex-col gap-3 rounded-xl border border-sand bg-cream/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">
                  {isHu ? "Angol fordítás (EN)" : "English translation (EN)"}
                </p>
                {translation?.status === "approved" ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-micro font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                    {isHu ? "jóváhagyva" : "approved"}
                  </span>
                ) : translation ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-micro font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                    {isHu ? "vázlat — jóváhagyásra vár" : "draft — awaiting approval"}
                  </span>
                ) : (
                  <span className="rounded-full bg-sand px-2 py-0.5 text-micro font-semibold uppercase tracking-wide text-muted">
                    {isHu ? "nincs" : "none"}
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={translating || busy}
                onClick={generateTranslation}
                className="inline-flex min-h-[38px] items-center rounded-lg border border-sand bg-white px-4 text-xs font-semibold text-ink-body transition hover:text-ink disabled:opacity-50"
              >
                {translating
                  ? isHu ? "Fordítás folyamatban…" : "Translating…"
                  : translation
                    ? isHu ? "Újragenerálás gépi fordítással" : "Regenerate machine translation"
                    : isHu ? "Gépi fordítás generálása" : "Generate machine translation"}
              </button>
            </div>
            <p className="text-xs text-muted">
              {isHu
                ? "A gépi fordítást nézd át és szükség szerint javítsd — a felhasználó CSAK a jóváhagyott fordítást látja, amikor angolul nyitja meg a riportot. Jóváhagyás nélkül angol lekérésnél is a magyar eredeti jelenik meg."
                : "Review and adjust the machine translation — users only ever see the APPROVED translation when opening the report in English. Without approval, the Hungarian original is shown even for English requests."}
            </p>

            {translation ? (
              <>
                {TRANSLATION_FIELDS.map((field) => (
                  <label key={field.key} className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-ink-body">{field.label}</span>
                    <textarea
                      value={translation[field.key] ?? ""}
                      rows={field.rows}
                      onChange={(e) =>
                        setTranslation((tr) =>
                          tr ? { ...tr, status: "draft", [field.key]: e.target.value } : tr,
                        )
                      }
                      className="rounded-lg border border-sand bg-white px-3 py-2 text-sm text-ink"
                    />
                  </label>
                ))}

                {translation.actionItems && translation.actionItems.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-ink-body">Action plan</span>
                    {translation.actionItems.map((item, index) => (
                      <div key={index} className="flex flex-col gap-1.5 rounded-lg border border-sand bg-white p-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-cream px-2 py-0.5 font-mono text-micro text-muted">
                            {item.timeframe}d
                          </span>
                          <input
                            value={item.title}
                            onChange={(e) =>
                              setTranslation((tr) =>
                                tr
                                  ? {
                                      ...tr,
                                      status: "draft",
                                      actionItems: (tr.actionItems ?? []).map((it, i) =>
                                        i === index ? { ...it, title: e.target.value } : it,
                                      ),
                                    }
                                  : tr,
                              )
                            }
                            className="flex-1 rounded-lg border border-sand bg-white px-2 py-1 text-sm font-semibold text-ink"
                          />
                        </div>
                        <textarea
                          value={item.description}
                          rows={2}
                          onChange={(e) =>
                            setTranslation((tr) =>
                              tr
                                ? {
                                    ...tr,
                                    status: "draft",
                                    actionItems: (tr.actionItems ?? []).map((it, i) =>
                                      i === index ? { ...it, description: e.target.value } : it,
                                    ),
                                  }
                                : tr,
                            )
                          }
                          className="rounded-lg border border-sand bg-white px-2 py-1 text-sm text-ink"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    disabled={busy || translating}
                    onClick={() => saveTranslation(false)}
                    className="inline-flex min-h-[40px] items-center rounded-lg border border-sand bg-white px-4 text-xs font-semibold text-ink-body transition hover:text-ink disabled:opacity-50"
                  >
                    {isHu ? "Mentés vázlatként" : "Save as draft"}
                  </button>
                  <button
                    type="button"
                    disabled={busy || translating}
                    onClick={() => saveTranslation(true)}
                    className="inline-flex min-h-[40px] items-center rounded-lg bg-sage px-4 text-xs font-semibold text-white transition hover:bg-sage-dark disabled:opacity-50"
                  >
                    {isHu ? "Jóváhagyás és mentés" : "Approve and save"}
                  </button>
                </div>
              </>
            ) : null}
          </div>

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
              onClick={() => saveOrPublish("preview")}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-sage bg-white px-5 text-sm font-semibold text-sage-dark transition hover:bg-sage/10 disabled:opacity-50"
            >
              {isHu ? "Előnézet" : "Preview"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => saveOrPublish("publish")}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:opacity-50"
            >
              {isHu ? "Publikálás (validálás)" : "Publish (validate)"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => draft && deleteReport(draft)}
              className="ml-auto inline-flex min-h-[44px] items-center rounded-lg border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
            >
              {isHu ? "Vázlat törlése" : "Delete draft"}
            </button>
          </div>
        </div>
      )}
    </DashboardPanel>

    {latestPublished && (
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionEyebrow tone="muted">
            {isHu
              ? "aktuális publikált riport — ezt látja a szervezet"
              : "current published report — this is what the organization sees"}
          </SectionEyebrow>
          <button
            type="button"
            disabled={busy || !!draft}
            title={
              draft
                ? isHu
                  ? "Előbb publikáld vagy fejezd be a nyitott vázlatot."
                  : "Publish or finish the open draft first."
                : undefined
            }
            onClick={() => unpublish(latestPublished.id)}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-40"
          >
            {isHu ? "Visszavonás szerkesztésre" : "Unpublish for editing"}
          </button>
        </div>
        <TeamReportView report={latestPublished} isHu={isHu} />
      </section>
    )}

    {olderPublished.length > 0 && (
      <section className="flex flex-col gap-2">
        <SectionEyebrow tone="muted">
          {isHu
            ? "korábbi riportok — csak tanácsadói nézetben"
            : "earlier reports — consultant view only"}
        </SectionEyebrow>
        {olderPublished.map((r) => (
          <details key={r.id} className="rounded-[14px] border border-sand bg-white">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-sm text-ink-body [&::-webkit-details-marker]:hidden">
              <span className="font-medium text-ink">
                {r.title ?? (isHu ? "Csapatkép" : "Team picture")}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted">
                  {r.publishedAt
                    ? new Date(r.publishedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB")
                    : "—"}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={isHu ? "Riport törlése" : "Delete report"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteReport(r);
                  }}
                  className="inline-flex min-h-[36px] items-center rounded-lg border border-rose-200 bg-white px-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                >
                  {isHu ? "Törlés" : "Delete"}
                </button>
              </span>
            </summary>
            <div className="border-t border-sand p-4">
              <TeamReportView report={r} isHu={isHu} />
            </div>
          </details>
        ))}
      </section>
    )}
    </div>
  );
}
