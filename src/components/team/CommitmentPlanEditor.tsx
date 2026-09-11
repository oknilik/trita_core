"use client";

import { t, type Locale } from "@/lib/i18n";
import type { CommitmentPlan } from "@/lib/team-commitments";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";
import { TextareaField } from "@/components/ui/primitives/TextareaField";
import { CommitmentFormFeedback, useCommitmentForm, type ReloadCommitments, type SaveCommitment } from "./CommitmentFormFeedback";
import { useCommitmentDraft } from "./CommitmentDraft";

export function CommitmentPlanEditor({ plan, draftScope, locale, onSave, onReload, onClose }: {
  plan: CommitmentPlan; draftScope: string; locale: Locale; onSave: SaveCommitment; onReload: ReloadCommitments; onClose: () => void;
}) {
  const [draft, setDraft, clearDraft] = useCommitmentDraft(`${draftScope}:plan`, plan);
  const form = useCommitmentForm({ onSave, onReload, selectLatest: (fresh) => fresh.plan,
    onLatest: (latest) => setDraft((current) => ({ ...current, version: latest.version })),
  });
  return (
    <form aria-label={t("commitments.editPlan", locale)} className="min-w-0 space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      if (await form.save({ action: "plan", expectedVersion: draft.version, focus: draft.focus.trim(), nextCheckInDate: draft.nextCheckInDate })) { clearDraft(); onClose(); }
    }}>
      <TextareaField label={t("commitments.focus", locale)} value={draft.focus} onChange={(event) => setDraft((current) => ({ ...current, focus: event.target.value }))} maxLength={2000} rows={2} autoFocus textareaClassName="min-w-0 !min-h-20 !text-base" />
      <TextField type="date" label={t("commitments.checkIn", locale)} helpText={t("commitments.checkInHelp", locale)} value={draft.nextCheckInDate ?? ""} onChange={(event) => setDraft((current) => ({ ...current, nextCheckInDate: event.target.value || null }))} inputClassName="min-w-0 !text-base" />
      <CommitmentFormFeedback form={form} locale={locale} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" disabled={form.busy} className="max-w-full whitespace-normal py-2" onClick={() => { clearDraft(); onClose(); }}>{t("commitments.cancel", locale)}</Button>
        <Button type="submit" loading={form.busy} disabled={form.saveDisabled} className="max-w-full whitespace-normal py-2">{t(form.busy ? "commitments.saving" : "commitments.savePlan", locale)}</Button>
      </div>
    </form>
  );
}
