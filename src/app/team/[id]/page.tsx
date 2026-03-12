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
import { TeamHeatmap } from "@/components/manager/TeamHeatmap";
import { TeamInsights } from "@/components/manager/TeamInsights";
import { TeamInviteForm } from "@/components/manager/TeamInviteForm";
import { CandidateInviteForm } from "@/components/manager/CandidateInviteForm";
import { CandidateRevokeButton } from "@/components/manager/CandidateRevokeButton";
import { PendingInviteCancelButton } from "@/components/manager/PendingInviteCancelButton";
import { TeamMemberRemoveButton } from "@/components/manager/TeamMemberRemoveButton";

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
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">

        {/* Header */}
        <div>
          <Link
            href={isOrgMember && team.orgId ? `/org/${team.orgId}` : "/team"}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#c8410a] hover:text-[#a8340a] mb-6"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {isOrgMember && team.orgId
              ? isHu ? "Vissza a szervezethez" : "Back to organization"
              : isHu ? "Vissza a csapatokhoz" : "Back to teams"}
          </Link>

          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
            {isHu ? "// csapat" : "// team"}
          </p>
          <h1 className="font-playfair text-3xl text-[#1a1814] mt-1 md:text-4xl">
            {team.name}
          </h1>
          <p className="mt-2 text-sm text-[#3d3a35]/70">
            {isHu ? "Létrehozva: " : "Created "}{team.createdAt.toLocaleDateString(dateLocale)}
            {" · "}{members.length} {isHu ? "tag" : members.length === 1 ? "member" : "members"}
            {pendingInvites.length > 0 && ` · ${pendingInvites.length} ${isHu ? "függőben" : "pending"}`}
          </p>
        </div>

        {/* Team heatmap */}
        {dims.length > 0 && heatmapRows.length > 0 ? (
          <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8 overflow-x-auto">
            <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
              {isHu ? "// személyiségprofil" : "// personality profile"}
            </p>
            <h2 className="font-playfair text-xl text-[#1a1814] mb-1">
              {isHu ? "Csapat személyiségprofil" : "Team Personality Heatmap"}
            </h2>
            <p className="mb-6 text-sm text-[#3d3a35]/70">
              {isHu
                ? "Minden oszlop egy HEXACO személyiségdimenziót mutat — minél mélyebb a szín, annál magasabb a pontszám. A dimenziók leírása a táblázat alatt található."
                : "Each column represents a HEXACO personality dimension — deeper color means a higher score. Dimension descriptions are shown below the table."}
            </p>
            <TeamHeatmap rows={heatmapRows} dims={dims.map((d) => ({ code: d.code, label: d.labelByLocale?.[locale as "hu" | "en"] ?? d.label, color: d.color }))} isHu={isHu} />
          </section>
        ) : (
          <div className="rounded-2xl border border-[#e8e4dc] bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-[#3d3a35]/50">
              {members.length === 0
                ? isHu ? "Még nincs csapattag. Hívj meg valakit lentebb!" : "No team members yet. Invite someone below!"
                : isHu ? "Még egyik csapattag sem töltötte ki az assessmentet." : "No team members have completed an assessment yet."}
            </p>
          </div>
        )}

        {/* Team insights */}
        {heatmapRows.some((r) => dims.some((d) => r.scores[d.code] !== null)) && (
          <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
              {isHu ? "// elemzés" : "// analysis"}
            </p>
            <h2 className="font-playfair text-xl text-[#1a1814] mb-5">
              {isHu ? "Csapatelemzés" : "Team Analysis"}
            </h2>
            <TeamInsights
              rows={heatmapRows}
              dims={dims.map((d) => ({ code: d.code, label: d.labelByLocale?.[locale as "hu" | "en"] ?? d.label, color: d.color }))}
              isHu={isHu}
            />
          </section>
        )}

        {/* Member list */}
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// tagok" : "// members"}
          </p>
          <h2 className="font-playfair text-xl text-[#1a1814] mb-0.5">
            {isHu ? "Tagok" : "Members"}{" "}
            <span className="font-sans text-sm font-normal text-[#3d3a35]/50">({members.length})</span>
          </h2>

          {(members.length > 0 || pendingInvites.length > 0) && (
            <div className="mt-5 flex flex-col divide-y divide-[#e8e4dc]">
              {members.map((m) => {
                const assessment = m.user.assessmentResults[0];
                return (
                  <div key={m.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1a1814]">
                        {m.user.username ?? m.user.email ?? "—"}
                      </p>
                      {m.user.username && (
                        <p className="truncate text-xs text-[#3d3a35]/60">{m.user.email}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {assessment ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          {assessment.testType}
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#e8e4dc] px-2.5 py-0.5 text-xs text-[#3d3a35]/60">
                          {isHu ? "Nincs teszt" : "No test"}
                        </span>
                      )}
                      <span className="text-xs text-[#3d3a35]/50">
                        {m.joinedAt.toLocaleDateString(dateLocale)}
                      </span>
                      {isOrgManager && m.user.id !== profile.id && (
                        <TeamMemberRemoveButton teamId={teamId} userId={m.user.id} isHu={isHu} />
                      )}
                    </div>
                  </div>
                );
              })}
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 opacity-60">
                    <p className="truncate text-sm font-semibold text-[#1a1814]">{inv.email}</p>
                    <p className="text-xs text-[#3d3a35]/60">{isHu ? "Meghívó elküldve" : "Invite sent"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      {isHu ? "Függőben" : "Pending"}
                    </span>
                    {isOrgManager && (
                      <PendingInviteCancelButton inviteId={inv.id} isHu={isHu} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(isOrgManager) && (
            <div className="border-t border-[#e8e4dc] mt-5 pt-5">
              <h3 className="mb-3 text-sm font-semibold text-[#1a1814]">
                {isHu ? "Tag hozzáadása" : "Add a member"}
              </h3>
              <p className="mb-4 text-xs text-[#3d3a35]/60">
                {isHu
                  ? "Add meg a csapattag emailcímét. A felhasználónak regisztrálva kell lennie."
                  : "Enter the member's email. They must already be registered on Trita."}
              </p>
              <TeamInviteForm teamId={teamId} locale={locale} />
            </div>
          )}
        </section>

        {/* Candidates */}
        {(isOrgManager) && (
          <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
              {isHu ? "// jelöltek" : "// candidates"}
            </p>
            <h2 className="font-playfair text-xl text-[#1a1814] mb-0.5">
              {isHu ? "Jelöltek" : "Candidates"}{" "}
              <span className="font-sans text-sm font-normal text-[#3d3a35]/50">({candidateInvites.length})</span>
            </h2>

            {candidateInvites.length > 0 && (
              <div className="mt-5 flex flex-col divide-y divide-[#e8e4dc]">
                {candidateInvites.map((c) => {
                  const isExpired = c.status !== "COMPLETED" && c.status !== "CANCELED" && c.expiresAt < new Date();
                  const displayStatus = isExpired ? "EXPIRED" : c.status;
                  const statusClass =
                    displayStatus === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                    displayStatus === "EXPIRED" ? "bg-[#e8e4dc] text-[#3d3a35]/60" :
                    displayStatus === "CANCELED" ? "bg-rose-50 text-rose-600" :
                    "bg-amber-50 text-amber-700";
                  const statusText =
                    displayStatus === "COMPLETED" ? (isHu ? "Kész" : "Completed") :
                    displayStatus === "EXPIRED" ? (isHu ? "Lejárt" : "Expired") :
                    displayStatus === "CANCELED" ? (isHu ? "Visszavonva" : "Revoked") :
                    (isHu ? "Függőben" : "Pending");
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1a1814]">
                          {c.name ?? c.email ?? (isHu ? "Névtelen jelölt" : "Anonymous candidate")}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {c.position && <span className="text-xs text-[#3d3a35]/60">{c.position}</span>}
                          <span className="text-xs text-[#3d3a35]/50">{c.createdAt.toLocaleDateString(dateLocale)}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>
                          {statusText}
                        </span>
                        {c.status === "COMPLETED" && c.result && (
                          <a
                            href={`/manager/candidates/${c.id}`}
                            className="min-h-[36px] inline-flex items-center rounded-lg border border-[#e8e4dc] bg-white px-3 text-xs font-semibold text-[#c8410a] transition hover:border-[#c8410a]/30 hover:bg-[#faf9f6]"
                          >
                            {isHu ? "Eredmény" : "Results"}
                          </a>
                        )}
                        {c.status === "PENDING" && !isExpired && (
                          <CandidateRevokeButton inviteId={c.id} isHu={isHu} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={candidateInvites.length > 0 ? "border-t border-[#e8e4dc] mt-5 pt-5" : "mt-5"}>
              <h3 className="mb-3 text-sm font-semibold text-[#1a1814]">
                {isHu ? "Jelölt meghívása" : "Invite a candidate"}
              </h3>
              <p className="mb-4 text-xs text-[#3d3a35]/60">
                {isHu
                  ? "Értékelési linket kap a jelölt. Regisztráció nélkül kitölthető."
                  : "The candidate receives an assessment link. No registration required."}
              </p>
              <CandidateInviteForm locale={locale} teams={[{ id: teamId, name: team.name }]} preselectedTeamId={teamId} />
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
