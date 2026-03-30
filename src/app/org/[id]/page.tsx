import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { getOrgPageData } from "@/lib/org-stats";
import { OrgPageShell } from "@/components/org/OrgPageShell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Szervezet | Trita", robots: { index: false } };
}

// ── Avatar color (shared with UserMenu) ─────────────────────────────────────
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

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id: orgId }] = await Promise.all([getServerLocale(), params]);

  const { profileId, role: memberRole, org } = await requireOrgContext(orgId);
  await requireActiveSubscription();

  if (!org) notFound();
  if (!hasOrgRole(memberRole, "ORG_ADMIN")) redirect("/dashboard");

  const isAdmin = hasOrgRole(memberRole, "ORG_ADMIN");
  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  const isHu = locale !== "en";
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  const [pageData, members, pendingInvites, teams] = await Promise.all([
    getOrgPageData(orgId),
    prisma.organizationMember.findMany({
      where: { orgId },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true, role: true, joinedAt: true, userId: true,
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
      select: { id: true, name: true, createdAt: true, _count: { select: { members: true } } },
    }),
  ]);

  const serializedMembers = members.map((m) => ({
    id: m.id, userId: m.userId, role: m.role, joinedAt: m.joinedAt.toISOString(),
    user: { id: m.user.id, email: m.user.email ?? null, username: m.user.username ?? null },
  }));
  const serializedPendingInvites = pendingInvites.map((inv) => ({
    id: inv.id, email: inv.email, role: inv.role, createdAt: inv.createdAt.toISOString(),
  }));
  const serializedTeams = teams.map((tm) => ({
    id: tm.id, name: tm.name, createdAt: tm.createdAt.toISOString(), _count: { members: tm._count.members },
  }));

  const completionPct = pageData.activeTotalParticipants > 0
    ? Math.round((pageData.activeSelfDone / pageData.activeTotalParticipants) * 100)
    : 0;

  // Build narrative hero subtitle
  const heroSubParts: string[] = [];
  heroSubParts.push(`${pageData.teamCount} ${t("org.teamsLabel", locale)}`);
  heroSubParts.push(`${pageData.memberCount} ${t("org.membersLabel", locale)}`);
  if (pageData.activeCampaignCount > 0) {
    heroSubParts.push(`${pageData.activeCampaignCount} ${t("org.activeCampaigns", locale).toLowerCase()}`);
  }
  const heroSub = `${t("org.heroSub", locale)} — ${heroSubParts.join(", ")}.`;

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 md:gap-14">

        {/* ═══ 1. ORG HERO ═══ */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ background: "linear-gradient(135deg, #2a5244 0%, #1e3d34 60%, #1a2e28 100%)" }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-white/[0.02]" />
          <div className="px-7 pb-8 pt-9 md:px-9 md:pb-9 md:pt-11">
            <p className="mb-3 text-[9px] uppercase tracking-[2px] text-white/[0.28]">
              {t("org.eyebrow", locale)}
            </p>

            <h1 className="font-fraunces text-[36px] tracking-tight text-white md:text-[42px]">
              {org.name}
            </h1>

            <p className="mt-2 max-w-[520px] text-[14px] leading-relaxed text-white/[0.4]">
              {heroSub}
            </p>

            {/* Status chips */}
            {org.status === "PENDING_SETUP" && (
              <span className="mt-3 inline-block rounded-md bg-amber-500/20 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
                {t("org.setupPending", locale)}
              </span>
            )}

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/org/${orgId}?tab=campaigns`}
                className="flex min-h-[44px] items-center rounded-[9px] bg-[#c17f4a] px-5 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
              >
                {t("org.heroCta1", locale)}
              </Link>
              <Link
                href={`/org/${orgId}?tab=teams`}
                className="flex min-h-[44px] items-center rounded-[9px] bg-white/[0.07] px-5 py-2 text-[12px] font-medium text-white/[0.55] transition hover:bg-white/[0.12]"
              >
                {t("org.heroCta2", locale)}
              </Link>
              {isAdmin && (
                <Link
                  href={`/org/${orgId}/settings`}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-[9px] bg-white/[0.07] px-4 py-2 text-[12px] font-medium text-white/[0.55] transition hover:bg-white/[0.12]"
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="8" r="2" />
                    <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7" />
                  </svg>
                  {t("org.settingsLink", locale)}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ═══ 2. INSIGHT CARDS ("Most érdemes figyelni") ═══ */}
        <section>
          <div className="mb-5 flex items-center gap-2">
            <div className="h-px w-4 bg-[#c17f4a]" />
            <span className="text-[9px] font-medium uppercase tracking-[2px] text-[#c17f4a]">
              {t("org.insightEyebrow", locale)}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Activity */}
            <div className="rounded-2xl border border-sand bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#3d6b5e]" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3d6b5e]">
                  {t("org.insightActivityTitle", locale)}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-ink-body">
                {pageData.activeCampaignCount > 0
                  ? tf("org.insightFeedbackActive", locale, { count: String(pageData.activeCampaignCount) })
                  : t("org.insightActivityNone", locale)}
              </p>
            </div>
            {/* Feedback */}
            <div className="rounded-2xl border border-sand bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#b45309]">
                  {t("org.insightFeedbackTitle", locale)}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-ink-body">
                {pageData.activeCampaignCount > 0
                  ? tf("org.insightFeedbackActive", locale, { count: String(pageData.activeCampaignCount) })
                  : t("org.insightFeedbackNone", locale)}
              </p>
            </div>
            {/* Action */}
            <div className="rounded-2xl border border-sand bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#6366F1]" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6366F1]">
                  {t("org.insightActionTitle", locale)}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-ink-body">
                {pageData.pendingCount > 0
                  ? tf("org.insightActionInvite", locale, { count: String(pageData.pendingCount) })
                  : t("org.insightActionStart", locale)}
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 3. STATE CARDS ═══ */}
        <section>
          <div className="mb-5 flex items-center gap-2">
            <div className="h-px w-4 bg-[#c17f4a]" />
            <span className="text-[9px] font-medium uppercase tracking-[2px] text-[#c17f4a]">
              {t("org.stateEyebrow", locale)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StateCard
              accent="#3d6b5e"
              title={t("org.stateMembersTitle", locale)}
              value={String(pageData.memberCount)}
              sub={tf("org.stateMembersSub", locale, { count: String(pageData.memberCount) })}
            />
            <StateCard
              accent="#6366F1"
              title={t("org.stateTeamsTitle", locale)}
              value={String(pageData.teamCount)}
              sub={tf("org.stateTeamsSub", locale, { count: String(pageData.teamCount) })}
            />
            <StateCard
              accent="#F59E0B"
              title={t("org.stateCompletionTitle", locale)}
              value={`${completionPct}%`}
              sub={tf("org.stateCompletionSub", locale, { done: String(pageData.activeSelfDone), total: String(pageData.activeTotalParticipants || pageData.memberCount) })}
            />
            <StateCard
              accent="#059669"
              title={t("org.stateCampaignsTitle", locale)}
              value={String(pageData.activeCampaignCount)}
              sub={tf("org.stateCampaignsSub", locale, { active: String(pageData.activeCampaignCount), closed: String(pageData.closedCampaignCount) })}
            />
          </div>
        </section>

        {/* ═══ 4. TEAM SUMMARY CARDS ═══ */}
        <section>
          <div className="mb-5 flex items-center gap-2">
            <div className="h-px w-4 bg-[#c17f4a]" />
            <span className="text-[9px] font-medium uppercase tracking-[2px] text-[#c17f4a]">
              {t("org.teamsEyebrow", locale)}
            </span>
          </div>
          {teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand bg-white p-10 text-center">
              <p className="text-sm text-muted">{t("org.teamCardNoTeams", locale)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {teams.map((tm) => {
                const [from, to] = getAvatarColor(tm.name);
                return (
                  <Link
                    key={tm.id}
                    href={`/team/${tm.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-sand bg-white p-5 transition-all hover:border-sage/40 hover:shadow-md hover:shadow-sage/5"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                    >
                      {tm.name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink transition-colors group-hover:text-sage">
                        {tm.name}
                      </p>
                      <p className="text-xs text-muted">
                        {tf("org.teamCardMembers", locale, { count: String(tm._count.members) })}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-sage opacity-0 transition-opacity group-hover:opacity-100">
                      {t("org.teamCardOpen", locale)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ 5. BOTTOM CTA BAND ═══ */}
        <section className="rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#2a2740] p-8 md:p-12">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <h2 className="font-fraunces text-2xl text-white lg:text-3xl">
                {t("org.ctaBandTitle", locale)}
              </h2>
              <p className="mt-2 text-sm text-white/[0.35]">
                {t("org.ctaBandSub", locale)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/org/${orgId}?tab=campaigns`}
                className="rounded-[10px] bg-[#c17f4a] px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-[1.06]"
              >
                {t("org.ctaBandCta1", locale)}
              </Link>
              <Link
                href={`/org/${orgId}?tab=teams`}
                className="rounded-[10px] border border-white/20 px-6 py-3 text-sm font-semibold text-white/60 transition-all hover:bg-white/5"
              >
                {t("org.ctaBandCta2", locale)}
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ 6. TABS (Campaigns, Teams, Members) ═══ */}
        <Suspense fallback={<div className="h-10 rounded-lg bg-sand/40 animate-pulse" />}>
          <OrgPageShell
            orgId={orgId}
            orgName={org.name}
            profileId={profileId}
            isAdmin={isAdmin}
            isManager={isManager}
            isHu={isHu}
            locale={locale}
            dateLocale={dateLocale}
            pageData={pageData}
            members={serializedMembers}
            pendingInvites={serializedPendingInvites}
            teams={serializedTeams}
          />
        </Suspense>

      </main>
    </div>
  );
}

// ── State card component ────────────────────────────────────────────────────

function StateCard({
  accent,
  title,
  value,
  sub,
}: {
  accent: string;
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-sand bg-white px-5 pb-4 pt-5">
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} />
      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted">{title}</p>
      <p className="mt-1.5 font-fraunces text-[28px] leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-1.5 text-[11px] leading-snug text-ink-body">{sub}</p>
    </div>
  );
}
