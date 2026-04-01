import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveJourney } from "@/lib/journey/engine";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/dashboard";
  const entryPoint = pathname.startsWith("/platform/home")
    ? "platform_home_page"
    : "dashboard_page";

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const journey = await resolveJourney(profile.id, { entryPoint });
  if (journey.destination === "/dashboard") {
    return <AdminDashboard />;
  }

  let destination = journey.destination;
  if (destination.startsWith("/profile/results")) {
    // Legacy `/dashboard?...` entrypoints may still carry self-profile params.
    // Keep forwarding these to avoid breaking retake modal/deep-link flows.
    const params = await searchParams;
    const query = new URLSearchParams();
    if (params?.tab) query.set("tab", String(params.tab));
    if (params?.retake) query.set("retake", String(params.retake));
    const qs = query.toString();
    destination = `/profile/results${qs ? `?${qs}` : ""}`;
  }

  redirect(destination);
}
