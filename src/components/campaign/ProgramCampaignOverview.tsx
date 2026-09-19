import { t } from "@/lib/i18n";
import { AddParticipantButton } from "@/components/org/AddParticipantButton";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safeParseProgram, participantActivities, completionMap, PROGRAM_LABELS } from "@/lib/programs/core";
import { CAMPAIGN_STEP_LABELS, type CampaignStepType } from "@/lib/campaign-steps-core";
import { CampaignStatusButton } from "@/components/org/CampaignStatusButton";
import { buildTeamReportAggregates } from "@/lib/team-report";
import { programDataError } from "@/lib/programs/report";
import { ProgramRoster } from "./ProgramRoster";
export async function ProgramCampaignOverview({ orgId, campaignId, locale, canManage }: { orgId: string; campaignId: string; locale: "hu" | "en"; canManage: boolean }) {
  const c = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId, orgId }, include: { participants: { include: { user: { select: { username: true, email: true } } } }, observerInvitations: { select: { status: true } }, reports: { select: { status: true, reviewedRevision: true, revision: true } } } });
  const rosterCandidates = canManage && c.status === "DRAFT" && c.teamId ? await prisma.teamMember.findMany({ where: { teamId: c.teamId, userId: { notIn: c.participants.map(p => p.userId) } }, select: { userId: true, user: { select: { username: true, email: true } } } }) : [];
  const p = safeParseProgram(c.programSnapshot); const hu = locale === "hu";
  if (!p) return <p role="alert">{hu ? "Nem támogatott programverzió." : "Unsupported program version."}</p>;
  const agg = c.status !== "DRAFT" && c.teamId ? await buildTeamReportAggregates(c.teamId, { assessmentCampaignId: c.id }) : null;
  const ready = Boolean(agg && !programDataError(agg));
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
    <Link href={`/org/${orgId}?tab=campaigns`}>{hu ? "Mérési programok" : "Measurement programs"}</Link>
    <h1 className="font-fraunces text-3xl">{c.name}</h1><p>{PROGRAM_LABELS[p.key][locale]} · v{p.version} · {c.status}</p>
    {c.baselineCampaignId && <Link href={`/org/${orgId}/campaigns/${c.baselineCampaignId}`}>{hu ? "Kiinduló mérés megnyitása" : "Open baseline measurement"}</Link>}
    <div className="grid gap-3 sm:grid-cols-2">{participantActivities(p).map(a => <div key={a.key} className="rounded-xl border border-sand p-4"><strong>{a.key === "OBSERVER_360" ? (hu ? "Observer válaszok összegyűltek" : "Observer responses collected") : CAMPAIGN_STEP_LABELS[a.key as CampaignStepType][locale]}</strong>{!a.required && <span className="ml-2 text-caption text-muted">{t("programTrust.optional", locale)}</span>}<p>{c.participants.filter(x => completionMap(x.stepCompletions)[a.key]).length} / {c.participants.length}</p></div>)}</div>
    {p.key === "TEAM_SCAN" && <p>{hu ? "Observer meghívók / válaszok" : "Observer invitations / responses"}: {c.observerInvitations.filter(i => ["PENDING", "COMPLETED"].includes(i.status)).length} / {c.observerInvitations.filter(i => i.status === "COMPLETED").length}. {hu ? `Résztvevőnként ${p.policy.observerResponsesPerParticipant} válasz szükséges. A várakozás nem zárja le a többi kérdőívet.` : `${p.policy.observerResponsesPerParticipant} responses per participant are required. Waiting does not block other questionnaires.`}</p>}
    <p>{hu ? "Riport állapota" : "Report status"}: {c.reports[0]?.status === "PUBLISHED" ? (hu ? "Publikálva" : "Published") : c.reports[0]?.reviewedRevision === c.reports[0]?.revision && c.reports.length ? (hu ? "Jóváhagyva" : "Reviewed") : c.reports.length ? (hu ? "Vázlat, jóváhagyásra vár" : "Draft, awaiting review") : ready ? (hu ? "Az adatok rendelkezésre állnak" : "Data ready") : (hu ? "Még nincs elegendő mérési adat" : "Waiting for sufficient measurement data")}</p>
    <ProgramRoster orgId={orgId} campaignId={campaignId} editable={canManage && c.status === "DRAFT"} locale={locale} participants={c.participants.map(x => ({ id: x.userId, name: x.user.username ?? x.user.email ?? "–" }))} />
    {rosterCandidates.length > 0 && <AddParticipantButton orgId={orgId} campaignId={campaignId} isHu={hu} members={rosterCandidates.map(m => ({ userId: m.userId, ...m.user }))} />}
    {canManage && c.status !== "CLOSED" && <CampaignStatusButton orgId={orgId} campaignId={campaignId} nextStatus={c.status === "DRAFT" ? "ACTIVE" : "CLOSED"} label={c.status === "DRAFT" ? (hu ? "Program aktiválása" : "Activate program") : (hu ? "Mérés lezárása" : "Close measurement")} isDanger={c.status === "ACTIVE"} locale={locale} disabled={c.status === "DRAFT" ? c.participants.length < 3 : !ready} />}
    {c.teamId && c.status === "CLOSED" && <Link className="block min-h-[44px] p-3" href={`/team/${c.teamId}?tab=report&campaignId=${c.id}`}>{hu ? "Riport készítése és jóváhagyása" : "Generate and review report"}</Link>}
  </main>;
}
