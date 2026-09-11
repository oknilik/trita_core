"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import type { CommitmentMutation, CommitmentPatch, CommitmentPlan, TeamCommitment, TeamCommitmentsWorkspace } from "@/lib/team-commitments";
import { Button } from "@/components/ui/primitives/Button";
import { InlineBanner } from "@/components/ui/primitives/InlineBanner";

export type SaveCommitment = (mutation: CommitmentMutation | CommitmentPatch) => Promise<void>;
export type ReloadCommitments = () => Promise<TeamCommitmentsWorkspace>;
type LatestRecord = TeamCommitment | CommitmentPlan;

const knownErrors = new Set([
  "VERSION_CONFLICT", "FORBIDDEN", "UNAUTHORIZED", "CAPABILITY_DENIED", "OWNER_NOT_TEAM_MEMBER",
  "NOTE_REQUIRED", "INVALID_INPUT", "NOT_FOUND", "SOURCE_NOT_PUBLISHED", "refresh",
]);

export function useCommitmentForm({
  onSave,
  onReload,
  selectLatest,
  onLatest,
}: {
  onSave: SaveCommitment;
  onReload: ReloadCommitments;
  selectLatest?: (workspace: TeamCommitmentsWorkspace) => LatestRecord | undefined;
  onLatest?: (record: LatestRecord) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<LatestRecord | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [requiresReview, setRequiresReview] = useState(false);
  const [awaitingLatest, setAwaitingLatest] = useState(false);

  async function save(mutation: CommitmentMutation | CommitmentPatch) {
    if (busy || refreshing || awaitingLatest || (requiresReview && !reviewed)) return false;
    setBusy(true);
    setError(null);
    try {
      await onSave(mutation);
      return true;
    } catch (failure) {
      const code = failure instanceof Error ? failure.message : "generic";
      setError(knownErrors.has(code) ? code : "generic");
      if (code === "VERSION_CONFLICT") {
        setAwaitingLatest(true);
        setLatest(null);
        setRequiresReview(false);
        setReviewed(false);
      }
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function reload() {
    setRefreshing(true);
    try {
      const workspace = await onReload();
      const record = selectLatest?.(workspace);
      if (selectLatest && !record) {
        setError("NOT_FOUND");
        return;
      }
      if (record) {
        setLatest(record);
        setAwaitingLatest(false);
        setRequiresReview(true);
        setReviewed(false);
      }
      setError(null);
    } catch {
      setError("refresh");
    } finally {
      setRefreshing(false);
    }
  }

  function review(value: boolean) {
    setReviewed(value);
    if (value && latest) onLatest?.(latest);
  }

  return {
    busy, refreshing, error, latest, reviewed, requiresReview, setReviewed: review, setError, save, reload,
    saveDisabled: busy || refreshing || awaitingLatest || (requiresReview && !reviewed),
  };
}

export function CommitmentFormFeedback({
  form,
  locale,
}: {
  form: ReturnType<typeof useCommitmentForm>;
  locale: Locale;
}) {
  const canReload = form.error && ["VERSION_CONFLICT", "OWNER_NOT_TEAM_MEMBER", "SOURCE_NOT_PUBLISHED", "refresh"].includes(form.error);
  return (
    <div className="space-y-3">
      {form.error ? (
        <InlineBanner variant="error">
          <p>{t(`commitments.errors.${form.error}`, locale)}</p>
          {canReload ? <Button type="button" variant="secondary" className="mt-3 max-w-full whitespace-normal py-2" onClick={form.reload} loading={form.refreshing}>{t("commitments.refreshConflict", locale)}</Button> : null}
        </InlineBanner>
      ) : null}
      {form.latest ? (
        <InlineBanner variant="warning" role="status" title={t("commitments.currentVersion", locale)}>
          {"title" in form.latest ? (
            <dl className="mt-2 space-y-2">
              {[
                ["commitmentTitle", form.latest.title],
                ["nextStep", form.latest.nextStep],
                ["owner", form.latest.ownerName],
                ["dueDate", form.latest.dueDate],
                ["description", form.latest.description],
                ["successCriteria", form.latest.successCriteria],
                ["latestNote", form.latest.latestNote],
              ].map(([key, value]) => value ? <div key={key}><dt className="font-semibold">{t(`commitments.${key}`, locale)}</dt><dd className="whitespace-pre-wrap">{value}</dd></div> : null)}
              <div><dt className="sr-only">{t("commitments.statusQuestion", locale)}</dt><dd>{t(`commitments.status.${form.latest.status}`, locale)}</dd></div>
            </dl>
          ) : (
            <dl className="mt-2 space-y-2">
              <div><dt className="font-semibold">{t("commitments.focus", locale)}</dt><dd>{form.latest.focus || t("commitments.noFocus", locale)}</dd></div>
              <div><dt className="font-semibold">{t("commitments.checkIn", locale)}</dt><dd>{form.latest.nextCheckInDate || t("commitments.noCheckIn", locale)}</dd></div>
            </dl>
          )}
          <p className="mt-3">{t("commitments.conflictRefreshed", locale)}</p>
          <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-2 py-2">
            <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[var(--color-action-primary-bg)]" checked={form.reviewed} onChange={(event) => form.setReviewed(event.target.checked)} />
            <span>{t("commitments.confirmReview", locale)}</span>
          </label>
        </InlineBanner>
      ) : null}
    </div>
  );
}
