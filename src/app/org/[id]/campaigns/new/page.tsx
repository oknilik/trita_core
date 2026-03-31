import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { getOrgSubscription, getSubscriptionState } from "@/lib/subscription";
import { CampaignWizard } from "@/components/campaign/CampaignWizard";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";

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
  if (!org) notFound();
  const subscription = await getOrgSubscription(orgId);
  const subscriptionState = getSubscriptionState(subscription);
  if (subscriptionState === "none") redirect("/billing/upgrade");

  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  if (!isManager) notFound();
  const isReadOnly = subscriptionState === "restricted" || subscriptionState === "frozen";

  const isHu = locale !== "en"; // kept for server-rendered text on this page

  if (isReadOnly) {
    return (
      <div className="min-h-dvh bg-cream">
        <main className="mx-auto w-full max-w-2xl px-4 py-10">
          <OrgSubscriptionBanner
            state={subscriptionState === "frozen" ? "frozen" : "restricted"}
            locale={locale}
          />
          <div className="mt-6 rounded-2xl border border-sand bg-white p-6 shadow-sm">
            <h1 className="font-fraunces text-2xl text-ink">
              {isHu ? "Új kampány jelenleg nem indítható" : "New campaign is currently disabled"}
            </h1>
            <p className="mt-2 text-sm text-ink-body">
              {isHu
                ? "A kampányindítás reaktiválás után lesz újra elérhető. Addig a meglévő adatok csak olvasható módban látszanak."
                : "Campaign creation will be available again after reactivation. Existing data remains visible in read-only mode."}
            </p>
            <div className="mt-4">
              <Link
                href={`/org/${orgId}?tab=campaigns`}
                className="inline-flex min-h-[42px] items-center rounded-lg border border-sand px-4 text-sm font-semibold text-ink-body transition hover:bg-cream"
              >
                {isHu ? "Vissza a kampányokhoz" : "Back to campaigns"}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
          {tf("org.campaign.backWithName", locale, { orgName: org.name })}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze">
            {t("org.campaign.newEyebrow", locale)}
          </p>
          <h1 className="mt-1 font-fraunces text-3xl text-ink">
            {t("org.campaign.newTitle", locale)}
          </h1>
        </div>

        <CampaignWizard
          orgId={orgId}
          members={serializedMembers}
          locale={locale}
        />
      </main>
    </div>
  );
}
