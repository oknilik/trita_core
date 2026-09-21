"use client";
import { CandidateSuggestions } from "./CandidateSuggestions";
import type { Suggestion } from "@/lib/candidate-programs/suggestions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { t, type Locale } from "@/lib/i18n";
export function CandidateReportEditor({
  inviteId,
  initial,
  locale,
  rolePending,
  onDirtyChange,
  suggestions = [],
}: {
  inviteId: string;
  initial: {
    revision: number;
    reviewedRevision: number | null;
    candidateSummary: string;
    managerSummary: string;
    internalNotes: string;
  };
  locale: Locale;
  rolePending: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  suggestions?: Suggestion[];
}) {
  const router = useRouter();
  const [report, setReport] = useState(initial),
    [fields, setFields] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [share, setShare] = useState<string | null>(null);
  const dirty = ["candidateSummary", "managerSummary", "internalNotes"].some(
    (key) =>
      fields[key as keyof typeof fields] !== report[key as keyof typeof report],
  );
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  async function mutate(action: string, audience?: string) {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/manager/candidates/${inviteId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          expectedRevision: report.revision,
          ...(audience ? { audience } : {}),
          ...(action === "save"
            ? {
                candidateSummary: fields.candidateSummary,
                managerSummary: fields.managerSummary,
                internalNotes: fields.internalNotes,
              }
            : {}),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReport(data);
      setFields(data);
      setShare(data.sharePath ?? null);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5 rounded-2xl border border-sand bg-surface-card p-5 sm:p-6">
      <h2 className="font-fraunces text-heading text-ink">
        {t(
          report.reviewedRevision === report.revision && !dirty
            ? "candidateProgram.reviewed"
            : "candidateProgram.draft",
          locale,
        )}{" "}
        · v{report.revision}
      </h2>
      <CandidateSuggestions
        suggestions={suggestions}
        locale={locale}
        disabled={busy}
        insert={(suggestion, text) => {
          const key = suggestion.target;
          if (key !== "candidateSummary" && key !== "managerSummary")
            return false;
          const value = [fields[key], text].filter(Boolean).join("\n\n");
          if (value.length > 12000) return false;
          setFields({ ...fields, [key]: value });
          setShare(null);
          return true;
        }}
      />
      {(["candidateSummary", "managerSummary", "internalNotes"] as const).map(
        (key) => (
          <label key={key} className="block text-caption text-ink">
            {t(
              `candidateProgram.${key === "internalNotes" ? "notes" : key}`,
              locale,
            )}
            <textarea
              disabled={busy}
              value={fields[key]}
              maxLength={key === "internalNotes" ? 20000 : 12000}
              onChange={(e) => {
                setFields({ ...fields, [key]: e.target.value });
                setShare(null);
              }}
              className="mt-2 min-h-32 w-full rounded-xl border border-sand bg-cream p-3 text-base"
            />
          </label>
        ),
      )}
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy || !dirty} onClick={() => void mutate("save")}>
          {t("candidateProgram.save", locale)}
        </Button>
        <Button
          variant="secondary"
          disabled={
            busy ||
            dirty ||
            rolePending ||
            !fields.candidateSummary.trim() ||
            !fields.managerSummary.trim()
          }
          onClick={() => void mutate("review")}
        >
          {t("candidateProgram.review", locale)}
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        {(["candidate", "manager"] as const).map((audience) => (
          <Button
            key={audience}
            variant="secondary"
            disabled={
              busy || dirty || report.reviewedRevision !== report.revision
            }
            onClick={() => void mutate("share", audience)}
          >
            {t(
              audience === "candidate"
                ? "candidateProgram.shareCandidate"
                : "candidateProgram.shareManager",
              locale,
            )}
          </Button>
        ))}
        <Button
          variant="secondary"
          disabled={busy || dirty}
          onClick={() => void mutate("revoke")}
        >
          {t("candidateProgram.revoke", locale)}
        </Button>
      </div>
      {share && (
        <a
          className="block break-all text-caption text-sage underline"
          href={share}
          target="_blank"
          rel="noreferrer"
        >
          {t("candidateProgram.preview", locale)}
        </a>
      )}
      {error && (
        <p role="alert" className="text-caption text-ink-body">
          {t("candidateProgram.reportError", locale)}
        </p>
      )}
    </section>
  );
}
