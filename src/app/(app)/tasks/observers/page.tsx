import { safeParseProgram } from "@/lib/programs/core";
import {
  resolveOrgCapabilityDecision,
  resolveOrgPolicySnapshot,
} from "@/lib/policy-service";
import { notFound } from "next/navigation";
import { getServerAuth } from "@/lib/auth-server";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";
import { prisma } from "@/lib/prisma";
import { isStepOpenFor } from "@/lib/campaign-steps-core";
import { InvitationsTab } from "@/components/results/InvitationsTab";
export default async function ProgramObservers({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  const { userId } = await getServerAuth();
  if (!userId) return redirectToSignIn();
  const { campaignId } = await searchParams;
  if (!campaignId) notFound();
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) notFound();
  const p = await prisma.campaignParticipant.findUnique({
    where: { campaignId_userId: { campaignId, userId: profile.id } },
    include: { campaign: true },
  });
  if (!p?.campaign.programSnapshot || p.campaign.status !== "ACTIVE")
    notFound();
  const member = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: p.campaign.orgId, userId: profile.id } },
  });
  if (!member || member.leftAt || !isStepOpenFor(p.campaign, p, "OBSERVER_360"))
    notFound();
  const policy = await resolveOrgPolicySnapshot({
    orgId: p.campaign.orgId,
    orgRole: member.role,
  });
  const canInvite = resolveOrgCapabilityDecision(
    policy,
    "observerInvite",
  ).allowed;
  const invitations = await prisma.observerInvitation.findMany({
    where: { campaignId, inviterId: profile.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="font-fraunces text-title">{p.campaign.name}</h1>
      <InvitationsTab
        campaignId={campaignId}
        minForReveal={
          safeParseProgram(p.campaign.programSnapshot)?.policy
            .observerResponsesPerParticipant
        }
        sentInvitations={invitations.map((i) => ({
          id: i.id,
          token: i.token,
          status: i.status,
          createdAt: i.createdAt.toISOString(),
          completedAt: i.completedAt?.toISOString().slice(0, 10) ?? null,
          observerEmail: i.observerEmail,
          observerName: i.observerName,
          observerType: i.observerType,
        }))}
        receivedInvitations={[]}
        isPlus={canInvite}
        hasColleagueDirectory={canInvite && !member.leftAt}
      />
    </main>
  );
}
