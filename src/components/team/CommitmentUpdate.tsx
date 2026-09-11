"use client";

import { useRef } from "react";
import { t, type Locale } from "@/lib/i18n";
import type { CommitmentStatus, TeamCommitment } from "@/lib/team-commitments";
import { Button } from "@/components/ui/primitives/Button";
import { TextareaField } from "@/components/ui/primitives/TextareaField";
import { CommitmentFormFeedback, useCommitmentForm, type ReloadCommitments, type SaveCommitment } from "./CommitmentFormFeedback";
import { useCommitmentDraft } from "./CommitmentDraft";

export function CommitmentUpdate({ item, draftScope, locale, onSave, onReload, onClose }: {
  item: TeamCommitment; draftScope: string; locale: Locale; onSave: SaveCommitment; onReload: ReloadCommitments; onClose: () => void;
}) {
  const [draft, setDraft, clearDraft] = useCommitmentDraft(`${draftScope}:${item.id}:update`, {
    status: (item.status === "not_started" ? "in_progress" : item.status) as CommitmentStatus,
    note: "", version: item.version,
  });
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const form = useCommitmentForm({ onSave, onReload,
    selectLatest: (fresh) => fresh.items.find((entry) => entry.id === item.id),
    onLatest: (latest) => setDraft((current) => ({ ...current, version: latest.version })),
  });
  const needsNote = draft.status === "blocked" || draft.status === "done";
  return (
    <form className="min-w-0 space-y-4" aria-label={t("commitments.update", locale)} onSubmit={async (event) => {
      event.preventDefault();
      if (needsNote && !draft.note.trim()) { form.setError("NOTE_REQUIRED"); noteRef.current?.focus(); return; }
      if (await form.save({ action: "update", id: item.id, expectedVersion: draft.version, status: draft.status, note: draft.note.trim() })) { clearDraft(); onClose(); }
    }}>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink">{t("commitments.statusQuestion", locale)}</legend>
        <div className="flex flex-wrap gap-2">
          {(["in_progress", "blocked", "done"] as const).map((status) => (
            <label key={status} className={`flex min-h-11 min-w-0 max-w-full cursor-pointer items-start gap-2 rounded-lg border px-3 py-3 text-sm ${draft.status === status ? "border-action-primary-bg bg-surface-team-accent-soft text-ink" : "border-border-default text-ink-body"}`}>
              <input type="radio" name={`status-${item.id}`} value={status} checked={draft.status === status} onChange={() => setDraft((current) => ({ ...current, status }))} autoFocus={draft.status === status} className="mt-0.5 size-4 shrink-0 accent-[var(--color-action-primary-bg)]" />
              <span>{t(status === "in_progress" ? "commitments.progress" : `commitments.status.${status}`, locale)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <TextareaField ref={noteRef} label={t(draft.status === "blocked" ? "commitments.helpQuestion" : draft.status === "done" ? "commitments.doneQuestion" : "commitments.updateQuestion", locale)} helpText={t("commitments.sharedNote", locale)} value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} required={needsNote} rows={2} maxLength={2000} textareaClassName="min-w-0 !min-h-20 !text-base" />
      <CommitmentFormFeedback form={form} locale={locale} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" disabled={form.busy} className="max-w-full whitespace-normal py-2" onClick={() => { clearDraft(); onClose(); }}>{t("commitments.cancel", locale)}</Button>
        <Button type="submit" loading={form.busy} disabled={form.saveDisabled} className="max-w-full whitespace-normal py-2">{t(form.busy ? "commitments.saving" : "commitments.saveUpdate", locale)}</Button>
      </div>
    </form>
  );
}
