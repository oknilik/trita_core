import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveHomeForProfileId } from "@/lib/journey/home.server";
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

  const homeDecision = await resolveHomeForProfileId(profile.id);
  if (homeDecision.home.destination === "/dashboard") {
    return <AdminDashboard />;
  }

  let destination = homeDecision.home.destination;
  if (destination.startsWith("/profile/results")) {
    const params = await searchParams;
    const query = new URLSearchParams();
    if (params?.tab) query.set("tab", String(params.tab));
    if (params?.retake) query.set("retake", String(params.retake));
    const qs = query.toString();
    destination = `/profile/results${qs ? `?${qs}` : ""}`;
  }

  redirect(destination);
}
