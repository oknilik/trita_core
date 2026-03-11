import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";
import type { ScoreResult } from "@/lib/scoring";
import { FadeIn } from "@/components/landing/FadeIn";
import { CandidateTeamPicker } from "@/components/manager/CandidateTeamPicker";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Candidate Results | Trita", robots: { index: false } };
}

const DIM_COLORS: Record<string, string> = {
  H: "#6366f1", E: "#a855f7", X: "#3b82f6",
  A: "#22c55e", C: "#f97316", O: "#ec4899",
  N: "#f43f5e",
};

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { userId }, { id }] = await Promise.all([
    getServerLocale(),
    auth(),
    params,
  ]);
  if (!userId) redirect("/sign-in");

  const manager = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!manager || manager.role !== "MANAGER") redirect("/dashboard");

  const invite = await prisma.candidateInvite.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      status: true,
      testType: true,
      createdAt: true,
      completedAt: true,
      managerId: true,
      teamId: true,
      team: { select: { id: true, name: true } },
      result: {
        select: { id: true, scores: true, testType: true, createdAt: true },
      },
    },
  });

  if (!invite || invite.managerId !== manager.id) notFound();

  const managerTeams = await prisma.team.findMany({
    where: { ownerId: manager.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const isHu = locale !== "en" && locale !== "de";
  const dateLocale = locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "hu-HU";

  const testType = invite.testType as TestType;
  const config = getTestConfig(testType, locale);
  const dims = config.dimensions.filter((d) => d.code !== "I");

  // Extract candidate scores
  const candidateScores = invite.result
    ? ((invite.result.scores as ScoreResult).dimensions)
    : null;

  // Load team member scores for fit comparison if teamId present and candidate is completed
  let teamAvg: Record<string, number> | null = null;
  let teamHasNoAssessments = false;

  if (invite.teamId && candidateScores) {
    const members = await prisma.teamMember.findMany({
      where: { teamId: invite.teamId },
      select: {
        user: {
          select: {
            assessmentResults: {
              where: { isSelfAssessment: true, testType: invite.testType },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { scores: true, testType: true },
            },
          },
        },
      },
    });

    const memberScores = members
      .map((m) => m.user.assessmentResults[0])
      .filter(Boolean)
      .map((a) => (a?.scores as ScoreResult | undefined)?.dimensions)
      .filter((s): s is Record<string, number> => !!s);

    if (memberScores.length > 0) {
      teamAvg = {};
      for (const dim of dims) {
        const vals = memberScores.map((s) => s[dim.code]).filter((v): v is number => v !== undefined);
        if (vals.length > 0) {
          teamAvg[dim.code] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        }
      }
    } else {
      // Team is assigned but no members have completed an assessment yet
      teamHasNoAssessments = true;
    }
  }

  // Fit score: 100 - mean(|candidateScore - teamAvg|) across shared dims
  const fitScore =
    candidateScores && teamAvg
      ? (() => {
          const sharedDims = dims.filter(
            (d) => candidateScores[d.code] !== undefined && teamAvg![d.code] !== undefined,
          );
          if (sharedDims.length === 0) return null;
          const meanDelta =
            sharedDims.reduce(
              (sum, d) => sum + Math.abs(candidateScores[d.code]! - teamAvg![d.code]!),
              0,
            ) / sharedDims.length;
          return Math.round(100 - meanDelta);
        })()
      : null;

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">

        {/* Back link */}
        <FadeIn>
          <Link
            href="/manager/candidates"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {isHu ? "Vissza a jelöltekhez" : "Back to candidates"}
          </Link>
        </FadeIn>

        {/* Header card */}
        <FadeIn>
          <section className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-100/80 via-purple-50/60 to-pink-50/40 p-8 shadow-md shadow-indigo-200/40">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" aria-hidden="true" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                {isHu ? "Jelölt" : "Candidate"}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                  {invite.name ?? invite.email ?? (isHu ? "Névtelen jelölt" : "Anonymous candidate")}
                </h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                {invite.position && (
                  <span className="rounded-full bg-white/60 px-3 py-0.5 text-xs font-semibold text-gray-700">
                    {invite.position}
                  </span>
                )}
                {invite.team && (
                  <span className="rounded-full bg-white/60 px-3 py-0.5 text-xs font-semibold text-gray-700">
                    {invite.team.name}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                    invite.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {invite.status === "COMPLETED"
                    ? (isHu ? "Kész" : "Completed")
                    : (isHu ? "Függőben" : "Pending")}
                </span>
              </div>
              {invite.completedAt && (
                <p className="mt-1 text-xs text-gray-400">
                  {isHu ? "Kitöltve: " : "Completed "}{invite.completedAt.toLocaleDateString(dateLocale)}
                </p>
              )}
            </div>
          </section>
        </FadeIn>

        {/* Team assignment */}
        {managerTeams.length > 0 && (
          <FadeIn delay={0.04}>
            <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {isHu ? "Csapathoz rendelés" : "Assign to team"}
                </h2>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                {isHu
                  ? "Rendelj csapatot a jelölthöz az illeszkedési pontszám megtekintéséhez."
                  : "Assign a team to see how the candidate fits with the team profile."}
              </p>
              <CandidateTeamPicker
                candidateId={invite.id}
                currentTeamId={invite.teamId}
                teams={managerTeams}
                isHu={isHu}
              />
            </section>
          </FadeIn>
        )}

        {/* Dimension scores */}
        {candidateScores ? (
          <FadeIn delay={0.05}>
            <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {isHu ? "Személyiségprofil" : "Personality Profile"}
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {dims.map((dim) => {
                  const score = candidateScores[dim.code] ?? 0;
                  const teamScore = teamAvg?.[dim.code];
                  const color = DIM_COLORS[dim.code] ?? "#6366f1";
                  return (
                    <div key={dim.code} className="flex items-center gap-3">
                      <span
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {dim.code}
                      </span>
                      <div className="flex-1">
                        <div className="relative h-7 overflow-hidden rounded-lg bg-gray-100">
                          {/* Candidate bar */}
                          <div
                            className="absolute inset-y-0 left-0 rounded-lg transition-all"
                            style={{ width: `${score}%`, backgroundColor: color, opacity: 0.75 }}
                          />
                          {/* Team avg marker */}
                          {teamScore !== undefined && (
                            <div
                              className="absolute inset-y-1 w-0.5 rounded-full bg-gray-700/60"
                              style={{ left: `${teamScore}%` }}
                              title={isHu ? `Csapatátlag: ${teamScore}%` : `Team avg: ${teamScore}%`}
                            />
                          )}
                          <div className="absolute inset-0 flex items-center px-2.5">
                            <span className="text-xs font-semibold text-gray-600">{dim.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-20 shrink-0 text-right">
                        <span className="text-sm font-bold tabular-nums text-gray-800">
                          {score}
                          <span className="text-xs font-semibold text-gray-400">%</span>
                        </span>
                        {teamScore !== undefined && (
                          <p className="text-[10px] text-gray-400">
                            {isHu ? "csapat: " : "team: "}{teamScore}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {teamAvg && (
                <p className="mt-3 text-xs text-gray-400">
                  {isHu
                    ? "A szürke függőleges vonal a csapatátlagot jelöli."
                    : "The grey vertical line marks the team average."}
                </p>
              )}
            </section>
          </FadeIn>
        ) : (
          <FadeIn delay={0.05}>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-10 text-center">
              <p className="text-sm text-gray-400">
                {isHu
                  ? "A jelölt még nem töltötte ki a felmérést."
                  : "The candidate has not completed the assessment yet."}
              </p>
            </div>
          </FadeIn>
        )}

        {/* Team fit score — empty team notice */}
        {teamHasNoAssessments && invite.team && (
          <FadeIn delay={0.08}>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-6 flex items-start gap-4">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {isHu ? `Nincs illeszkedési pontszám – ${invite.team.name}` : `No fit score – ${invite.team.name}`}
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  {isHu
                    ? "A csapat még üres, vagy egyik tagja sem töltötte ki az assessmentet. Amint legalább egy tag elvégzi a felmérést, az illeszkedési pontszám automatikusan megjelenik."
                    : "The team is empty or no member has completed an assessment yet. Once at least one member finishes their assessment, the fit score will appear automatically."}
                </p>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Team fit score */}
        {fitScore !== null && invite.team && (
          <FadeIn delay={0.08}>
            <section className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-6 md:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {isHu ? "Csapat-kompatibilitás" : "Team Fit"}
                </h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <span className="text-2xl font-bold text-indigo-600">{fitScore}</span>
                  <span className="text-sm font-semibold text-indigo-400">%</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {isHu
                      ? `Illeszkedési pontszám – ${invite.team.name}`
                      : `Fit score – ${invite.team.name}`}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {isHu
                      ? "A pontszám a jelölt profilja és a csapatátlag közötti eltérés alapján számítódik. 100% = tökéletes egyezés."
                      : "Calculated from the average deviation between the candidate profile and the team average. 100% = perfect match."}
                  </p>
                </div>
              </div>
            </section>
          </FadeIn>
        )}

      </main>
    </div>
  );
}
