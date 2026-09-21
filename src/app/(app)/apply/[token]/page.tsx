import { LocaleProvider } from "@/components/LocaleProvider";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { loadCandidate, CandidateProgramError } from "@/lib/candidate-programs/service.server";
import { candidateQuestions } from "@/lib/candidate-programs/core";
import { AssessmentStatus } from "@/components/assessment/AssessmentFlowShell";
import { CandidateClient } from "./CandidateClient";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { return { title: "Jelölti profil | trita", robots: { index: false, follow: false, nocache: true } }; }
export default async function ApplyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const locale = await getServerLocale();
  const loaded = await loadCandidate(token).catch(e => { if (!(e instanceof CandidateProgramError)) throw e; return null; });
  if (!loaded) return <AssessmentStatus tone="empty" title={t("candidateProgram.title", locale)} body={t("candidateProgram.unavailable", locale)} />;
  const { invite, program } = loaded;
  const org = await prisma.organization.findUnique({ where: { id: invite.orgId! }, select: { name: true } });
  return <LocaleProvider initialLocale={locale}><CandidateClient organizationName={org?.name} candidateName={invite.name ?? undefined} token={token} locale={locale} position={invite.position ?? undefined} testName="TSFI" questions={candidateQuestions(program, locale)} initial={{ answers: invite.draftAnswers as Record<string, number> ?? {}, revision: invite.draftRevision, acknowledged: Boolean(invite.acknowledgedAt), submitted: invite.status === "COMPLETED", teamRoleState: invite.teamRoleState }} /></LocaleProvider>;
}
