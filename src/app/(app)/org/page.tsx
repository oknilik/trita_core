import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/lib/auth-server";
import { getActiveOrgMembership } from "@/lib/org-context";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";

export const dynamic = "force-dynamic";

export default async function OrgRedirectPage() {
  const { userId } = await getServerAuth();
  if (!userId) return redirectToSignIn();

  await requireOnboardedByClerkId(userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return redirectToSignIn();

  const membership = await getActiveOrgMembership(profile.id);

  if (membership) redirect(`/org/${membership.orgId}`);
  const fallback = await resolveJourneyFallbackForProfileId(profile.id);
  redirect(fallback);
}
