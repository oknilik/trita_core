import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { TeamCreateForm } from "@/components/manager/TeamCreateForm";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Csapatok | trita" : "Teams | trita",
    robots: { index: false },
  };
}

export default async function TeamListPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect(JOURNEY_HOME_HANDOFF_PATH);

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: profile.id, leftAt: null },
    select: { orgId: true },
  });
  if (memberships.length === 0) redirect("/org");

  const orgIds = memberships.map((m) => m.orgId);
  const teams = await prisma.team.findMany({
    where: { orgId: { in: orgIds } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
  });

  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-10 md:gap-12"
    >

        {/* Header */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-bronze">
            {"// "}
            {t("team.eyebrow", locale)}
          </p>
          <h1 className="mt-2 font-fraunces text-3xl tracking-tight text-ink md:text-4xl">
            {t("team.title", locale)}
          </h1>
          <p className="mt-2 text-sm text-ink-body">
            {teams.length} {teams.length === 1 ? t("team.memberTag", locale) : t("team.teamsLabel", locale)}
          </p>
        </div>

        {/* Create new team */}
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-bronze">
            {"// "}
            {t("team.createNew", locale)}
          </p>
          <h2 className="mb-1 font-fraunces text-xl text-ink">
            {t("team.createNew", locale)}
          </h2>
          <p className="mb-5 text-sm text-ink-body">
            {t("team.createNewDesc", locale)}
          </p>
          <TeamCreateForm locale={locale} />
        </section>

        {/* Team list */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="h-px w-4 bg-bronze" />
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-bronze">
              {t("team.teamsLabel", locale)} ({teams.length})
            </h2>
          </div>

          {teams.length === 0 && (
            <div className="rounded-2xl border border-dashed border-sand bg-white p-10 text-center">
              <p className="text-sm text-muted">
                {t("team.noTeams", locale)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/team/${team.id}`}
                className="group rounded-2xl border border-sand bg-white p-5 transition-all hover:border-sage/40 hover:shadow-md hover:shadow-sage/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-semibold text-ink transition-colors group-hover:text-sage">
                    {team.name}
                  </p>
                  <span className="shrink-0 rounded-full bg-sage-ghost px-2.5 py-0.5 text-xs font-semibold text-sage">
                    {team._count.members} {team._count.members === 1 ? t("team.memberTag", locale) : t("team.membersTag", locale)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted">
                    {t("team.createdPrefix", locale)}{team.createdAt.toLocaleDateString(dateLocale)}
                  </p>
                  <span className="text-xs font-semibold text-sage opacity-0 transition-opacity group-hover:opacity-100">
                    {t("team.open", locale)} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

    </PlatformPageShell>
  );
}
