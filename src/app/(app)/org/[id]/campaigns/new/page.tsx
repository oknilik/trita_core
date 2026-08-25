import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { getCapabilityGateCopy } from "@/lib/policy-ux";
import { CampaignWizard } from "@/components/campaign/CampaignWizard";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import {
  resolveOrgCapabilityDecision,
  resolveOrgPolicySnapshot,
  toOrgSubscriptionBannerState,
} from "@/lib/policy-service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Új mérés | trita", robots: { index: false } };
}

export default async function NewCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ team?: string }>;
}) {
  const [locale, { id: orgId }, { team: preselectedTeamId }] = await Promise.all([
    getServerLocale(),
    params,
    searchParams,
  ]);

  const { profileId, role: memberRole, org } = await requireOrgContext(orgId);
  if (!org) notFound();

  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  if (!isManager) notFound();
  // Kampányt csak tanácsadó hoz létre (ORG_CONSULTANT vagy platform-admin).
  const viewer = await prisma.userProfile.findUnique({
    where: { id: profileId },
    select: { email: true, isConsultant: true },
  });
  if (!isConsultantSurface(memberRole, viewer?.email, viewer?.isConsultant)) notFound();
  const policySnapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: memberRole,
  });
  const createDecision = resolveOrgCapabilityDecision(
    policySnapshot,
    "launchCampaign",
  );
  const isReadOnly = !createDecision.allowed;
  const bannerState = toOrgSubscriptionBannerState(policySnapshot.policy.policyState);
  const gateCopy = getCapabilityGateCopy({
    locale,
    reason: createDecision.reason,
    upgradeHintCode: createDecision.upgradeHint?.code,
  });

  const isHu = locale !== "en"; // kept for server-rendered text on this page

  if (isReadOnly) {
    return (
      <PlatformPageShell
        surface="org"
        contentClassName="max-w-3xl gap-6 px-4 py-8"
        chrome={{
          breadcrumb: [
            { label: org.name, href: `/org/${orgId}?tab=campaigns` },
            { label: isHu ? "Mérések" : "Measurements", href: `/org/${orgId}?tab=campaigns` },
            { label: t("org.campaign.newTitle", locale) },
          ],
          eyebrow: t("org.campaign.newEyebrow", locale),
          title: t("org.campaign.newTitle", locale),
        }}
      >
          <OrgSubscriptionBanner
            state={bannerState ?? "restricted"}
            locale={locale}
          />
          <div className="mt-6 rounded-2xl border border-sand bg-surface-card p-6 shadow-sm">
            <h1 className="font-fraunces text-2xl text-ink">{gateCopy.title}</h1>
            <p className="mt-2 text-sm text-ink-body">
              {gateCopy.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={gateCopy.ctaHref}
                className="inline-flex min-h-[42px] items-center rounded-lg bg-sage px-4 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
              >
                {gateCopy.ctaLabel}
              </a>
              <Link
                href={`/org/${orgId}?tab=campaigns`}
                className="inline-flex min-h-[42px] items-center rounded-lg border border-sand px-4 text-sm font-semibold text-ink-body transition hover:bg-cream"
              >
                {isHu ? "Vissza a mérésekhez" : "Back to measurements"}
              </Link>
            </div>
          </div>
      </PlatformPageShell>
    );
  }

  const [members, teams] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { orgId, leftAt: null },
      orderBy: { joinedAt: "asc" },
      select: {
        userId: true,
        user: { select: { username: true, email: true } },
      },
    }),
    prisma.team.findMany({
      where: { orgId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        members: {
          select: {
            userId: true,
            user: { select: { username: true, email: true } },
          },
        },
      },
    }),
  ]);

  const serializedMembers = members.map((m) => ({
    userId: m.userId,
    displayName: m.user.username ?? m.user.email ?? m.userId,
  }));

  const serializedTeams = teams.map((team) => ({
    id: team.id,
    name: team.name,
    members: team.members.map((m) => ({
      userId: m.userId,
      displayName: m.user.username ?? m.user.email ?? m.userId,
    })),
  }));

  return (
    <PlatformPageShell
      surface="org"
      contentClassName="max-w-3xl gap-7 px-4 py-8"
      chrome={{
        breadcrumb: [
          { label: org.name, href: `/org/${orgId}?tab=campaigns` },
          { label: isHu ? "Mérések" : "Measurements", href: `/org/${orgId}?tab=campaigns` },
          { label: t("org.campaign.newTitle", locale) },
        ],
        eyebrow: t("org.campaign.newEyebrow", locale),
        title: t("org.campaign.newTitle", locale),
        subtitle: tf("org.campaign.backWithName", locale, { orgName: org.name }),
      }}
    >
        <CampaignWizard
          orgId={orgId}
          members={serializedMembers}
          teams={serializedTeams}
          preselectedTeamId={preselectedTeamId ?? null}
          locale={locale}
        />
    </PlatformPageShell>
  );
}
