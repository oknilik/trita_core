import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { getTestConfig } from "@/lib/questions";
import { hasOrgRole } from "@/lib/auth";
import type { TestType } from "@prisma/client";
import type { ScoreResult } from "@/lib/scoring";
import { FadeIn } from "@/components/landing/FadeIn";
import { TeamHeatmap } from "@/components/manager/TeamHeatmap";
import { TeamInsights } from "@/components/manager/TeamInsights";
import { TeamInviteForm } from "@/components/manager/TeamInviteForm";
import { CandidateInviteForm } from "@/components/manager/CandidateInviteForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Team Dashboard | Trita", robots: { index: false } };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { userId }, { id: teamId }] = await Promise.all([
    getServerLocale(),
    auth(),
    params,
  ]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/dashboard");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true, ownerId: true, orgId: true, createdAt: true },
  });
  if (!team) notFound();

  // Access: any org member of the team's org
  const orgMembership = team.orgId
    ? await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
        select: { role: true },
      })
    : null;
  const isOrgMember = !!orgMembership;
  // ORG_MANAGER and above can manage team members; ORG_MEMBER can only view
  const isOrgManager = isOrgMember && hasOrgRole(orgMembership!.role, "ORG_MANAGER");
  if (!isOrgMember) redirect("/dashboard");

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    orderBy: { joinedAt: "asc" },
    select: {
      id: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          assessmentResults: {
            where: { isSelfAssessment: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { testType: true, scores: true },
          },
        },
      },
    },
  });

  const [pendingInvites, candidateInvites] = await Promise.all([
    prisma.teamPendingInvite.findMany({
      where: { teamId },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, createdAt: true },
    }),
    // Only load candidates if user can manage the team
    (isOrgManager)
      ? prisma.candidateInvite.findMany({
          where: { teamId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            status: true,
            expiresAt: true,
            createdAt: true,
            result: { select: { id: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const isHu = locale !== "en";
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  // Build heatmap data — use first member's test type for dimension config
  // (all HEXACO variants share the same dim codes)
  const firstWithAssessment = members.find((m) => m.user.assessmentResults[0]);
  const testType = firstWithAssessment?.user.assessmentResults[0]?.testType as TestType | undefined;
  const config = testType ? getTestConfig(testType, locale) : null;
  const dims = config?.dimensions.filter((d) => d.code !== "I") ?? [];

  type HeatmapRow = {
    memberId: string;
    displayName: string;
    scores: Record<string, number | null>;
    testType: string | null;
  };

  const heatmapRows: HeatmapRow[] = members.map((m) => {
    const assessment = m.user.assessmentResults[0];
    const rawScores = assessment
      ? ((assessment.scores as ScoreResult).dimensions)
      : null;
    const scores: Record<string, number | null> = {};
    for (const dim of dims) {
      scores[dim.code] = rawScores?.[dim.code] ?? null;
    }
    return {
      memberId: m.id,
      displayName: m.user.username ?? m.user.email ?? m.user.id,
      scores,
      testType: assessment?.testType ?? null,
    };
  });

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 md:gap-12 px-4 py-10">

        {/* Header */}
        <FadeIn>
          <div>
            <Link
              href={isOrgMember && team.orgId ? `/org/${team.orgId}` : "/team"}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-6"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
              {isOrgMember && team.orgId
                ? isHu ? "Vissza a szervezethez" : "Back to organization"
                : isHu ? "Vissza a csapatokhoz" : "Back to teams"}
            </Link>

            <section className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-100/80 via-purple-50/60 to-pink-50/40 p-8 shadow-md shadow-indigo-200/40">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" aria-hidden="true" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  {isHu ? "Csapat" : "Team"}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent md:text-3xl">
                    {team.name}
                  </h1>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {isHu ? "Létrehozva: " : "Created "}{team.createdAt.toLocaleDateString(dateLocale)}
                  {" · "}{members.length} {isHu ? "tag" : members.length === 1 ? "member" : "members"}
                  {pendingInvites.length > 0 && ` · ${pendingInvites.length} ${isHu ? "függőben" : "pending"}`}
                </p>
              </div>
            </section>
          </div>
        </FadeIn>

        {/* Team heatmap */}
        {dims.length > 0 && heatmapRows.length > 0 ? (
          <FadeIn delay={0.05}>
            <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8 overflow-x-auto">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {isHu ? "Csapat személyiségprofil" : "Team Personality Heatmap"}
                </h2>
              </div>
              <p className="mb-6 text-sm text-gray-500">
                {isHu
                  ? "Minden oszlop egy HEXACO személyiségdimenziót mutat — minél mélyebb a szín, annál magasabb a pontszám. A dimenziók leírása a táblázat alatt található."
                  : "Each column represents a HEXACO personality dimension — deeper color means a higher score. Dimension descriptions are shown below the table."}
              </p>
              <TeamHeatmap rows={heatmapRows} dims={dims.map((d) => ({ code: d.code, label: d.labelByLocale?.[locale as "hu" | "en"] ?? d.label, color: d.color }))} isHu={isHu} />
            </section>
          </FadeIn>
        ) : (
          <FadeIn delay={0.05}>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-10 text-center">
              <p className="text-sm text-gray-400">
                {members.length === 0
                  ? isHu ? "Még nincs csapattag. Hívj meg valakit lentebb!" : "No team members yet. Invite someone below!"
                  : isHu ? "Még egyik csapattag sem töltötte ki az assessmentet." : "No team members have completed an assessment yet."}
              </p>
            </div>
          </FadeIn>
        )}

        {/* Team insights */}
        {heatmapRows.some((r) => dims.some((d) => r.scores[d.code] !== null)) && (
          <FadeIn delay={0.08}>
            <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {isHu ? "Csapatelemzés" : "Team Analysis"}
                </h2>
              </div>
              <TeamInsights
                rows={heatmapRows}
                dims={dims.map((d) => ({ code: d.code, label: d.labelByLocale?.[locale as "hu" | "en"] ?? d.label, color: d.color }))}
                isHu={isHu}
              />
            </section>
          </FadeIn>
        )}

        {/* Member list */}
        <FadeIn delay={0.1}>
          <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isHu ? "Tagok" : "Members"}{" "}
                <span className="text-sm font-normal text-gray-400">({members.length})</span>
              </h2>
            </div>

            {(members.length > 0 || pendingInvites.length > 0) && (
              <div className="mb-6 flex flex-col divide-y divide-gray-100">
                {members.map((m) => {
                  const assessment = m.user.assessmentResults[0];
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {m.user.username ?? m.user.email ?? "—"}
                        </p>
                        {m.user.username && (
                          <p className="truncate text-xs text-gray-400">{m.user.email}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {assessment ? (
                          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                            {assessment.testType}
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-400">
                            {isHu ? "Nincs teszt" : "No test"}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {m.joinedAt.toLocaleDateString(dateLocale)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-3 py-3 opacity-60">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-700">{inv.email}</p>
                      <p className="text-xs text-gray-400">{isHu ? "Meghívó elküldve" : "Invite sent"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                      {isHu ? "Függőben" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(isOrgManager) && (
              <div className="border-t border-gray-100 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  {isHu ? "Tag hozzáadása" : "Add a member"}
                </h3>
                <p className="mb-4 text-xs text-gray-500">
                  {isHu
                    ? "Add meg a csapattag emailcímét. A felhasználónak regisztrálva kell lennie."
                    : "Enter the member's email. They must already be registered on Trita."}
                </p>
                <TeamInviteForm teamId={teamId} locale={locale} />
              </div>
            )}
          </section>
        </FadeIn>

        {/* Candidates */}
        {(isOrgManager) && (
          <FadeIn delay={0.15}>
            <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {isHu ? "Jelöltek" : "Candidates"}{" "}
                  <span className="text-sm font-normal text-gray-400">({candidateInvites.length})</span>
                </h2>
              </div>

              {candidateInvites.length > 0 && (
                <div className="mb-6 flex flex-col divide-y divide-gray-100">
                  {candidateInvites.map((c) => {
                    const isExpired = c.status !== "COMPLETED" && c.expiresAt < new Date();
                    const displayStatus = isExpired ? "EXPIRED" : c.status;
                    const statusClass =
                      displayStatus === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                      displayStatus === "EXPIRED" ? "bg-gray-100 text-gray-500" :
                      "bg-amber-50 text-amber-700";
                    const statusText =
                      displayStatus === "COMPLETED" ? (isHu ? "Kész" : "Completed") :
                      displayStatus === "EXPIRED" ? (isHu ? "Lejárt" : "Expired") :
                      (isHu ? "Függőben" : "Pending");
                    return (
                      <div key={c.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {c.name ?? c.email ?? (isHu ? "Névtelen jelölt" : "Anonymous candidate")}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            {c.position && <span className="text-xs text-gray-500">{c.position}</span>}
                            <span className="text-xs text-gray-400">{c.createdAt.toLocaleDateString(dateLocale)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>
                            {statusText}
                          </span>
                          {c.status === "COMPLETED" && c.result && (
                            <a
                              href={`/manager/candidates/${c.id}`}
                              className="min-h-[36px] inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                            >
                              {isHu ? "Eredmény" : "Results"}
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={candidateInvites.length > 0 ? "border-t border-gray-100 pt-5" : ""}>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  {isHu ? "Jelölt meghívása" : "Invite a candidate"}
                </h3>
                <p className="mb-4 text-xs text-gray-500">
                  {isHu
                    ? "Értékelési linket kap a jelölt. Regisztráció nélkül kitölthető."
                    : "The candidate receives an assessment link. No registration required."}
                </p>
                <CandidateInviteForm locale={locale} teams={[{ id: teamId, name: team.name }]} preselectedTeamId={teamId} />
              </div>
            </section>
          </FadeIn>
        )}

      </main>
    </div>
  );
}
