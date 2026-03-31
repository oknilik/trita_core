import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { getJourneySnapshotForProfileId } from "@/lib/journey/service";
import { getActiveOrgMembership } from "@/lib/org-context";
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
  if (!profile) redirect("/sign-in");

  const [orgMembership, journeySnapshot] = await Promise.all([
    getActiveOrgMembership(profile.id),
    getJourneySnapshotForProfileId(profile.id),
  ]);

  if (orgMembership && hasOrgRole(orgMembership.role, "ORG_MANAGER")) {
    return <AdminDashboard />;
  }

  const journey = journeySnapshot.state;
  if (
    journey.currentStage === "SELF_NOT_STARTED" ||
    journey.currentStage === "SELF_IN_PROGRESS"
  ) {
    redirect("/assessment");
  }

  const params = await searchParams;
  const query = new URLSearchParams();
  if (params?.tab) query.set("tab", String(params.tab));
  if (params?.retake) query.set("retake", String(params.retake));
  const qs = query.toString();
  redirect(`/profile/results${qs ? `?${qs}` : ""}`);
}
