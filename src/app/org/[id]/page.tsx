import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { FadeIn } from "@/components/landing/FadeIn";
import { OrgInviteForm } from "@/components/org/OrgInviteForm";
import { OrgRemoveMemberButton } from "@/components/org/OrgRemoveMemberButton";
import { TeamCreateForm } from "@/components/manager/TeamCreateForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Szervezet | Trita", robots: { index: false } };
}

function roleBadgeClass(role: string) {
  if (role === "ORG_ADMIN") return "bg-indigo-50 text-indigo-600";
  if (role === "ORG_MANAGER") return "bg-purple-50 text-purple-600";
  return "bg-gray-100 text-gray-500";
}

function roleLabel(role: string, isHu: boolean) {
  if (role === "ORG_ADMIN") return "Admin";
  if (role === "ORG_MANAGER") return isHu ? "Menedzser" : "Manager";
  return isHu ? "Tag" : "Member";
}

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id: orgId }] = await Promise.all([getServerLocale(), params]);

  const { profileId, role: memberRole, org } = await requireOrgContext(orgId);
  const isAdmin = hasOrgRole(memberRole, "ORG_ADMIN");
  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  const isHu = locale !== "en" && locale !== "de";
  const dateLocale = locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "hu-HU";

  const [members, pendingInvites, teams] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { orgId },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        userId: true,
        user: { select: { id: true, email: true, username: true } },
      },
    }),
    prisma.organizationPendingInvite.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, role: true, createdAt: true },
    }),
    prisma.team.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    }),
  ]);

  if (!org) notFound();

  return (
    <div className="bg-gradient-to-b from-indigo-50/70 via-white to-white min-h-dvh">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">

        {/* Header */}
        <FadeIn>
          <div>
            <Link
              href="/org"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-6"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
              {isHu ? "Vissza a szervezetekhez" : "Back to organizations"}
            </Link>

            <section className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-100/80 via-purple-50/60 to-pink-50/40 p-8 shadow-md shadow-indigo-200/40">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" aria-hidden="true" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                    {isHu ? "Szervezet" : "Organization"}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent md:text-3xl">
                      {org.name}
                    </h1>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {members.length} {isHu ? "tag" : members.length === 1 ? "member" : "members"}
                    {pendingInvites.length > 0 && ` · ${pendingInvites.length} ${isHu ? "függőben" : "pending"}`}
                    {" · "}
                    {teams.length} {isHu ? "csapat" : teams.length === 1 ? "team" : "teams"}
                    {org.status === "PENDING_SETUP" && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                        {isHu ? "Beállítás folyamatban" : "Setup pending"}
                      </span>
                    )}
                  </p>
                </div>
                {isAdmin && (
                  <Link
                    href={`/org/${orgId}/settings`}
                    className="shrink-0 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-indigo-200 bg-white/70 px-3 text-xs font-semibold text-indigo-700 transition hover:bg-white"
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="8" r="2" />
                      <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7" />
                    </svg>
                    {isHu ? "Beállítások" : "Settings"}
                  </Link>
                )}
              </div>
            </section>
          </div>
        </FadeIn>

        {/* Teams */}
        <FadeIn delay={0.05}>
          <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isHu ? "Csapatok" : "Teams"}{" "}
                <span className="text-sm font-normal text-gray-400">({teams.length})</span>
              </h2>
            </div>

            {teams.length === 0 ? (
              <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-8 text-center">
                <p className="text-sm text-gray-400">
                  {isHu ? "Még nincs csapat. Hozz létre egyet lentebb!" : "No teams yet. Create one below!"}
                </p>
              </div>
            ) : (
              <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                {teams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/team/${team.id}`}
                    className="group flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-indigo-200 hover:bg-white"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
                        {team.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {team._count.members} {isHu ? "tag" : team._count.members === 1 ? "member" : "members"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {isManager && (
              <div className="border-t border-gray-100 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  {isHu ? "Új csapat" : "New team"}
                </h3>
                <TeamCreateForm locale={locale} orgId={orgId} />
              </div>
            )}
          </section>
        </FadeIn>

        {/* Members */}
        <FadeIn delay={0.1}>
          <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {isHu ? "Tagok" : "Members"}{" "}
                <span className="text-sm font-normal text-gray-400">
                  ({members.length + pendingInvites.length})
                </span>
              </h2>
            </div>

            <div className="flex flex-col divide-y divide-gray-100">
              {members.map((m) => (
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
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(m.role)}`}>
                      {roleLabel(m.role, isHu)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {m.joinedAt.toLocaleDateString(dateLocale)}
                    </span>
                    {isAdmin && m.userId !== profileId && (
                      <OrgRemoveMemberButton
                        orgId={orgId}
                        userId={m.userId}
                        isHu={isHu}
                      />
                    )}
                  </div>
                </div>
              ))}

              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 py-3 opacity-60">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-700">{inv.email}</p>
                    <p className="text-xs text-gray-400">{isHu ? "Meghívó függőben" : "Invite pending"}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                    {isHu ? "Függőben" : "Pending"}
                  </span>
                </div>
              ))}

              {members.length === 0 && pendingInvites.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-400">
                  {isHu ? "Még nincs tag." : "No members yet."}
                </p>
              )}
            </div>

            {isManager && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  {isHu ? "Tag meghívása" : "Invite a member"}
                </h3>
                <p className="mb-4 text-xs text-gray-500">
                  {isHu
                    ? "Add meg a tag emailcímét. Ha már regisztrált a Tritán, azonnal csatlakozik."
                    : "Enter the member's email. If they're already on Trita, they'll join immediately."}
                </p>
                <OrgInviteForm orgId={orgId} locale={locale} canInviteManager={isAdmin} />
              </div>
            )}
          </section>
        </FadeIn>

      </main>
    </div>
  );
}
