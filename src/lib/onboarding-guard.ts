import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";

/**
 * Védett oldalak kapuja: ha a bejelentkezett usernek még nincs lezárt
 * személyes onboardingja (onboardedAt), MINDIG az /onboarding-ra
 * irányítjuk — kézi URL-beírásnál is. Ott adja meg a nevét, az
 * adatait és a hozzájárulását; az onboarding oldal a kész usereket
 * magától továbbküldi.
 *
 * Kivétel: org-meghívással érkezett tagok — nekik a membership-
 * onboarding a belépési út, van aktív org-tagságuk.
 */
export async function requireOnboarded(profile: {
  id: string;
  onboardedAt: Date | null;
}): Promise<void> {
  if (profile.onboardedAt) return;
  const orgMembership = await getActiveOrgMembership(profile.id);
  if (!orgMembership) redirect("/onboarding");
}

/** Kényelmi változat clerkId-ból, ha az oldal nem tölti be a profilt. */
export async function requireOnboardedByClerkId(clerkId: string): Promise<void> {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId },
    select: { id: true, onboardedAt: true },
  });
  if (!profile) redirect("/onboarding");
  await requireOnboarded(profile);
}
