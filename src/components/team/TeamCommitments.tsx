"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t, tf, type Locale } from "@/lib/i18n";
import type { TeamCommitment, TeamCommitmentsWorkspace } from "@/lib/team-commitments";
import { commitmentAttention, commitmentCalendarDate, sortCommitments } from "@/lib/team-commitments-view";
import { Button } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { EmptyState } from "@/components/ui/primitives/EmptyState";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { SectionHeading } from "@/components/ui/primitives/SectionHeading";
import { TextField } from "@/components/ui/primitives/TextField";
import { CommitmentCard, formatCommitmentDate } from "./CommitmentCard";
import { CommitmentEditor } from "./CommitmentEditor";
import { CommitmentPlanEditor } from "./CommitmentPlanEditor";
import { CommitmentSuggestions } from "./CommitmentSuggestions";
import type { SaveCommitment } from "./CommitmentFormFeedback";

/** Parallel per-card responses must not replace a newer saved version with an older snapshot. */
function mergeWorkspace(current: TeamCommitmentsWorkspace, incoming: TeamCommitmentsWorkspace): TeamCommitmentsWorkspace {
  if (current.teamId !== incoming.teamId || current.viewerId !== incoming.viewerId) return incoming;
  const records = new Map(current.items.map((item) => [item.id, item]));
  for (const item of incoming.items) {
    const previous = records.get(item.id);
    if (!previous || previous.version <= item.version) records.set(item.id, item);
  }
  return { ...incoming, items: [...records.values()], plan: current.plan.version > incoming.plan.version ? current.plan : incoming.plan };
}

export function TeamCommitments({ initialWorkspace, isHu }: { initialWorkspace: TeamCommitmentsWorkspace; isHu: boolean }) {
  const router = useRouter();
  const locale: Locale = isHu ? "hu" : "en";
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [previousWorkspace, setPreviousWorkspace] = useState(initialWorkspace);
  const [createOpen, setCreateOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [completedSearch, setCompletedSearch] = useState("");
  const [notice, setNotice] = useState(false);
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const createRef = useRef<HTMLButtonElement>(null);
  const planRef = useRef<HTMLButtonElement>(null);
  const completedRef = useRef<HTMLElement>(null);
  const [todayIso, setTodayIso] = useState(() => new Date().toISOString().slice(0, 10));
  if (previousWorkspace !== initialWorkspace) {
    setPreviousWorkspace(initialWorkspace);
    setWorkspace((current) => mergeWorkspace(current, initialWorkspace));
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => setTodayIso(commitmentCalendarDate()));
    return () => cancelAnimationFrame(frame);
  }, []);

  async function reload() {
    const response = await fetch(`/api/team/${workspace.teamId}/commitments`, { cache: "no-store" });
    if (!response.ok) throw new Error("refresh");
    const fresh = await response.json() as TeamCommitmentsWorkspace;
    setWorkspace((current) => mergeWorkspace(current, fresh));
    return fresh;
  }
  const save: SaveCommitment = async (mutation) => {
    setNotice(false);
    const response = await fetch(`/api/team/${workspace.teamId}/commitments`, {
      method: mutation.action === "create" || mutation.action === "import" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mutation),
    });
    const result = await response.json().catch(() => null) as { error?: string; workspace?: TeamCommitmentsWorkspace } | null;
    if (!response.ok || !result?.workspace) throw new Error(result?.error ?? "generic");
    setWorkspace((current) => mergeWorkspace(current, result.workspace!));
    setNotice(true);
    router.refresh();
    if (mutation.action === "update") {
      const wasComplete = workspace.items.find((item) => item.id === mutation.id)?.status === "done";
      if (wasComplete !== (mutation.status === "done")) requestAnimationFrame(() => {
        if (mutation.status === "done") completedRef.current?.focus();
        else document.getElementById(`commitment-${mutation.id}`)?.focus();
      });
    }
  };
  const active = sortCommitments(workspace.items.filter((item) => item.status !== "done"), todayIso);
  const completed = workspace.items.filter((item) => item.status === "done").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const attentionCount = active.filter((item) => commitmentAttention(item, todayIso).length).length;
  const own = active.filter((item) => item.ownerUserId === workspace.viewerId);
  const others = active.filter((item) => item.ownerUserId !== workspace.viewerId);
  const matchingCompleted = completed.filter((item) => `${item.title} ${item.description} ${item.ownerName ?? ""} ${item.latestNote ?? ""}`.toLocaleLowerCase(locale).includes(completedSearch.toLocaleLowerCase(locale)));
  const renderCards = (items: TeamCommitment[]) => <div className="grid min-w-0 gap-3">{items.map((item) => <CommitmentCard key={item.id} item={item} workspace={workspace} todayIso={todayIso} locale={locale} onSave={save} onReload={reload} />)}</div>;

  return (
    <section aria-labelledby="team-commitments-heading" className="flex min-w-0 flex-col gap-6 pt-6 wrap-anywhere">
      <header>
        <SectionEyebrow tone="team">{t("commitments.eyebrow", locale)}</SectionEyebrow>
        <h2 id="team-commitments-heading" className="mt-2 font-fraunces text-title text-ink">{t("commitments.title", locale)}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-body">{t("commitments.intro", locale)}</p>
      </header>
      <Card surface="team" variant="muted" spacing="none" className="min-w-0 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 basis-72">
            <p className="text-caption text-ink-body">{t("commitments.focus", locale)}</p>
            <p className="mt-1 whitespace-pre-wrap text-base font-medium text-ink">{workspace.plan.focus || t("commitments.noFocus", locale)}</p>
            <p className="mt-4 text-caption text-ink-body">{t("commitments.checkIn", locale)}</p>
            <p className="mt-1 text-sm font-semibold text-ink">{workspace.plan.nextCheckInDate ? <time dateTime={workspace.plan.nextCheckInDate}>{formatCommitmentDate(workspace.plan.nextCheckInDate, locale)}</time> : t("commitments.noCheckIn", locale)}</p>
          </div>
          {workspace.canManage ? <Button ref={planRef} type="button" variant="secondary" className="max-w-full whitespace-normal py-2" aria-expanded={planOpen} aria-controls="commitment-plan-editor" onClick={() => setPlanOpen(!planOpen)}>{t("commitments.editPlan", locale)}</Button> : null}
        </div>
        {planOpen && workspace.canManage ? <div id="commitment-plan-editor" className="mt-5 border-t border-surface-team-border pt-5"><CommitmentPlanEditor plan={workspace.plan} draftScope={`${workspace.viewerId}:${workspace.teamId}`} locale={locale} onSave={save} onReload={reload} onClose={() => { setPlanOpen(false); planRef.current?.focus(); }} /></div> : null}
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-caption text-ink-body"><p>{tf("commitments.summary", locale, { active: active.length, done: completed.length })}</p><p className="mt-1">{attentionCount ? tf("commitments.attentionCount", locale, { count: attentionCount }) : t("commitments.noAttention", locale)}</p></div>
        {workspace.canManage ? <Button ref={createRef} type="button" className="max-w-full whitespace-normal py-2" aria-expanded={createOpen} aria-controls="commitment-create-editor" onClick={() => setCreateOpen(!createOpen)}>{t("commitments.create", locale)}</Button> : null}
      </div>
      <p ref={noticeRef} role="status" aria-live="polite" tabIndex={-1} className={notice ? "rounded-lg bg-state-success-bg p-3 text-sm text-state-success-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus-ring" : "sr-only"}>{notice ? t("commitments.saved", locale) : ""}</p>
      {createOpen && workspace.canManage ? <Card id="commitment-create-editor" spacing="none" className="min-w-0 p-4 md:p-5"><CommitmentEditor workspace={workspace} locale={locale} onSave={save} onReload={reload} onClose={() => { setCreateOpen(false); createRef.current?.focus(); }} /></Card> : null}
      {!workspace.items.length ? <EmptyState title={t("commitments.empty", locale)} description={t("commitments.emptyDescription", locale)} className="min-w-0" /> : !active.length ? <EmptyState title={t("commitments.noActive", locale)} description={t("commitments.noActiveDescription", locale)} className="min-w-0" /> : workspace.perspective === "team" ? (
        <div className="space-y-3"><SectionHeading size="sm">{t("commitments.active", locale)}</SectionHeading>{renderCards(active)}</div>
      ) : (
        <>
          <div className="space-y-3"><SectionHeading size="sm">{t("commitments.own", locale)}</SectionHeading>{own.length ? renderCards(own) : <EmptyState title={t("commitments.noOwn", locale)} description={t("commitments.noOwnDescription", locale)} className="min-w-0" />}</div>
          {others.length ? <div className="space-y-3"><SectionHeading size="sm">{t("commitments.others", locale)}</SectionHeading>{renderCards(others)}</div> : null}
        </>
      )}
      {completed.length ? <details className="border-t border-border-default pt-3"><summary ref={completedRef} className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus-ring">{tf("commitments.completed", locale, { count: completed.length })}</summary><div className="space-y-4 py-3"><TextField type="search" label={t("commitments.searchCompleted", locale)} value={completedSearch} onChange={(event) => setCompletedSearch(event.target.value)} inputClassName="min-w-0 !text-base" />{matchingCompleted.length ? renderCards(matchingCompleted) : <p className="text-sm text-ink-body">{t("commitments.noSearchResults", locale)}</p>}</div></details> : null}
      {workspace.canManage && workspace.suggestions.length ? <CommitmentSuggestions suggestions={workspace.suggestions} locale={locale} onSave={save} onReload={reload} /> : null}
      <p className="border-t border-border-default pt-4 text-xs leading-relaxed text-ink-body">{t("commitments.impactNote", locale)}</p>
    </section>
  );
}
