"use client";

import { useRef } from "react";
import { t, type Locale } from "@/lib/i18n";
import type { CommitmentFields, TeamCommitment, TeamCommitmentsWorkspace } from "@/lib/team-commitments";
import { Button } from "@/components/ui/primitives/Button";
import { TextField } from "@/components/ui/primitives/TextField";
import { TextareaField } from "@/components/ui/primitives/TextareaField";
import { SelectField } from "@/components/ui/primitives/SelectField";
import { SectionHeading } from "@/components/ui/primitives/SectionHeading";
import { CommitmentFormFeedback, useCommitmentForm, type ReloadCommitments, type SaveCommitment } from "./CommitmentFormFeedback";
import { useCommitmentDraft } from "./CommitmentDraft";

export function CommitmentEditor({
  item, workspace, locale, onSave, onReload, onClose,
}: {
  item?: TeamCommitment;
  workspace: TeamCommitmentsWorkspace;
  locale: Locale;
  onSave: SaveCommitment;
  onReload: ReloadCommitments;
  onClose: () => void;
}) {
  const [draft, setDraft, clearDraft] = useCommitmentDraft(`${workspace.viewerId}:${workspace.teamId}:${item?.id ?? "new"}:edit`, {
    fields: {
      title: item?.title ?? "", description: item?.description ?? "", nextStep: item?.nextStep ?? "",
      successCriteria: item?.successCriteria ?? "", ownerUserId: item?.ownerUserId ?? null, dueDate: item?.dueDate ?? null,
    } satisfies CommitmentFields,
    version: item?.version ?? 0,
  });
  const form = useCommitmentForm({
    onSave, onReload,
    selectLatest: item ? (fresh) => fresh.items.find((entry) => entry.id === item.id) : undefined,
    onLatest: (latest) => setDraft((current) => ({ ...current, version: latest.version })),
  });
  const titleRef = useRef<HTMLInputElement>(null);
  const fields = draft.fields;
  function change<Key extends keyof CommitmentFields>(key: Key, value: CommitmentFields[Key]) {
    setDraft((current) => ({ ...current, fields: { ...current.fields, [key]: value } }));
  }
  return (
    <form className="min-w-0 space-y-4" aria-label={t(item ? "commitments.edit" : "commitments.create", locale)} onSubmit={async (event) => {
      event.preventDefault();
      if (!fields.title.trim()) { titleRef.current?.focus(); form.setError("INVALID_INPUT"); return; }
      const cleaned = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])) as unknown as CommitmentFields;
      if (await form.save(item ? { action: "edit", id: item.id, expectedVersion: draft.version, fields: cleaned } : { action: "create", fields: cleaned })) {
        clearDraft(); onClose();
      }
    }}>
      <SectionHeading as="h3" size="sm">{t(item ? "commitments.edit" : "commitments.create", locale)}</SectionHeading>
      <TextField ref={titleRef} label={t("commitments.commitmentTitle", locale)} value={fields.title} onChange={(event) => change("title", event.target.value)} required maxLength={200} autoFocus inputClassName="min-w-0 !text-base" />
      <TextareaField label={t("commitments.nextStep", locale)} value={fields.nextStep} onChange={(event) => change("nextStep", event.target.value)} maxLength={2000} rows={2} textareaClassName="min-w-0 !min-h-20 !text-base" />
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <SelectField label={t("commitments.chooseOwner", locale)} value={fields.ownerUserId ?? ""} onChange={(event) => change("ownerUserId", event.target.value || null)} selectClassName="min-w-0 !text-base" helpText={!fields.ownerUserId ? t("commitments.noLinkedOwner", locale) : undefined}>
          <option value="">{t("commitments.unassigned", locale)}</option>
          {fields.ownerUserId && !workspace.assignees.some((assignee) => assignee.userId === fields.ownerUserId) ? <option value={fields.ownerUserId} disabled>{item?.ownerName ?? t("commitments.unassigned", locale)}</option> : null}
          {workspace.assignees.map((assignee) => <option key={assignee.userId} value={assignee.userId}>{assignee.name}</option>)}
        </SelectField>
        <TextField type="date" label={t("commitments.dueDate", locale)} helpText={t("commitments.dateHelp", locale)} value={fields.dueDate ?? ""} onChange={(event) => change("dueDate", event.target.value || null)} inputClassName="min-w-0 !text-base" />
      </div>
      <details open={item ? undefined : false} className="border-t border-border-default pt-2">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus-ring">{t("commitments.moreFields", locale)}</summary>
        <div className="space-y-4 py-3">
          <TextareaField label={t("commitments.description", locale)} value={fields.description} onChange={(event) => change("description", event.target.value)} maxLength={2000} rows={3} textareaClassName="min-w-0 !text-base" />
          <TextareaField label={t("commitments.successCriteria", locale)} value={fields.successCriteria} onChange={(event) => change("successCriteria", event.target.value)} maxLength={2000} rows={2} textareaClassName="min-w-0 !min-h-20 !text-base" />
        </div>
      </details>
      <CommitmentFormFeedback form={form} locale={locale} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" disabled={form.busy} className="max-w-full whitespace-normal py-2" onClick={() => { clearDraft(); onClose(); }}>{t("commitments.cancel", locale)}</Button>
        <Button type="submit" loading={form.busy} disabled={form.saveDisabled} className="max-w-full whitespace-normal py-2">{t(form.busy ? "commitments.saving" : "commitments.saveCommitment", locale)}</Button>
      </div>
    </form>
  );
}
