import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { BelbinClient } from "./BelbinClient";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function BelbinAssessmentPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      orgMemberships: { select: { id: true }, take: 1 },
      teamMemberships: { select: { id: true }, take: 1 },
    },
  });
  if (!profile) redirect("/sign-in");

  const isTeamUser =
    profile.orgMemberships.length > 0 || profile.teamMemberships.length > 0;

  // Non-team users skip directly to journey home handoff.
  if (!isTeamUser) redirect(JOURNEY_HOME_HANDOFF_PATH);

  return (
    <main className="min-h-dvh bg-cream">
      <BelbinClient locale={locale as Locale} />
    </main>
  );
}
