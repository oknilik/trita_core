"use client";
import { CandidateSuggestions } from "./CandidateSuggestions";
import type { Suggestion } from "@/lib/candidate-programs/suggestions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives/Card";
import { SelectField } from "@/components/ui/primitives/SelectField";
import { TextareaField } from "@/components/ui/primitives/TextareaField";
import { Button } from "@/components/ui/primitives/Button";
import { t, type Locale } from "@/lib/i18n";
export function CandidateReportEditor({
  inviteId,
  initial,
  locale,
  rolePending,
  onDirtyChange,
  suggestions = [],
  leaderRecipients = [],
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
  leaderRecipients?: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [recipientUserId, setRecipientUserId] = useState("");
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
          ...(audience === "manager" ? { recipientUserId } : {}),
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
    <Card as="section" className="space-y-5" spacing="lg">
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
          <TextareaField
            key={key}
            label={t(
              `candidateProgram.${key === "internalNotes" ? "notes" : key}`,
              locale,
            )}
            disabled={busy}
            value={fields[key]}
            maxLength={key === "internalNotes" ? 20000 : 12000}
            onChange={(e) => {
              setFields({ ...fields, [key]: e.target.value });
              setShare(null);
            }}
            textareaClassName="min-h-32"
          />
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
      <SelectField
        label={t("candidateProgram.leaderRecipient", locale)}
        helpText={t(
          leaderRecipients.length
            ? "candidateProgram.leaderAccessNote"
            : "candidateProgram.noLeaderRecipient",
          locale,
        )}
        value={recipientUserId}
        disabled={busy}
        onChange={(e) => {
          setRecipientUserId(e.target.value);
          setShare(null);
        }}
      >
        <option value="">{t("candidateProgram.chooseLeader", locale)}</option>
        {leaderRecipients.map((recipient) => (
          <option key={recipient.id} value={recipient.id}>
            {recipient.label}
          </option>
        ))}
      </SelectField>
      <p className="text-caption text-muted">
        {t("candidateProgram.sharePrivacyNote", locale)}
      </p>
      <div className="flex flex-wrap gap-3">
        {(["candidate", "manager"] as const).map((audience) => (
          <Button
            key={audience}
            variant="secondary"
            disabled={
              busy ||
              dirty ||
              report.reviewedRevision !== report.revision ||
              (audience === "manager" &&
                !leaderRecipients.some((r) => r.id === recipientUserId))
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
    </Card>
  );
}
