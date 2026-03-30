import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { canAccessTeam, canManageTeam } from "@/lib/team-auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { getTeamPageData } from "@/lib/team-stats";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Team | Trita", robots: { index: false } };
}

const AVATAR_COLORS = [
  ["#2a5244", "#1e3d34"],
  ["#8a5530", "#6b3f22"],
  ["#4a4a5e", "#33334a"],
  ["#6366F1", "#4F46E5"],
  ["#0E7490", "#0C5E75"],
  ["#9333EA", "#7C22CB"],
] as const;
function getAvatarColor(name: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { userId }, { id: teamId }] = await Promise.all([
    getServerLocale(), auth(), params,
  ]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!profile) redirect("/dashboard");

  const team = await prisma.team.findUnique({
    where: { id: teamId }, select: { id: true, name: true, orgId: true },
  });
  if (!team) notFound();

  const orgMembership = team.orgId
    ? await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
        select: { role: true },
      })
    : null;
  const orgMemberRole = orgMembership?.role ?? null;
  if (!orgMemberRole) redirect("/dashboard");

  const hasTeamAccess = await canAccessTeam(profile.id, teamId, orgMemberRole);
  if (!hasTeamAccess) redirect("/dashboard");
  const isOrgManager = await canManageTeam(profile.id, teamId, orgMemberRole);
  await requireActiveSubscription();

  const isHu = locale !== "en";
  const teamData = await getTeamPageData(teamId, locale as "hu" | "en");
  if (!teamData) notFound();

  const completedCount = teamData.completedCount;
  const inProgressCount = teamData.members.filter((m) => m.scores === null && m.joinedAt).length;
  const waitingCount = teamData.memberCount - completedCount - inProgressCount;
  const completionPct = teamData.memberCount > 0 ? Math.round((completedCount / teamData.memberCount) * 100) : 0;
  const hasPattern = completedCount >= 3;
  const hasObserver = !!teamData.activeCampaign;

  const statusLine = [
    `${teamData.memberCount} ${isHu ? "tag" : "members"}`,
    `${completedCount} ${isHu ? "kész" : "done"}`,
    hasPattern
      ? (isHu ? "csapatkép elérhető" : "team pattern available")
      : `${completionPct}% ${isHu ? "kitöltve" : "completed"}`,
  ].join(" · ");

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:gap-8">

        {/* Breadcrumb */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-[11px] text-ink-body transition-colors hover:text-[#c17f4a]"
        >
          ← {isHu ? "Vissza a vezérlőpultra" : "Back to dashboard"}
        </Link>

        {/* ═══ HERO ═══ */}
        <div className="rounded-xl bg-ink p-5">
          <p className="text-[10px] uppercase tracking-[1px] text-white/60">
            {isHu ? "Csapat" : "Team"}
          </p>
          <h1 className="mt-1 font-fraunces text-xl text-white">
            {teamData.teamName}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {statusLine}
          </p>
        </div>

        {/* ═══ ÖSSZEFOGLALÓ ═══ */}
        <section>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[1px] text-ink-body">
            {isHu ? "ÖSSZEFOGLALÓ" : "SUMMARY"}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Kitöltési arány */}
            <div className="rounded-xl border border-sand bg-white p-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.5px] text-ink-body">
                {isHu ? "KITÖLTÉSI ARÁNY" : "COMPLETION RATE"}
              </p>
              <div className="mb-2 flex gap-1">
                {completedCount > 0 && <div className="h-1.5 rounded-full bg-[#0f6e56]" style={{ flex: completedCount }} />}
                {inProgressCount > 0 && <div className="h-1.5 rounded-full bg-amber-500" style={{ flex: inProgressCount }} />}
                {waitingCount > 0 && <div className="h-1.5 rounded-full bg-[#c17f4a]" style={{ flex: waitingCount }} />}
              </div>
              <p className="text-[11px] text-ink-body">
                {completedCount} {isHu ? "kész" : "done"} · {inProgressCount} {isHu ? "folyamatban" : "in progress"} · {waitingCount} {isHu ? "várakozik" : "waiting"}
              </p>
            </div>

            {/* Csapatmintázat */}
            <div className="rounded-xl border border-sand bg-white p-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.5px] text-ink-body">
                {isHu ? "CSAPATMINTÁZAT" : "TEAM PATTERN"}
              </p>
              {hasPattern ? (
                <>
                  <p className="text-sm font-medium text-ink">{isHu ? "Elérhető" : "Available"}</p>
                  {teamData.patternResult?.fullLabel && (
                    <p className="mt-1 text-[11px] text-ink-body">{teamData.patternResult.fullLabel}</p>
                  )}
                  <Link
                    href={`/team/${teamId}?tab=profile`}
                    className="mt-2 inline-block text-[11px] font-medium text-[#0f6e56]"
                  >
                    {isHu ? "Csapatkép megtekintése →" : "View team pattern →"}
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-ink-body">{isHu ? "Még nem elérhető" : "Not yet available"}</p>
                  <p className="mt-1 text-[11px] text-ink-body">
                    {isHu
                      ? `A kitöltések ${completionPct}%-ánál tart. Minimum 3 kitöltés szükséges.`
                      : `${completionPct}% complete. Minimum 3 assessments required.`}
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ═══ TAGOK ═══ */}
        <section>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[1px] text-ink-body">
            {isHu ? "TAGOK" : "MEMBERS"}
          </p>
          <div className="divide-y divide-[#e8e0d3] rounded-xl border border-sand bg-white">
            {teamData.members.map((member) => {
              const isDone = member.scores !== null;
              const avgScore = isDone && member.scores
                ? Math.round(Object.values(member.scores).reduce((s, v) => s + v, 0) / Object.values(member.scores).length)
                : null;
              const [from, to] = getAvatarColor(member.displayName);
              const initial = member.displayName[0]?.toUpperCase() ?? "?";

              return (
                <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{member.displayName}</p>
                    <p className="text-[10px] text-ink-body">{member.role}</p>
                  </div>
                  {/* Status badge */}
                  {isDone ? (
                    <span className="rounded bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-medium text-[#085041]">
                      {isHu ? "Kész" : "Done"}
                    </span>
                  ) : member.joinedAt ? (
                    <span className="rounded bg-[#FAEEDA] px-2 py-0.5 text-[10px] font-medium text-[#633806]">
                      {isHu ? "Folyamatban" : "In progress"}
                    </span>
                  ) : (
                    <span className="rounded bg-[#FAECE7] px-2 py-0.5 text-[10px] font-medium text-[#712B13]">
                      {isHu ? "Várakozik" : "Waiting"}
                    </span>
                  )}
                  {/* Score */}
                  <span className="w-8 text-right text-[11px] font-medium text-ink">
                    {avgScore ?? "—"}
                  </span>
                  {/* CTA */}
                  {isDone ? (
                    <span className="text-[11px] font-medium text-[#0f6e56]">
                      {isHu ? "Profil →" : "Profile →"}
                    </span>
                  ) : (
                    <span className="cursor-pointer text-[11px] font-medium text-[#c17f4a]">
                      {isHu ? "Eml. →" : "Remind →"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ VISSZAJELZÉSI KÖR ═══ */}
        <section>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[1px] text-ink-body">
            {isHu ? "VISSZAJELZÉSI KÖR" : "FEEDBACK ROUND"}
          </p>
          <div className="flex items-center justify-between rounded-xl border border-sand bg-white p-4">
            <div>
              <p className="text-[13px] font-medium text-ink">
                {hasObserver
                  ? (isHu ? `${teamData.activeCampaign!.teamObserverDoneCount} aktív visszajelzés` : `${teamData.activeCampaign!.teamObserverDoneCount} active feedback`)
                  : (isHu ? "Még nincs aktív kör" : "No active round yet")}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-body">
                {hasObserver
                  ? (isHu ? "Visszajelzések gyűjtése folyamatban" : "Collecting feedback")
                  : (isHu ? "Csapatkép után indítható" : "Available after team pattern")}
              </p>
            </div>
            {isOrgManager && teamData.orgId && (
              <Link
                href={`/org/${teamData.orgId}?tab=campaigns`}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2a2a3e]"
              >
                {hasObserver
                  ? (isHu ? "Kör kezelése" : "Manage round")
                  : (isHu ? "Kör indítása" : "Start round")}
              </Link>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
