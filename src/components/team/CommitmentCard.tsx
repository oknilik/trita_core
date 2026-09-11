"use client";

import { useRef, useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import type { CommitmentStatus, TeamCommitment, TeamCommitmentsWorkspace } from "@/lib/team-commitments";
import { commitmentAttention } from "@/lib/team-commitments-view";
import { teamActionTargetLabel } from "@/lib/team-action-target";
import { getAvatarMonogram } from "@/lib/ui/avatar";
import { Button } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { StatusChip, type StatusChipVariant } from "@/components/ui/primitives/StatusChip";
import { CommitmentEditor } from "./CommitmentEditor";
import { CommitmentUpdate } from "./CommitmentUpdate";
import type { ReloadCommitments, SaveCommitment } from "./CommitmentFormFeedback";

export function formatCommitmentDate(value: string, locale: Locale, includeTime = false) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "hu" ? "hu-HU" : "en-GB", {
    year: "numeric", month: "short", day: "numeric", ...(includeTime ? { hour: "2-digit", minute: "2-digit" } as const : {}),
  }).format(date);
}

const statusTone: Record<CommitmentStatus, StatusChipVariant> = { not_started: "neutral", in_progress: "info", blocked: "warning", done: "success" };
const statusMark: Record<CommitmentStatus, string> = { not_started: "○", in_progress: "→", blocked: "!", done: "✓" };

export function CommitmentCard({ item, workspace, todayIso, locale, onSave, onReload }: {
  item: TeamCommitment; workspace: TeamCommitmentsWorkspace; todayIso: string; locale: Locale; onSave: SaveCommitment; onReload: ReloadCommitments;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const updateRef = useRef<HTMLButtonElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const reasons = commitmentAttention(item, todayIso);
  const own = item.ownerUserId === workspace.viewerId;
  const canUpdate = workspace.canManage || (workspace.canUpdateOwn && own);
  const events = [...item.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latestNoteEvent = item.latestNote ? events.find((event) => event.eventType !== "IMPORTED" && event.note === item.latestNote) : undefined;
  const closeUpdate = () => { setUpdateOpen(false); updateRef.current?.focus(); };
  const closeEdit = () => { setEditOpen(false); editRef.current?.focus(); };

  return (
    <Card as="article" spacing="none" id={`commitment-${item.id}`} tabIndex={-1} aria-labelledby={`commitment-title-${item.id}`} className={`scroll-mt-24 min-w-0 p-4 wrap-anywhere md:p-5 ${reasons.length ? "border-l-4 border-l-state-warning-border" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 id={`commitment-title-${item.id}`} className="min-w-0 flex-1 basis-64 text-base font-semibold leading-relaxed text-ink">{item.title}</h3>
        <StatusChip variant={statusTone[item.status]} className="max-w-full gap-1.5 !whitespace-normal"><span aria-hidden="true">{statusMark[item.status]}</span>{t(`commitments.status.${item.status}`, locale)}</StatusChip>
      </div>
      {reasons.length ? <ul aria-label={t("commitments.attentionLabel", locale)} className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-state-warning-fg">{reasons.map((reason) => <li key={reason}>{t(`commitments.attention.${reason}`, locale)}</li>)}</ul> : null}
      {item.status !== "done" ? <p className="my-4 whitespace-pre-wrap text-sm leading-relaxed text-ink"><span className="text-ink-body">{t("commitments.nextStep", locale)}: </span>{item.nextStep || t("commitments.noNextStep", locale)}</p> : item.latestNote ? <p className="my-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-body">{item.latestNote}</p> : null}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5 text-caption text-ink-body">
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-ink">{getAvatarMonogram(item.ownerName, { length: 2 })}</span>
          <div className="min-w-0">
            <p>{item.ownerName || t("commitments.unassigned", locale)}{own ? ` · ${t("commitments.you", locale)}` : ""}</p>
            <p>{t("commitments.dueDate", locale)}: {item.dueDate ? <time dateTime={item.dueDate}>{formatCommitmentDate(item.dueDate, locale)}</time> : t("commitments.noDueDate", locale)}</p>
          </div>
        </div>
        <div className="flex min-w-0 max-w-full flex-wrap gap-1">
          <Button type="button" variant="ghost" className="max-w-full whitespace-normal py-2" aria-expanded={detailsOpen} aria-controls={`commitment-details-${item.id}`} onClick={() => setDetailsOpen(!detailsOpen)}>{t("commitments.details", locale)}</Button>
          {canUpdate ? <Button ref={updateRef} type="button" variant={own || item.status === "blocked" ? "primary" : "secondary"} className="max-w-full whitespace-normal py-2" aria-expanded={updateOpen} aria-controls={`commitment-update-${item.id}`} onClick={() => setUpdateOpen(!updateOpen)}>{t(own ? "commitments.update" : item.status === "blocked" ? "commitments.reviewBlock" : "commitments.managerUpdate", locale)}</Button> : null}
        </div>
      </div>
      {detailsOpen ? (
        <div id={`commitment-details-${item.id}`} className="mt-4 min-w-0 space-y-4 border-t border-border-default pt-4 text-sm leading-relaxed text-ink-body">
          <dl className="space-y-4">
            <div><dt className="font-semibold text-ink">{t("commitments.description", locale)}</dt><dd className="mt-1 whitespace-pre-wrap">{item.description || t("commitments.notRecorded", locale)}</dd></div>
            <div><dt className="font-semibold text-ink">{t("commitments.successCriteria", locale)}</dt><dd className="mt-1 whitespace-pre-wrap">{item.successCriteria || t("commitments.notRecorded", locale)}</dd></div>
            {item.latestNote ? <div><dt className="font-semibold text-ink">{t("commitments.latestNote", locale)}{latestNoteEvent ? ` · ${latestNoteEvent.actorName}` : ""}</dt><dd className="mt-1 whitespace-pre-wrap">{item.latestNote}</dd></div> : null}
            {item.targetMetric ? <div><dt className="font-semibold text-ink">{t("commitments.target", locale)}</dt><dd className="mt-1">{teamActionTargetLabel(item.targetMetric, locale)}</dd></div> : null}
            {item.sourceReportTitle ? <div><dt className="font-semibold text-ink">{t("commitments.source", locale)}</dt><dd className="mt-1">{item.sourceReportTitle}</dd></div> : null}
          </dl>
          {item.ownerName && !item.ownerUserId ? <p className="text-xs text-state-warning-fg">{t("commitments.legacyOwner", locale)}</p> : null}
          <p className="text-xs">{t("commitments.updated", locale)}: <time dateTime={item.updatedAt}>{formatCommitmentDate(item.updatedAt, locale, true)}</time></p>
          {workspace.canManage ? <Button ref={editRef} type="button" variant="secondary" className="max-w-full whitespace-normal py-2" aria-expanded={editOpen} aria-controls={`commitment-edit-${item.id}`} onClick={() => setEditOpen(!editOpen)}>{t("commitments.edit", locale)}</Button> : null}
          {editOpen && workspace.canManage ? <div id={`commitment-edit-${item.id}`} className="border-t border-border-default pt-4"><CommitmentEditor item={item} workspace={workspace} locale={locale} onSave={onSave} onReload={onReload} onClose={closeEdit} /></div> : null}
          <details className="border-t border-border-default pt-2">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus-ring">{t("commitments.history", locale)} · {events.length}</summary>
            {events.length ? <ol className="space-y-4 border-l border-border-default pl-4">{events.map((event) => {
              const eventKey = ["CREATED", "IMPORTED", "UPDATED", "EDITED"].includes(event.eventType) ? event.eventType.toLowerCase() : "fallback";
              return <li key={event.id}>
                <p className="font-medium text-ink">{event.actorName} · {t(`commitments.event.${eventKey}`, locale)}</p>
                <p className="text-xs"><time dateTime={event.createdAt}>{formatCommitmentDate(event.createdAt, locale, true)}</time> · {t(`commitments.status.${event.status}`, locale)}</p>
                {event.note ? <p className="mt-1 whitespace-pre-wrap">{event.eventType === "IMPORTED" ? <span className="block text-xs">{t("commitments.importedNote", locale)}</span> : null}{event.note}</p> : null}
              </li>;
            })}</ol> : <p>{t("commitments.noHistory", locale)}</p>}
          </details>
        </div>
      ) : null}
      {updateOpen && canUpdate ? <div id={`commitment-update-${item.id}`} className="mt-4 min-w-0 border-t border-border-default pt-4"><CommitmentUpdate item={item} draftScope={`${workspace.viewerId}:${workspace.teamId}`} locale={locale} onSave={onSave} onReload={onReload} onClose={closeUpdate} /></div> : null}
    </Card>
  );
}
