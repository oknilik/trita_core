import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { OrgInviteForm } from "@/components/org/OrgInviteForm";
import { OrgRemoveMemberButton } from "@/components/org/OrgRemoveMemberButton";
import { OrgPendingInviteCancelButton } from "@/components/org/OrgPendingInviteCancelButton";
import { TeamCreateForm } from "@/components/manager/TeamCreateForm";
import { CampaignList } from "@/components/org/CampaignList";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Szervezet | Trita", robots: { index: false } };
}

function roleBadgeClass(role: string) {
  if (role === "ORG_ADMIN") return "bg-[#c8410a]/10 text-[#c8410a]";
  if (role === "ORG_MANAGER") return "bg-[#1a1814]/10 text-[#1a1814]";
  return "bg-[#e8e4dc] text-[#3d3a35]";
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
  await requireActiveSubscription();
  const isAdmin = hasOrgRole(memberRole, "ORG_ADMIN");
  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  const isHu = locale !== "en";
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  const [members, pendingInvites, teams, campaigns] = await Promise.all([
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
    prisma.campaign.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        closedAt: true,
        creator: { select: { username: true } },
        _count: { select: { participants: true } },
      },
    }),
  ]);

  if (!org) notFound();

  return (
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:gap-12 px-4 py-10">

        {/* Header */}
        <div>
          <Link
            href="/org"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a35] hover:text-[#c8410a] mb-6 transition-colors"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {isHu ? "Vissza a szervezetekhez" : "Back to organizations"}
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
                {isHu ? "// szervezet" : "// organization"}
              </p>
              <h1 className="font-playfair text-3xl text-[#1a1814] mt-1 md:text-4xl">
                {org.name}
              </h1>
              <p className="mt-1 text-xs text-[#3d3a35]/60">
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
                className="shrink-0 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#e8e4dc] bg-white px-3 text-xs font-semibold text-[#3d3a35] transition hover:border-[#c8410a]/40 hover:text-[#c8410a]"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="2" />
                  <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7" />
                </svg>
                {isHu ? "Beállítások" : "Settings"}
              </Link>
            )}
          </div>
        </div>

        {/* Teams */}
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// csapatok" : "// teams"}
          </p>
          <h2 className="font-playfair text-xl text-[#1a1814] mb-5">
            {isHu ? "Csapatok" : "Teams"}{" "}
            <span className="font-sans text-sm font-normal text-[#3d3a35]/50">({teams.length})</span>
          </h2>

          {teams.length === 0 ? (
            <div className="mb-6 rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-8 text-center">
              <p className="text-sm text-[#3d3a35]/60">
                {isHu ? "Még nincs csapat. Hozz létre egyet lentebb!" : "No teams yet. Create one below!"}
              </p>
            </div>
          ) : (
            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/team/${team.id}`}
                  className="group flex items-center justify-between rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-4 transition-all hover:border-[#c8410a]/30 hover:bg-white"
                >
                  <div>
                    <p className="font-semibold text-[#1a1814] transition-colors group-hover:text-[#c8410a]">
                      {team.name}
                    </p>
                    <p className="text-xs text-[#3d3a35]/60">
                      {team._count.members} {isHu ? "tag" : team._count.members === 1 ? "member" : "members"}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[#c8410a] opacity-0 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}

          {isManager && (
            <div className="border-t border-[#e8e4dc] pt-5">
              <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
                {isHu ? "// új csapat" : "// new team"}
              </p>
              <h3 className="text-sm font-semibold text-[#1a1814] mb-3">
                {isHu ? "Új csapat" : "New team"}
              </h3>
              <TeamCreateForm locale={locale} orgId={orgId} />
            </div>
          )}
        </section>

        {/* Active campaign banner */}
        {campaigns.some((c) => c.status === "ACTIVE") && (
          <a
            href="#campaigns"
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {isHu
              ? `${campaigns.filter((c) => c.status === "ACTIVE").length} aktív 360° kampány folyamatban →`
              : `${campaigns.filter((c) => c.status === "ACTIVE").length} active 360° campaign${campaigns.filter((c) => c.status === "ACTIVE").length > 1 ? "s" : ""} in progress →`}
          </a>
        )}

        {/* Campaigns */}
        <section id="campaigns" className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// 360° kampányok" : "// 360° campaigns"}
          </p>
          <h2 className="font-playfair text-xl text-[#1a1814] mb-5">
            {isHu ? "360° kampányok" : "360° Campaigns"}{" "}
            <span className="font-sans text-sm font-normal text-[#3d3a35]/50">
              ({campaigns.length})
            </span>
          </h2>
          <CampaignList
            orgId={orgId}
            campaigns={campaigns.map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
              closedAt: c.closedAt?.toISOString() ?? null,
            }))}
            members={members.map((m) => ({
              id: m.id,
              userId: m.userId,
              user: { username: m.user.username ?? null, email: m.user.email ?? null },
            }))}
            canManage={isManager}
            isHu={isHu}
          />
        </section>

        {/* Members */}
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// tagok" : "// members"}
          </p>
          <h2 className="font-playfair text-xl text-[#1a1814] mb-5">
            {isHu ? "Tagok" : "Members"}{" "}
            <span className="font-sans text-sm font-normal text-[#3d3a35]/50">
              ({members.length + pendingInvites.length})
            </span>
          </h2>

          <div className="flex flex-col divide-y divide-[#e8e4dc]">
            {members.map((m) => (
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
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(m.role)}`}>
                    {roleLabel(m.role, isHu)}
                  </span>
                  <span className="text-xs text-[#3d3a35]/50">
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
              <div key={inv.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 opacity-60">
                  <p className="truncate text-sm font-semibold text-[#1a1814]">{inv.email}</p>
                  <p className="text-xs text-[#3d3a35]/60">{isHu ? "Meghívó függőben" : "Invite pending"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                    {isHu ? "Függőben" : "Pending"}
                  </span>
                  {isManager && (
                    <OrgPendingInviteCancelButton orgId={orgId} inviteId={inv.id} isHu={isHu} />
                  )}
                </div>
              </div>
            ))}

            {members.length === 0 && pendingInvites.length === 0 && (
              <p className="py-6 text-center text-sm text-[#3d3a35]/50">
                {isHu ? "Még nincs tag." : "No members yet."}
              </p>
            )}
          </div>

          {isManager && (
            <div className="mt-6 border-t border-[#e8e4dc] pt-5">
              <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
                {isHu ? "// meghívás" : "// invite"}
              </p>
              <h3 className="text-sm font-semibold text-[#1a1814] mb-3">
                {isHu ? "Tag meghívása" : "Invite a member"}
              </h3>
              <p className="mb-4 text-xs text-[#3d3a35]/60">
                {isHu
                  ? "Add meg a tag emailcímét. Ha már regisztrált a Tritán, azonnal csatlakozik."
                  : "Enter the member's email. If they're already on Trita, they'll join immediately."}
              </p>
              <OrgInviteForm orgId={orgId} locale={locale} canInviteManager={isAdmin} />
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
