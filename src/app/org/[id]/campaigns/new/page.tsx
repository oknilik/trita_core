import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { CampaignWizard } from "@/components/campaign/CampaignWizard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Új kampány | Trita", robots: { index: false } };
}

export default async function NewCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id: orgId }] = await Promise.all([getServerLocale(), params]);

  const { role: memberRole, org } = await requireOrgContext(orgId);
  await requireActiveSubscription();

  if (!org) notFound();

  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  if (!isManager) notFound();

  const isHu = locale !== "en";

  const members = await prisma.organizationMember.findMany({
    where: { orgId },
    orderBy: { joinedAt: "asc" },
    select: {
      userId: true,
      user: { select: { username: true, email: true } },
    },
  });

  const serializedMembers = members.map((m) => ({
    userId: m.userId,
    displayName: m.user.username ?? m.user.email ?? m.userId,
  }));

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        {/* Back link */}
        <Link
          href={`/org/${orgId}?tab=campaigns`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-body transition-colors hover:text-bronze"
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
          {isHu ? `Vissza · ${org.name}` : `Back · ${org.name}`}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze">
            {isHu ? "// új kampány" : "// new campaign"}
          </p>
          <h1 className="mt-1 font-fraunces text-3xl text-ink">
            {isHu ? "Kampány létrehozása" : "Create campaign"}
          </h1>
        </div>

        <CampaignWizard
          orgId={orgId}
          members={serializedMembers}
          isHu={isHu}
        />
      </main>
    </div>
  );
}
