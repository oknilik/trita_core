import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/lib/auth-server";
import { getServerLocale } from "@/lib/i18n-server";
import { isConsultingLed } from "@/lib/operating-mode";
import { NewClientOrgForm } from "@/components/org/NewClientOrgForm";
import { EditorialBackHeader } from "@/components/ui/primitives/EditorialBackHeader";
import { isPlatformAdminEmail } from "@/lib/measurement-auth";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Új ügyfél-szervezet | trita", robots: { index: false } };
}

// Tanácsadói ügyfél-org létrehozás — csak consulting-led módban, csak
// kijelölt tanácsadónak. Self-serve váltásnál (operating-mode) eltűnik.
export default async function NewClientOrgPage() {
  if (!isConsultingLed()) notFound();

  const [locale, { userId }] = await Promise.all([getServerLocale(), getServerAuth()]);
  if (!userId) return redirectToSignIn();

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return redirectToSignIn();

  // Org-ot a platform-admin, a platform-tanácsadó vagy egy már kiosztott
  // ORG_CONSULTANT hozhat létre.
  const consultantMembership = await prisma.organizationMember.findFirst({
    where: { userId: profile.id, role: "ORG_CONSULTANT", leftAt: null },
    select: { id: true },
  });
  const canCreateOrg =
    profile.isConsultant ||
    isPlatformAdminEmail(profile.email) ||
    Boolean(consultantMembership);
  if (!canCreateOrg) notFound();

  const isHu = locale !== "en";

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto w-full max-w-xl px-4 pt-10 pb-20">
        <EditorialBackHeader
          href="/dashboard"
          backLabel={isHu ? "Vissza a vezérlőre" : "Back to dashboard"}
          eyebrow={isHu ? "tanácsadói felület" : "consultant workspace"}
          title={isHu ? "Új ügyfél-szervezet" : "New client organization"}
          description={
            isHu
              ? "A szervezetbe tanácsadóként lépsz be. Ezután te hívod meg a tagokat, sorolod őket csapatokba és indítod a méréseket — az ügyfél admin később is csatlakozhat."
              : "You join the organization as its consultant. You then invite members, assign them to teams and launch measurements — the client admin can join later."
          }
          className="mb-8"
        />

        <NewClientOrgForm isHu={isHu} />
      </main>
    </div>
  );
}
