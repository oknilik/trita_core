import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext } from "@/lib/auth";
import { canViewMemberDossier } from "@/lib/measurement-auth";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";
import { buildMemberDossier } from "@/lib/member-dossier.server";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { MemberDossierView } from "@/components/org/MemberDossierView";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Tag-dossié | trita" : "Member dossier | trita",
    robots: { index: false },
  };
}

export default async function MemberDossierPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const [locale, { id: orgId, userId: targetUserId }] = await Promise.all([
    getServerLocale(),
    params,
  ]);

  const { profileId, role: memberRole, org } = await requireOrgContext(orgId);
  if (!org) notFound();

  // Kőbe vésett hozzáférés: csak org admin + tanácsadói kör. A guard env-t
  // olvas (ADMIN_EMAILS) → szerver-oldal.
  const viewer = await prisma.userProfile.findUnique({
    where: { id: profileId },
    select: { email: true, isConsultant: true },
  });
  if (!canViewMemberDossier(memberRole, viewer?.email, viewer?.isConsultant)) {
    redirect(await resolveJourneyFallbackForProfileId(profileId));
  }

  const dossier = await buildMemberDossier(orgId, targetUserId);
  if (!dossier) notFound();

  const isHu = locale !== "en";

  return (
    <PlatformPageShell surface="org" contentClassName="max-w-4xl gap-6 px-4 py-8">
      <div>
        <Link
          href={`/org/${orgId}?tab=members`}
          className="inline-flex items-center gap-1.5 text-caption font-medium text-muted transition-colors hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          {isHu ? "Vissza a tagokhoz" : "Back to members"}
        </Link>
        <SectionEyebrow variant="clean" tone="org" className="mt-4">
          {isHu ? "tag-dossié · bizalmas" : "member dossier · confidential"}
        </SectionEyebrow>
      </div>

      <MemberDossierView dossier={dossier} orgId={orgId} isHu={isHu} />
    </PlatformPageShell>
  );
}
