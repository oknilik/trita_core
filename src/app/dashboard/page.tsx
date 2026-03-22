import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (profile) {
    const orgMembership = await prisma.organizationMember.findUnique({
      where: { userId: profile.id },
      select: { role: true },
    });

    if (orgMembership && hasOrgRole(orgMembership.role, "ORG_MANAGER")) {
      const isAdmin = hasOrgRole(orgMembership.role, "ORG_ADMIN");
      return <AdminDashboard isAdmin={isAdmin} />;
    }
  }

  const params = await searchParams;
  const query = new URLSearchParams();
  if (params?.tab) query.set("tab", String(params.tab));
  if (params?.retake) query.set("retake", String(params.retake));
  const qs = query.toString();
  redirect(`/profile/results${qs ? `?${qs}` : ""}`);
}
