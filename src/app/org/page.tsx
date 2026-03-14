import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrgRedirectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: { orgId: true },
  });

  if (membership) redirect(`/org/${membership.orgId}`);
  redirect("/dashboard");
}
