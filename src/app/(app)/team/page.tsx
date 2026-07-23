import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/lib/auth-server";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { TeamCreateForm } from "@/components/manager/TeamCreateForm";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { hasOrgRole } from "@/lib/auth";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Csapatok | trita" : "Teams | trita",
    robots: { index: false },
  };
}

export default async function TeamListPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), getServerAuth()]);
  if (!userId) redirect("/sign-in");

  await requireOnboardedByClerkId(userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) redirect(JOURNEY_HOME_HANDOFF_PATH);

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: profile.id, leftAt: null },
    select: { orgId: true, role: true },
  });
  if (memberships.length === 0) {
    const fallback = await resolveJourneyFallbackForProfileId(profile.id);
    redirect(fallback);
  }

  // Csapat-létrehozás: csak menedzser+ szerep (vagy tanácsadói felület) —
  // sima tagnak a kártya meg sem jelenik, ő csak a saját csapatait látja.
  const canCreateTeam = memberships.some((m) =>
    isConsultantSurface(m.role, profile.email, profile.isConsultant) ||
    hasOrgRole(m.role, "ORG_MANAGER"),
  );

  const orgIds = memberships.map((m) => m.orgId);
  const teams = await prisma.team.findMany({
    where: canCreateTeam
      ? { orgId: { in: orgIds } }
      : {
          orgId: { in: orgIds },
          members: { some: { userId: profile.id } },
        },
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
      chrome={{
        breadcrumb: [
          { label: t("nav.home", locale), href: JOURNEY_HOME_HANDOFF_PATH },
          { label: t("team.title", locale) },
        ],
        eyebrow: t("nav.team", locale),
        title: t("team.title", locale),
        subtitle: `${teams.length} ${
          teams.length === 1 ? t("team.memberTag", locale) : t("team.teamsLabel", locale)
        }`,
        actions: canCreateTeam ? (
          <Link
            href="#create-team"
            className={getButtonClassName({ size: "sm", variant: "secondary" })}
          >
            {t("team.createNew", locale)}
          </Link>
        ) : undefined,
      }}
    >
        {/* Create new team — csak menedzser+ / tanácsadói felületen. */}
        {canCreateTeam ? (
          <Card as="section" spacing="lg" className="md:p-8" id="create-team">
            <SectionEyebrow className="mb-1 text-[10px] tracking-[0.18em]">
              {"// "}
              {t("team.createNew", locale)}
            </SectionEyebrow>
            <h2 className="mb-1 font-fraunces text-xl text-ink">
              {t("team.createNew", locale)}
            </h2>
            <p className="mb-5 text-sm text-ink-body">
              {t("team.createNewDesc", locale)}
            </p>
            <TeamCreateForm locale={locale} />
          </Card>
        ) : null}

        {/* Team list */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="h-px w-4 bg-bronze" />
            <SectionEyebrow as="h2" className="text-[10px] tracking-[0.18em]">
              {t("team.teamsLabel", locale)} ({teams.length})
            </SectionEyebrow>
          </div>

          {teams.length === 0 && (
            <Card
              spacing="lg"
              className="border-dashed p-10 text-center"
            >
              <p className="text-sm text-muted">
                {t("team.noTeams", locale)}
              </p>
            </Card>
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
