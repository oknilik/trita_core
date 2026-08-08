import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
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
      <div className="min-h-dvh bg-cream">
        <main className="mx-auto w-full max-w-2xl px-4 pt-10 pb-20">
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
        </main>
      </div>
    );
  }

  const [members, teams] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { orgId },
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
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto w-full max-w-2xl px-4 pt-10 pb-20">
        {/* Back link */}
        <Link
          href={`/org/${orgId}?tab=campaigns`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-body transition-colors hover:text-[var(--color-accent-primary-strong)]"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
          {tf("org.campaign.backWithName", locale, { orgName: org.name })}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <SectionEyebrow>
            {t("org.campaign.newEyebrow", locale)}
          </SectionEyebrow>
          <h1 className="mt-1 font-fraunces text-3xl text-ink">
            {t("org.campaign.newTitle", locale)}
          </h1>
        </div>

        <CampaignWizard
          orgId={orgId}
          members={serializedMembers}
          teams={serializedTeams}
          preselectedTeamId={preselectedTeamId ?? null}
          locale={locale}
        />
      </main>
    </div>
  );
}
