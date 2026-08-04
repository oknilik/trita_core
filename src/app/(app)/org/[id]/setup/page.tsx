import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireOrgRole } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n-server";
import { OrgSetupWizard } from "@/components/org/OrgSetupWizard";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import {
  isPolicyReadOnly,
  resolveOrgPolicySnapshot,
  toOrgSubscriptionBannerState,
} from "@/lib/policy-service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Szervezet beállítása | trita", robots: { index: false } };
}

export default async function OrgSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id: orgId }] = await Promise.all([getServerLocale(), params]);

  const { org, role } = await requireOrgRole(orgId, "ORG_ADMIN");
  const policySnapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: role,
  });
  const bannerState = toOrgSubscriptionBannerState(policySnapshot.policy.policyState);

  // If already active, redirect to org detail
  if (org.status === "ACTIVE") {
    redirect(`/org/${orgId}`);
  }

  if (isPolicyReadOnly(policySnapshot.policy.policyState) && bannerState) {
    const isHu = locale !== "en";
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl space-y-5">
          <OrgSubscriptionBanner state={bannerState} locale={locale} />
          <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
            <h1 className="font-fraunces text-2xl text-ink">
              {isHu ? "A setup ideiglenesen szünetel" : "Setup is temporarily paused"}
            </h1>
            <p className="mt-2 text-sm text-ink-body">
              {isHu
                ? "Az org aktiválási lépések reaktiválás után folytathatók."
                : "Organization activation steps can continue after subscription reactivation."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center px-4 py-10">
      <OrgSetupWizard orgId={orgId} orgName={org.name} locale={locale} />
    </div>
  );
}
