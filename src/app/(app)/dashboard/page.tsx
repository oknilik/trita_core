import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveJourney } from "@/lib/journey/engine";
import { resolveStaffDestination } from "@/lib/journey/guardrails.server";
import { getServerAuth } from "@/lib/auth-server";
import { ClientRedirect } from "@/components/navigation/ClientRedirect";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const entryPoint = "dashboard_page";

  const { userId } = await getServerAuth();
  if (!userId) redirect("/sign-in");

  await requireOnboardedByClerkId(userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  // Platform-stáb (admin/tanácsadó): egyből a munkafelületére — nincs teszt-kapu.
  // Kliens-oldali redirect: a page-szintű szerver-redirect() Next 16 alatt
  // "Rendered more hooks" kliens-hibát dob (ld. ClientRedirect komment).
  const staffDestination = await resolveStaffDestination(profile.id);
  if (staffDestination) return <ClientRedirect to={staffDestination} />;

  const journey = await resolveJourney(profile.id, { entryPoint });

  // Safety: never redirect to ourselves (would loop) — fall back to results.
  let destination =
    journey.destination === "/dashboard" ? "/profile/results" : journey.destination;
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

  return <ClientRedirect to={destination} />;
}
