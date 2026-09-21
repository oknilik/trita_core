"use client";
import { CandidateWorkshopIntro } from "@/components/candidate/CandidateWorkshopIntro";
import { CandidateJourneyOverview } from "@/components/candidate/CandidateJourneyOverview";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { AssessmentFocusHeader } from "@/components/layout/AssessmentFocusHeader";
import { AssessmentStatus } from "@/components/assessment/AssessmentFlowShell";
import { useAssessmentStepController } from "@/components/assessment/useAssessmentStepController";
import { TeamRoleQuestionnaire } from "@/components/assessment/TeamRoleQuestionnaire";
import { Button } from "@/components/ui/primitives/Button";
import { t, tf, type Locale } from "@/lib/i18n";
import type { Question } from "@/lib/questions/types";

type Draft = { answers: Record<string, number>; revision: number; acknowledged: boolean; submitted: boolean; teamRoleState: string };
export function CandidateClient({ token, position, organizationName, candidateName, testName, questions, locale, initial }: { token: string; position?: string; organizationName?: string; candidateName?: string; testName: string; questions: Question[]; locale: Locale; initial: Draft }) {
  const [answers, setAnswers] = useState(initial.answers);
  const [index, setIndex] = useState((() => { const unanswered = questions.findIndex(q => initial.answers[q.id] === undefined); return unanswered < 0 ? questions.length - 1 : unanswered; })());
  const [phase, setPhase] = useState(initial.submitted ? initial.teamRoleState === "PENDING" ? "role" : "done" : "intro");
  const [ack, setAck] = useState(initial.acknowledged);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [saving, setSaving] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null);
  const revision = useRef(initial.revision), currentAnswers = useRef(answers), lastSaved = useRef(JSON.stringify(initial.answers));
  const queue = useRef<Promise<void>>(Promise.resolve());
  const active = questions[index]; const activeRef = useRef(active.id); activeRef.current = active.id;
  const { cancelAutoAdvance, runStepTransition, scheduleAutoAdvance } = useAssessmentStepController({ getActiveQuestionId: () => activeRef.current });
  const save = useCallback((snapshot: Record<string, number>, acknowledge = false) => {
    setSaving(true);
    const request = queue.current.catch(() => {}).then(async () => {
      const res = await fetch(`/api/candidate/${token}/progress`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision: revision.current, answers: snapshot, acknowledge }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      revision.current = data.revision; lastSaved.current = JSON.stringify(snapshot); setError(null);
    });
    queue.current = request;
    return request.catch(e => { setError(e.message); throw e; }).finally(() => setSaving(false));
  }, [token]);
  useEffect(() => {
    if (busy || phase !== "assessment" || JSON.stringify(answers) === lastSaved.current || error === "DRAFT_CHANGED") return;
    const timer = setTimeout(() => { void save(answers).catch(() => {}); }, 450);
    return () => clearTimeout(timer);
  }, [answers, phase, save, error, busy]);
  useEffect(() => { if (!autoAdvance || phase !== "assessment") cancelAutoAdvance(); }, [autoAdvance, phase, cancelAutoAdvance]);
  function answer(value: number) {
    const next = { ...currentAnswers.current, [active.id]: value }; currentAnswers.current = next; setAnswers(next);
    if (autoAdvance && index < questions.length - 1) scheduleAutoAdvance(active.id, () => runStepTransition(() => setIndex(i => Math.min(i + 1, questions.length - 1))));
  }
  function step(delta: number) { runStepTransition(() => setIndex(i => Math.max(0, Math.min(questions.length - 1, i + delta)))); }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (phase !== "assessment" || busy || (event.target instanceof HTMLElement && event.target.closest("input,textarea,select,button,[role=slider]"))) return;
      if (/^[1-5]$/.test(event.key)) { event.preventDefault(); answer(Number(event.key)); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
      else if (event.key === "ArrowRight" && answers[active.id] !== undefined) { event.preventDefault(); step(1); }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  });
  const fail = error && <div role="alert" className="mx-auto my-4 max-w-xl px-4 text-caption text-ink-body">{t(error === "DRAFT_CHANGED" ? "candidateProgram.changed" : ["REVOKED", "EXPIRED", "INVALID_TOKEN", "PROGRAM_UNSUPPORTED"].includes(error) ? "candidateProgram.unavailable" : "candidateProgram.saveError", locale)} <Button variant="secondary" onClick={() => error === "DRAFT_CHANGED" ? window.location.reload() : void save(currentAnswers.current, ack).catch(() => {})}>{t(error === "DRAFT_CHANGED" ? "candidateProgram.reload" : "candidateProgram.retry", locale)}</Button></div>;
  async function start() { setBusy(true); try { await save(currentAnswers.current, ack); setPhase("assessment"); } catch {} finally { setBusy(false); } }
  async function pause() { cancelAutoAdvance(); setBusy(true); try { await save(currentAnswers.current); setPhase("paused"); } catch {} finally { setBusy(false); } }
  async function submit() {
    cancelAutoAdvance(); setBusy(true);
    try {
      try { await save(currentAnswers.current); } catch(e) { if ((e as Error).message !== "ALREADY_USED") throw e; }
      const res = await fetch(`/api/candidate/${token}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision: revision.current, answers: currentAnswers.current }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setPhase(data.teamRoleState === "PENDING" ? "role" : "done"); setError(null);
    } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function role(selections: Record<string, number> | null) { setBusy(true); try {
    const res = await fetch(`/api/candidate/${token}/team-role`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selections }) });
    const data = await res.json(); if (!res.ok) throw new Error(data.error); setPhase("done"); setError(null);
  } catch(e) { setError((e as Error).message); } finally { setBusy(false); } }
  if (phase === "intro") return <><AssessmentFocusHeader homeHref={`/apply/${token}`} /><CandidateWorkshopIntro overview={<CandidateJourneyOverview locale={locale} withRoles={initial.teamRoleState === "PENDING"} />} eyebrow={t("candidateProgram.title", locale)} title={candidateName ?? t("candidateProgram.title", locale)} campaignName={[organizationName, position].filter(Boolean).join(" · ")} body={t("candidateProgram.intro", locale)} notice={<><a href="/privacy" target="_blank" rel="noreferrer" className="underline">{t("candidateProgram.notice", locale)}</a><label className="mt-3 flex min-h-[44px] items-center gap-3"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} />{t("candidateProgram.acknowledge", locale)}</label></>} action={<Button disabled={!ack || busy} onClick={() => void start()}>{t(Object.keys(answers).length ? "candidateProgram.resume" : "candidateProgram.start", locale)}</Button>} meta={tf("assessment.progressLabel", locale, { done: Object.keys(answers).length, total: questions.length })} />{fail}</>;
  if (phase === "paused") return <AssessmentStatus tone="success" title={t("candidateProgram.saved", locale)} body={t("candidateProgram.paused", locale)} action={<Button onClick={() => setPhase("assessment")}>{t("candidateProgram.resume", locale)}</Button>} />;
  if (phase === "done") return <AssessmentStatus tone="success" title={t("candidateProgram.submitted", locale)} body={t("candidateProgram.next", locale)} />;
  if (phase === "role") return <div className="mx-auto max-w-2xl px-4 py-8"><h1 className="mb-6 font-fraunces text-title text-ink">{t("candidateProgram.optional", locale)}</h1><TeamRoleQuestionnaire locale={locale} submitting={busy} onComplete={v => void role(v)} onSkip={() => void role(null)} />{fail}</div>;
  const complete = questions.every(q => answers[q.id] !== undefined);
  return <div className="flex min-h-dvh flex-col bg-[var(--color-surface-canvas)]">
    <AssessmentFocusHeader homeHref={`/apply/${token}`} center={<div className="flex items-center gap-3"><span className="shrink-0 text-caption text-ink">{index + 1} / {questions.length}</span><div role="progressbar" aria-label={t("candidateProgram.title", locale)} aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={Object.keys(answers).length} className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-sand"><div className="h-full bg-action-primary-bg transition-all" style={{ width: `${Object.keys(answers).length / questions.length * 100}%` }} /></div></div>}><span role="status" className="text-note text-muted">{t(error ? "candidateProgram.saveError" : saving || JSON.stringify(answers) !== lastSaved.current ? "candidateProgram.saving" : "candidateProgram.saved", locale)}</span></AssessmentFocusHeader>
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 lg:py-12"><div className="w-full max-w-xl"><AnimatePresence mode="wait"><QuestionCard key={active.id} testName={testName} format="likert" question={active.text} value={answers[active.id] ?? null} onChange={value => { if (!busy) answer(value); }} /></AnimatePresence></div><p className="mt-6 text-xs italic text-muted">{t("assessment.helpLikert", locale)}</p><p className="mt-1 hidden text-xs text-muted md:block">{t("assessment.keyboardHint", locale)}</p>{fail}</div>
    <div className="mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] grid shrink-0 grid-cols-2 items-center gap-2 rounded-[20px] border border-[var(--color-border-default)] bg-[var(--color-surface-header)]/95 p-2 shadow-[0_10px_28px_rgba(26,26,46,0.10)] backdrop-blur-[14px] sm:grid-cols-[1fr_auto_1fr] md:mx-auto md:w-[calc(100%-1.5rem)] md:max-w-[1180px] md:px-3">
      <Button variant="secondary" disabled={index === 0 || busy} onClick={() => step(-1)}>{t("assessment.prevCta", locale)}</Button>
      <label className="col-span-2 row-start-2 flex min-h-[44px] items-center justify-center gap-2 text-note text-muted sm:col-span-1 sm:col-start-2 sm:row-start-1"><input type="checkbox" checked={autoAdvance} onChange={e => setAutoAdvance(e.target.checked)} />{t("assessment.autoAdvance", locale)}</label>
      <Button className="col-start-2 row-start-1 sm:col-start-3" disabled={busy || answers[active.id] === undefined || (index === questions.length - 1 && !complete) || error === "DRAFT_CHANGED"} onClick={() => index === questions.length - 1 ? void submit() : step(1)}>{t(index === questions.length - 1 ? "candidateProgram.submit" : "assessment.nextCta", locale)}</Button>
    </div><div className="pb-4 text-center"><button disabled={busy} onClick={() => void pause()} className="min-h-[44px] px-4 text-note text-muted underline">{t("candidateProgram.pause", locale)}</button></div>
  </div>;
}
