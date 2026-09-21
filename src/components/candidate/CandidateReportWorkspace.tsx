"use client";
import { CandidateSuggestions } from "./CandidateSuggestions";
import type { Suggestion } from "@/lib/candidate-programs/suggestions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CandidateRadar } from "./CandidateRadar";
import { CandidateReportEditor } from "./CandidateReportEditor";
import { Button } from "@/components/ui/primitives/Button";
import { t, type Locale } from "@/lib/i18n";
import type { CandidateComparison } from "@/lib/candidate-programs/comparisons";
import { MAX_CANDIDATE_COMPARISONS } from "@/lib/candidate-programs/limits";
type Report = {
  revision: number;
  reviewedRevision: number | null;
  candidateSummary: string;
  managerSummary: string;
  internalNotes: string;
};
type Source = {
  reportId: string;
  teamId: string;
  teamName: string;
  publishedAt: string;
  revision: number;
  count: number;
};
export function CandidateReportWorkspace({
  inviteId,
  name,
  position,
  measuredAt,
  dimensions,
  comparisons,
  sources,
  report,
  locale,
  rolePending,
  roleLabel,
  roles,
  focus,
  invalidSources,
  suggestions = [],
  comparisonSuggestions = {},
}: {
  inviteId: string;
  name: string;
  position: string;
  measuredAt: string;
  dimensions: Record<string, number>;
  comparisons: CandidateComparison[];
  sources: Source[];
  report: Report;
  locale: Locale;
  rolePending: boolean;
  roleLabel?: string;
  roles: string[];
  focus: string;
  invalidSources: string[];
  suggestions?: Suggestion[];
  comparisonSuggestions?: Record<string, Suggestion[]>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"profile" | "teams" | "feedback">(
    comparisons.length ? "teams" : "profile",
  );
  const [selected, setSelected] = useState(comparisons[0]?.teamId ?? "");
  const [editing, setEditing] = useState(false),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [source, setSource] = useState("");
  const [annotationDirty, setAnnotationDirty] = useState(false);
  const active =
    comparisons.find((c) => c.teamId === selected) ?? comparisons[0];
  const blocked = dirty || annotationDirty || busy;
  async function mutate(action: string, fields: Record<string, string>) {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/manager/candidates/${inviteId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          expectedRevision: report.revision,
          ...fields,
        }),
      });
      if (!res.ok) throw new Error();
      setAnnotationDirty(false);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const available = sources.filter(
    (s) => !comparisons.some((c) => c.teamId === s.teamId),
  );
  const panel = "rounded-2xl border border-sand bg-surface-card p-5 sm:p-6";
  function switchTab(next: typeof tab) {
    if (blocked) return;
    setTab(next);
    setEditing(false);
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-5 py-3">
        <div className="flex items-center gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sage/10 font-fraunces text-heading text-sage"
            aria-hidden="true"
          >
            {name
              .split(/\s+/)
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <h1 className="font-fraunces text-title text-ink">{name}</h1>
            <p className="mt-2 text-caption text-muted">
              {position} · {measuredAt}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          disabled={blocked}
          onClick={() => {
            setTab("feedback");
            setEditing(true);
          }}
        >
          {t("candidateProgram.editFeedback", locale)}
        </Button>
      </header>
      <p className="text-body text-muted">
        {t("candidateProgram.visualSubtitle", locale)}
      </p>
      <div
        role="tablist"
        aria-label={t("candidateProgram.title", locale)}
        className="flex flex-wrap gap-2 border-b border-sand pb-3"
      >
        {(["profile", "teams", "feedback"] as const).map((v) => (
          <button
            key={v}
            id={`candidate-tab-${v}`}
            role="tab"
            aria-selected={tab === v}
            aria-controls={`candidate-panel-${v}`}
            disabled={blocked && tab !== v}
            onClick={() => switchTab(v)}
            className={`min-h-11 rounded-xl px-4 text-caption disabled:opacity-50 ${tab === v ? "bg-sage/10 font-semibold text-sage" : "text-muted hover:bg-sand/40"}`}
          >
            {t(
              `candidateProgram.${v === "profile" ? "profileTab" : v === "teams" ? "teamsTab" : "feedbackTab"}`,
              locale,
            )}
          </button>
        ))}
      </div>
      {(dirty || annotationDirty) && (
        <p role="status" className="text-caption text-bronze">
          {t("candidateProgram.unsaved", locale)}
        </p>
      )}
      {error && (
        <p role="alert" className="text-caption text-ink-body">
          {t("candidateProgram.reportError", locale)}
        </p>
      )}
      <div
        id="candidate-panel-profile"
        role="tabpanel"
        aria-labelledby="candidate-tab-profile"
        hidden={tab !== "profile"}
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <section className={panel}>
            <h2 className="font-fraunces text-heading text-ink">
              {t("candidateProgram.self", locale)}
            </h2>
            <CandidateRadar
              name={name}
              dimensions={dimensions}
              locale={locale}
            />
            <p className="mt-3 text-caption text-muted">
              {t("candidateProgram.reportNote", locale)}
            </p>
          </section>
          <div className="space-y-5">
            {suggestions.length > 0 && (
              <Button
                disabled={blocked}
                onClick={() => {
                  setTab("feedback");
                  setEditing(true);
                }}
              >
                {t("candidateSuggestions.title", locale)}
              </Button>
            )}
            {focus && (
              <section className={panel}>
                <h2 className="font-fraunces text-heading">
                  {t("candidateProgram.focus", locale)}
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-ink-body">
                  {focus}
                </p>
              </section>
            )}
            {roleLabel && (
              <section className={panel}>
                <h2 className="font-fraunces text-heading">
                  {t("candidateProgram.optional", locale)}
                </h2>
                <p className="mt-3 text-caption text-muted">{roleLabel}</p>
                {roles.map((r) => (
                  <p key={r} className="mt-3 text-ink-body">
                    {r}
                  </p>
                ))}
              </section>
            )}
            <section className="rounded-2xl bg-sage/10 p-6">
              <h2 className="font-fraunces text-heading text-ink">
                {t("candidateProgram.teamsTab", locale)}
              </h2>
              <p className="my-4 text-caption text-muted">
                {t("candidateProgram.sourceNote", locale)}
              </p>
              <Button variant="secondary" onClick={() => switchTab("teams")}>
                {t("candidateProgram.addTeam", locale)}
              </Button>
            </section>
          </div>
        </div>
      </div>
      <div
        id="candidate-panel-teams"
        role="tabpanel"
        aria-labelledby="candidate-tab-teams"
        hidden={tab !== "teams"}
        className="space-y-6"
      >
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className={panel}>
            <h2 className="font-fraunces text-heading text-ink">
              {t("candidateProgram.radarTitle", locale)}
            </h2>
            <CandidateRadar
              name={name}
              dimensions={dimensions}
              baseline={active?.dimensions}
              teamName={active?.teamName || t("candidateProgram.team", locale)}
              locale={locale}
            />
            <p className="mt-4 text-caption text-muted">
              {t("candidateProgram.sourceNote", locale)}
            </p>
          </section>
          <div className="space-y-3">
            {comparisons.length === 0 && (
              <p className={`${panel} text-muted`}>
                {t("candidateProgram.noTeams", locale)}
              </p>
            )}
            {comparisons.map((c) => (
              <article
                key={c.teamId}
                className={`rounded-2xl border bg-surface-card p-4 ${active?.teamId === c.teamId ? "border-sage" : "border-sand"}`}
              >
                <button
                  disabled={blocked}
                  aria-pressed={active?.teamId === c.teamId}
                  onClick={() => setSelected(c.teamId)}
                  className="flex w-full items-center gap-3 text-left disabled:opacity-60"
                >
                  <div className="w-24 shrink-0 sm:w-28">
                    <CandidateRadar
                      compact
                      name={name}
                      dimensions={dimensions}
                      baseline={c.dimensions}
                      locale={locale}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="break-words font-fraunces text-heading text-ink">
                      {c.teamName || t("candidateProgram.team", locale)}
                    </h3>
                    <p className="mt-1 text-note text-muted">
                      n={c.count} · {c.publishedAt.slice(0, 10)} · v{c.revision}
                    </p>
                    {active?.teamId === c.teamId && (
                      <span className="mt-2 inline-block rounded-full bg-sage/10 px-3 py-1 text-note text-sage">
                        {t("candidateProgram.selectedTeam", locale)}
                      </span>
                    )}
                  </div>
                </button>
                <div className="mt-3 grid gap-3 border-t border-sand pt-3 sm:grid-cols-2">
                  <div>
                    <p className="text-caption font-semibold text-sage">
                      {t("candidateProgram.connection", locale)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-caption text-ink-body">
                      {c.connection ||
                        t("candidateProgram.emptyObservation", locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-caption font-semibold text-bronze">
                      {t("candidateProgram.difference", locale)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-caption text-ink-body">
                      {c.difference ||
                        t("candidateProgram.emptyObservation", locale)}
                    </p>
                  </div>
                </div>
                {invalidSources.includes(c.reportId) && (
                  <p className="mt-3 text-caption text-bronze">
                    {t("candidateProgram.sourceChanged", locale)}
                  </p>
                )}
              </article>
            ))}
            {comparisons.length < MAX_CANDIDATE_COMPARISONS && (
              <div className="rounded-2xl border border-dashed border-sand p-4">
                <label
                  className="block text-caption text-muted"
                  htmlFor="candidate-source"
                >
                  {t("candidateProgram.selectTeam", locale)}
                </label>
                <select
                  id="candidate-source"
                  value={source}
                  disabled={busy || annotationDirty}
                  onChange={(e) => setSource(e.target.value)}
                  className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-sand bg-surface-card px-3 text-base"
                >
                  <option value="">
                    {t("candidateProgram.selectTeam", locale)}
                  </option>
                  {available.map((s) => (
                    <option key={s.reportId} value={s.reportId}>
                      {s.teamName} · {s.publishedAt.slice(0, 10)} · n={s.count}
                    </option>
                  ))}
                </select>
                {!available.length && (
                  <p className="mt-2 text-caption text-muted">
                    {t("candidateProgram.noSources", locale)}
                  </p>
                )}
                <Button
                  className="mt-3"
                  variant="secondary"
                  disabled={
                    blocked || !available.some((s) => s.reportId === source)
                  }
                  onClick={() => {
                    const s = available.find((s) => s.reportId === source);
                    if (s)
                      void mutate("addTeam", {
                        teamId: s.teamId,
                        reportId: s.reportId,
                      });
                  }}
                >
                  {t("candidateProgram.addTeam", locale)}
                </Button>
              </div>
            )}
          </div>
        </div>
        {active && (
          <ComparisonNotes
            key={`${active.teamId}-${report.revision}`}
            suggestions={comparisonSuggestions[active.teamId] ?? []}
            comparison={active}
            locale={locale}
            busy={busy}
            onDirty={setAnnotationDirty}
            save={(fields) =>
              mutate("annotateTeam", { teamId: active.teamId, ...fields })
            }
            remove={() => mutate("removeTeam", { teamId: active.teamId })}
          />
        )}
        {comparisons.some((c) => c.prompt) && (
          <section className="rounded-2xl border border-sand bg-bronze/5 p-6">
            <h2 className="font-fraunces text-heading">
              {t("candidateProgram.prompts", locale)}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {comparisons
                .filter((c) => c.prompt)
                .map((c, i) => (
                  <div
                    key={c.teamId}
                    className="flex gap-3 rounded-xl bg-surface-card p-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bronze/15 text-bronze">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-note text-muted">{c.teamName}</p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-ink-body">
                        {c.prompt}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
      <div
        id="candidate-panel-feedback"
        role="tabpanel"
        aria-labelledby="candidate-tab-feedback"
        hidden={tab !== "feedback"}
      >
        <div className={editing ? "" : "hidden"}>
          <CandidateReportEditor
            key={report.revision}
            inviteId={inviteId}
            suggestions={suggestions}
            initial={report}
            locale={locale}
            rolePending={rolePending}
            onDirtyChange={setDirty}
          />
        </div>
        {!editing && (
          <div className="grid gap-5 md:grid-cols-2">
            {(["candidateSummary", "managerSummary"] as const).map((k) => (
              <section className={panel} key={k}>
                <p className="mb-3 text-note text-sage">
                  {t(
                    report.reviewedRevision === report.revision
                      ? "candidateProgram.reviewed"
                      : "candidateProgram.draft",
                    locale,
                  )}{" "}
                  · v{report.revision}
                </p>
                <h2 className="font-fraunces text-heading">
                  {t(`candidateProgram.${k}`, locale)}
                </h2>
                <p className="mt-4 whitespace-pre-wrap text-ink-body">
                  {report[k] || t("candidateProgram.emptyObservation", locale)}
                </p>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function ComparisonNotes({
  comparison,
  suggestions,
  locale,
  busy,
  onDirty,
  save,
  remove,
}: {
  comparison: CandidateComparison;
  suggestions: Suggestion[];
  locale: Locale;
  busy: boolean;
  onDirty: (v: boolean) => void;
  save: (fields: Record<string, string>) => Promise<void>;
  remove: () => Promise<void>;
}) {
  const [fields, setFields] = useState({
    connection: comparison.connection,
    difference: comparison.difference,
    prompt: comparison.prompt,
  });
  const dirty = Object.entries(fields).some(
    ([k, v]) => v !== comparison[k as keyof typeof fields],
  );
  return (
    <details
      className="rounded-2xl border border-sand bg-surface-card p-5"
      open={dirty || undefined}
    >
      <summary className="min-h-11 cursor-pointer font-fraunces text-heading">
        {t("candidateProgram.notesTitle", locale)} · {comparison.teamName}
      </summary>
      <p className="my-3 text-caption text-muted">
        {t("candidateProgram.annotationNotice", locale)}
      </p>
      <CandidateSuggestions
        suggestions={suggestions}
        locale={locale}
        disabled={busy}
        insert={(suggestion, text) => {
          const key = suggestion.target;
          if (key !== "connection" && key !== "difference" && key !== "prompt")
            return false;
          const value = [fields[key], text].filter(Boolean).join("\n\n");
          if (value.length > 2000) return false;
          setFields({ ...fields, [key]: value });
          onDirty(true);
          return true;
        }}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {(["connection", "difference", "prompt"] as const).map((k) => (
          <label key={k} className="text-caption">
            {t(`candidateProgram.${k}`, locale)}
            <textarea
              maxLength={2000}
              disabled={busy}
              value={fields[k]}
              onChange={(e) => {
                const next = { ...fields, [k]: e.target.value };
                setFields(next);
                onDirty(
                  Object.entries(next).some(
                    ([key, v]) => v !== comparison[key as keyof typeof fields],
                  ),
                );
              }}
              className="mt-2 min-h-28 w-full rounded-xl border border-sand bg-cream p-3 text-base"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button disabled={!dirty || busy} onClick={() => void save(fields)}>
          {t("candidateProgram.save", locale)}
        </Button>
        <Button
          variant="secondary"
          disabled={dirty || busy}
          onClick={() => void remove()}
        >
          {t("candidateProgram.removeTeam", locale)}
        </Button>
      </div>
    </details>
  );
}
