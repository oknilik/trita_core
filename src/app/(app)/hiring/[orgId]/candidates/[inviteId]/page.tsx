import { notFound } from "next/navigation";
import { getServerAuth } from "@/lib/auth-server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import {
  requireCandidateConsultant,
  CandidateProgramError,
} from "@/lib/candidate-programs/service.server";
import { readCandidateProgram } from "@/lib/candidate-programs/core";
import { extractDimensionScores } from "@/lib/scoring";
import { CandidateProfileChart } from "@/components/candidate/CandidateProfileChart";
import { CandidateReportEditor } from "@/components/candidate/CandidateReportEditor";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { t } from "@/lib/i18n";
import {
  calculateTeamRoleScores,
  getTopRoles,
  TEAM_ROLES,
} from "@/lib/team-role-scoring";
import type { TeamRoleSelections } from "@/lib/team-role-questions";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jelölti profil | trita",
  robots: { index: false, follow: false },
};
export default async function CandidateResultPage({
  params,
}: {
  params: Promise<{ orgId: string; inviteId: string }>;
}) {
  const { orgId, inviteId } = await params;
  const { userId } = await getServerAuth();
  const locale = await getServerLocale();
  try {
    await requireCandidateConsultant(userId, orgId);
  } catch (e) {
    if (e instanceof CandidateProgramError) notFound();
    throw e;
  }
  const invite = await prisma.candidateInvite.findFirst({
    where: { id: inviteId, orgId },
    include: { result: true, report: true },
  });
  if (!invite) notFound();
  const p = readCandidateProgram(invite.programSnapshot);
  if (!p) notFound();
  const dimensions = extractDimensionScores(invite.result?.scores) ?? {};
  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-6xl space-y-6 px-4 py-8"
    >
      <Link className="text-caption text-sage" href={`/hiring/${orgId}`}>
        {t("candidateProgram.title", locale)}
      </Link>
      <h1 className="font-fraunces text-title text-ink">{invite.name}</h1>
      <p className="text-caption text-muted">
        {invite.position} ·{" "}
        {invite.completedAt?.toLocaleDateString(
          locale === "hu" ? "hu-HU" : "en-GB",
        )}
      </p>
      {invite.result ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <CandidateProfileChart
              dimensions={dimensions}
              baseline={p.baseline?.dimensions}
              locale={locale}
            />
            {p.baseline && (
              <p className="text-caption text-muted">
                {t("candidateProgram.baseline", locale)} ·{" "}
                {p.baseline.publishedAt.slice(0, 10)} · n={p.baseline.count} · v
                {p.baseline.revision}
              </p>
            )}
            {p.focus && (
              <section className="rounded-xl border border-sand bg-surface-card p-5">
                <h2 className="font-fraunces text-heading text-ink">
                  {t("candidateProgram.focus", locale)}
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-ink-body">
                  {p.focus}
                </p>
              </section>
            )}
            {p.includeTeamRole && (
              <section className="rounded-xl border border-sand bg-surface-card p-5">
                <h2 className="font-fraunces text-heading text-ink">
                  {t("candidateProgram.optional", locale)}
                </h2>
                <p className="mt-2 text-caption text-muted">
                  {invite.teamRoleState}
                </p>
                {invite.result.teamRoleSelections &&
                  getTopRoles(
                    calculateTeamRoleScores(
                      invite.result.teamRoleSelections as TeamRoleSelections,
                    ),
                  ).map((role) => (
                    <p key={role.role} className="mt-2 text-caption text-ink">
                      {TEAM_ROLES[role.role][locale]}
                    </p>
                  ))}
              </section>
            )}
          </div>
          {invite.report && (
            <CandidateReportEditor
              inviteId={invite.id}
              initial={invite.report}
              locale={locale}
              rolePending={invite.teamRoleState === "PENDING"}
            />
          )}
        </div>
      ) : (
        <p>{t("candidateProgram.reportPending", locale)}</p>
      )}
    </PlatformPageShell>
  );
}
