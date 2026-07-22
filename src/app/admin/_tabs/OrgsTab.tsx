import { prisma } from "@/lib/prisma";
import { AdminOrgAccessSection } from "@/app/admin/_components/AdminOrgAccessSection";
import { sanitizeOrgBillingProfile } from "@/lib/org-billing";

// Szervezetek fül — kézi hozzáférés-kiosztás (consulting mode)
export async function OrgsTab() {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      billingProfile: true,
      createdAt: true,
      _count: { select: { members: { where: { role: { not: "ORG_CONSULTANT" } } } } },
      subscription: {
        select: {
          status: true,
          planType: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          candidateCredits: true,
        },
      },
      members: {
        where: { role: "ORG_CONSULTANT" },
        select: {
          userId: true,
          user: { select: { email: true, username: true } },
        },
      },
    },
  });

  return (
    <AdminOrgAccessSection
      orgs={orgs.map((org) => ({
        id: org.id,
        name: org.name,
        status: org.status,
        billingProfile: sanitizeOrgBillingProfile(org.billingProfile),
        createdAt: org.createdAt.toISOString(),
        memberCount: org._count.members,
        consultants: org.members.map((m) => ({
          userId: m.userId,
          email: m.user.email,
          username: m.user.username,
        })),
        subscription: org.subscription
          ? {
              status: org.subscription.status,
              planType: org.subscription.planType,
              trialEndsAt: org.subscription.trialEndsAt?.toISOString() ?? null,
              currentPeriodEnd:
                org.subscription.currentPeriodEnd?.toISOString() ?? null,
              candidateCredits: org.subscription.candidateCredits,
            }
          : null,
      }))}
    />
  );
}
