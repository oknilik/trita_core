import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { requireOrgRole } from "@/lib/auth";
import {
  resolveOrgPolicySnapshot,
  toOrgSubscriptionBannerState,
} from "@/lib/policy-service";
import { OrgRenameForm } from "@/components/org/OrgRenameForm";
import { OrgDeactivateButton } from "@/components/org/OrgDeactivateButton";
import { OrgMemberRoleEditor } from "@/components/org/OrgMemberRoleEditor";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import { Card } from "@/components/ui/primitives/Card";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Szervezet beállítások | trita", robots: { index: false } };
}

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id: orgId }] = await Promise.all([getServerLocale(), params]);

  const { profileId, role, org } = await requireOrgRole(orgId, "ORG_ADMIN");
  const isHu = locale !== "en";

  const policySnapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: role,
  });

  const members = await prisma.organizationMember.findMany({
    where: { orgId },
    orderBy: { joinedAt: "asc" },
    select: {
      userId: true,
      role: true,
      user: { select: { id: true, email: true, username: true } },
    },
  });

  // Az előfizetés-adatok (státusz, csomag, férőhelyek) nem jelennek meg itt —
  // az előfizetést a platform-admin kezeli (konzultáció-vezérelt működés).
  // A státusz-banner marad: az magyarázza, miért read-only a felület.
  const bannerState = toOrgSubscriptionBannerState(policySnapshot.policy.policyState);
  const isReadOnly = !policySnapshot.policy.capabilities.has("orgAdminManage");

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pt-10 pb-20">

        <div>
          <Link
            href={`/org/${orgId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-body hover:text-bronze mb-6 transition-colors"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {t("org.backToOrg", locale)}
          </Link>

          <div className="flex flex-col gap-1">
            <SectionEyebrow>
              {t("org.settings.eyebrow", locale)}
            </SectionEyebrow>
            <h1 className="font-fraunces text-3xl text-ink md:text-4xl">
              {org.name}
            </h1>
          </div>
        </div>

        {bannerState ? (
          <OrgSubscriptionBanner
            state={bannerState}
            locale={locale}
          />
        ) : null}

        {/* Org name */}
        <Card as="section" spacing="lg" className="md:p-8">
          <SectionEyebrow className="mb-1">
            {t("org.settings.orgNameEyebrow", locale)}
          </SectionEyebrow>
          <h2 className="font-fraunces text-xl text-ink mb-5">
            {t("org.settings.orgNameTitle", locale)}
          </h2>
          {isReadOnly ? (
            <p className="rounded-lg border border-sand bg-cream px-4 py-3 text-sm text-ink-body">
              {isHu
                ? "Read-only módban a szervezet neve nem módosítható."
                : "Organization name changes are disabled in read-only mode."}
            </p>
          ) : (
            <OrgRenameForm orgId={orgId} currentName={org.name} locale={locale} />
          )}
        </Card>

        {/* Member roles */}
        <Card as="section" spacing="lg" className="md:p-8">
          <SectionEyebrow className="mb-1">
            {t("org.settings.rolesEyebrow", locale)}
          </SectionEyebrow>
          <h2 className="font-fraunces text-xl text-ink mb-5">
            {t("org.settings.rolesTitle", locale)}
          </h2>
          <div className="flex flex-col divide-y divide-sand">
            {members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {m.user.username ?? m.user.email ?? "—"}
                  </p>
                  {m.user.username && (
                    <p className="truncate text-xs text-ink-body/60">{m.user.email}</p>
                  )}
                </div>
                {isReadOnly ? (
                  <span className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold text-muted">
                    {m.role}
                  </span>
                ) : (
                  <OrgMemberRoleEditor
                    orgId={orgId}
                    userId={m.userId}
                    currentRole={m.role}
                    isSelf={m.userId === profileId}
                    locale={locale}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Danger zone */}
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-rose-600 mb-1">
            {t("org.settings.dangerEyebrow", locale)}
          </p>
          <h2 className="font-fraunces text-xl text-rose-900 mb-4">
            {t("org.settings.dangerTitle", locale)}
          </h2>
          <p className="mb-4 text-sm text-rose-700">
            {t("org.settings.dangerDescription", locale)}
          </p>
          {isReadOnly ? (
            <p className="text-sm font-semibold text-rose-800">
              {isHu
                ? "Read-only módban a szervezet státusza nem módosítható."
                : "Organization status changes are disabled in read-only mode."}
            </p>
          ) : org.status === "INACTIVE" ? (
            <p className="text-sm font-semibold text-rose-800">
              {t("org.settings.alreadyInactive", locale)}
            </p>
          ) : (
            <OrgDeactivateButton orgId={orgId} locale={locale} />
          )}
        </section>

      </main>
    </div>
  );
}
