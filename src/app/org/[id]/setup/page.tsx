import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOrgRole } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { getServerLocale } from "@/lib/i18n-server";
import { OrgSetupWizard } from "@/components/org/OrgSetupWizard";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Szervezet beállítása | Trita", robots: { index: false } };
}

export default async function OrgSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id: orgId }] = await Promise.all([getServerLocale(), params]);

  const { org } = await requireOrgRole(orgId, "ORG_ADMIN");
  await requireActiveSubscription();

  // If already active, redirect to org detail
  if (org.status === "ACTIVE") {
    redirect(`/org/${orgId}`);
  }

  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center px-4 py-10">
      <OrgSetupWizard orgId={orgId} orgName={org.name} locale={locale} />
    </div>
  );
}
