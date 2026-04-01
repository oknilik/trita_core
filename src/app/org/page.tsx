import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";

export const dynamic = "force-dynamic";

export default async function OrgRedirectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const membership = await getActiveOrgMembership(profile.id);

  if (membership) redirect(`/org/${membership.orgId}`);
  const fallback = await resolveJourneyFallbackForProfileId(profile.id);
  redirect(fallback);
}
