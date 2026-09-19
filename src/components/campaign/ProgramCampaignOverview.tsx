import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { t, tf } from "@/lib/i18n";
import { AddParticipantButton } from "@/components/org/AddParticipantButton";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  safeParseProgram,
  participantActivities,
  completionMap,
  PROGRAM_LABELS,
} from "@/lib/programs/core";
import {
  CAMPAIGN_STEP_LABELS,
  type CampaignStepType,
} from "@/lib/campaign-steps-core";
import { CampaignStatusButton } from "@/components/org/CampaignStatusButton";
import { ProgramRoster } from "./ProgramRoster";
export async function ProgramCampaignOverview({
  orgId,
  campaignId,
  locale,
  canManage,
}: {
  orgId: string;
  campaignId: string;
  locale: "hu" | "en";
  canManage: boolean;
}) {
  const c = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId, orgId },
    include: {
      participants: {
        include: { user: { select: { username: true, email: true } } },
      },
      observerInvitations: { select: { status: true } },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, reviewedRevision: true, revision: true },
      },
    },
  });
  const rosterCandidates =
    canManage && c.status === "DRAFT" && c.teamId
      ? await prisma.teamMember.findMany({
          where: {
            teamId: c.teamId,
            userId: { notIn: c.participants.map((p) => p.userId) },
          },
          select: {
            userId: true,
            user: { select: { username: true, email: true } },
          },
        })
      : [];
  const p = safeParseProgram(c.programSnapshot);
  const hu = locale === "hu";
  if (!p) return <p role="alert">{t("programUi.unsupported", locale)}</p>;
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <Link href={`/org/${orgId}?tab=campaigns`}>
        {t("programUi.programs", locale)}
      </Link>
      <h1 className="font-fraunces text-title">{c.name}</h1>
      <SectionEyebrow>
        {PROGRAM_LABELS[p.key][locale]} · v{p.version} · {c.status}
      </SectionEyebrow>
      {c.baselineCampaignId && (
        <Link href={`/org/${orgId}/campaigns/${c.baselineCampaignId}`}>
          {t("programUi.openBaseline", locale)}
        </Link>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {participantActivities(p).map((a) => (
          <DashboardPanel key={a.key} className="p-4">
            <strong>
              {a.key === "OBSERVER_360"
                ? t("programUi.observersCollected", locale)
                : CAMPAIGN_STEP_LABELS[a.key as CampaignStepType][locale]}
            </strong>
            {!a.required && (
              <span className="ml-2 text-caption text-muted">
                {t("programTrust.optional", locale)}
              </span>
            )}
            <p>
              {
                c.participants.filter(
                  (x) => completionMap(x.stepCompletions)[a.key],
                ).length
              }{" "}
              / {c.participants.length}
            </p>
          </DashboardPanel>
        ))}
      </div>
      {p.key === "TEAM_SCAN" && (
        <p>
          {t("programUi.observerCounts", locale)}:{" "}
          {
            c.observerInvitations.filter((i) =>
              ["PENDING", "COMPLETED"].includes(i.status),
            ).length
          }{" "}
          /{" "}
          {c.observerInvitations.filter((i) => i.status === "COMPLETED").length}
          .{" "}
          {tf("programReview.observerRequirement", locale, {
            count: p.policy.observerResponsesPerParticipant,
          })}
        </p>
      )}
      <p>
        {t("programUi.reportStatus", locale)}:{" "}
        {c.reports[0]?.status === "PUBLISHED"
          ? t("programUi.published", locale)
          : c.reports[0]?.reviewedRevision === c.reports[0]?.revision &&
              c.reports.length
            ? t("programUi.reviewed", locale)
            : c.reports.length
              ? t("programUi.draftAwaitingReview", locale)
              : t("programUi.reviewChecksData", locale)}
      </p>
      <ProgramRoster
        orgId={orgId}
        campaignId={campaignId}
        editable={canManage && c.status === "DRAFT"}
        locale={locale}
        participants={c.participants.map((x) => ({
          id: x.userId,
          name: x.user.username ?? x.user.email ?? "–",
        }))}
      />
      {rosterCandidates.length > 0 && (
        <AddParticipantButton
          orgId={orgId}
          campaignId={campaignId}
          isHu={hu}
          members={rosterCandidates.map((m) => ({
            userId: m.userId,
            ...m.user,
          }))}
        />
      )}
      {canManage && c.status === "ACTIVE" && (
        <p className="text-caption text-muted">
          {t("programReview.closeHelp", locale)}
        </p>
      )}
      {canManage && c.status !== "CLOSED" && (
        <CampaignStatusButton
          orgId={orgId}
          campaignId={campaignId}
          nextStatus={c.status === "DRAFT" ? "ACTIVE" : "CLOSED"}
          label={
            c.status === "DRAFT"
              ? t("programUi.activate", locale)
              : t("programUi.close", locale)
          }
          confirmMessage={
            c.status === "ACTIVE"
              ? t("programReview.closeHelp", locale)
              : undefined
          }
          isDanger={c.status === "ACTIVE"}
          locale={locale}
          disabled={
            c.status === "DRAFT"
              ? c.participants.length < p.policy.minRespondents
              : false
          }
        />
      )}
      {c.teamId && c.status === "CLOSED" && (
        <Link
          className="block min-h-[44px] p-3"
          href={`/team/${c.teamId}?tab=report&campaignId=${c.id}`}
        >
          {t("programUi.generateReport", locale)}
        </Link>
      )}
    </main>
  );
}
