import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { requireOrgRole } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import {
  getOrgSubscription,
  trialDaysLeft as calcTrialDaysLeft,
  getPlanTier,
  PLAN_SEAT_LIMITS,
  calculateExtraSeats,
} from "@/lib/subscription";
import { OrgRenameForm } from "@/components/org/OrgRenameForm";
import { OrgDeactivateButton } from "@/components/org/OrgDeactivateButton";
import { OrgMemberRoleEditor } from "@/components/org/OrgMemberRoleEditor";
import { BillingPortalButton } from "@/components/org/BillingPortalButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Szervezet beállítások | Trita", robots: { index: false } };
}

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id: orgId }] = await Promise.all([getServerLocale(), params]);

  const { profileId, org } = await requireOrgRole(orgId, "ORG_ADMIN");
  await requireActiveSubscription();
  const isHu = locale !== "en";

  const [members, sub, memberCount, pendingCount] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { orgId },
      orderBy: { joinedAt: "asc" },
      select: {
        userId: true,
        role: true,
        user: { select: { id: true, email: true, username: true } },
      },
    }),
    getOrgSubscription(orgId),
    prisma.organizationMember.count({ where: { orgId } }),
    prisma.organizationPendingInvite.count({ where: { orgId } }),
  ]);

  const daysLeft = calcTrialDaysLeft(sub);
  const subStatus = sub?.status ?? "none";
  const tier = getPlanTier(sub);
  const includedSeats = PLAN_SEAT_LIMITS[tier];
  const extraSeats = calculateExtraSeats(sub, memberCount);
  const trialEnd = sub?.trialEndsAt?.toISOString() ?? null;

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">

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
            <p className="font-mono text-xs uppercase tracking-widest text-bronze">
              {t("org.settings.eyebrow", locale)}
            </p>
            <h1 className="font-fraunces text-3xl text-ink md:text-4xl">
              {org.name}
            </h1>
          </div>
        </div>

        {/* Org name */}
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-1">
            {t("org.settings.orgNameEyebrow", locale)}
          </p>
          <h2 className="font-fraunces text-xl text-ink mb-5">
            {t("org.settings.orgNameTitle", locale)}
          </h2>
          <OrgRenameForm orgId={orgId} currentName={org.name} locale={locale} />
        </section>

        {/* Előfizetés */}
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-1">
            {t("org.settings.subscriptionEyebrow", locale)}
          </p>
          <h2 className="font-fraunces text-xl text-ink mb-5">
            {t("org.settings.subscriptionTitle", locale)}
          </h2>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    subStatus === "active"
                      ? "bg-[rgba(26,92,58,0.08)] text-sage"
                      : subStatus === "trialing"
                      ? "bg-[rgba(200,65,10,0.08)] text-bronze"
                      : "bg-sand text-ink-body"
                  }`}
                >
                  {subStatus === "active"
                    ? t("org.settings.statusActive", locale)
                    : subStatus === "trialing"
                    ? "Trial"
                    : subStatus === "past_due"
                    ? t("org.settings.statusPastDue", locale)
                    : subStatus === "canceled"
                    ? t("org.settings.statusCanceled", locale)
                    : t("org.settings.statusNone", locale)}
                </span>
                {subStatus === "trialing" && trialEnd && (
                  <span className="text-xs text-ink-warm">
                    {daysLeft !== null && daysLeft > 0
                      ? tf("org.settings.trialDaysLeft", locale, { days: daysLeft })
                      : t("org.settings.trialExpiresToday", locale)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">
                {subStatus === "active"
                  ? t("org.settings.accessActive", locale)
                  : subStatus === "trialing"
                  ? t("org.settings.trialInfo", locale)
                  : t("org.settings.activatePrompt", locale)}
              </p>
            </div>

            <div className="flex flex-shrink-0 gap-2">
              {(subStatus === "trialing" || subStatus === "none") && (
                <a
                  href="/billing/checkout?plan=org_monthly"
                  className="inline-flex min-h-[40px] items-center rounded-lg bg-sage px-4 text-xs font-semibold text-white hover:bg-sage-dark transition-colors"
                >
                  {t("org.settings.activateBtn", locale)}
                </a>
              )}
              {(subStatus === "active" || subStatus === "past_due") && (
                <BillingPortalButton isHu={isHu} />
              )}
              {subStatus === "canceled" && (
                <a
                  href="/billing/checkout?plan=org_monthly"
                  className="inline-flex min-h-[40px] items-center rounded-lg border border-sage px-4 text-xs font-semibold text-bronze hover:bg-sage-soft transition-colors"
                >
                  {t("org.settings.reactivateBtn", locale)}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Seat info — team / org plans only */}
        {tier !== "scale" && tier !== "none" && includedSeats !== Infinity && (
          <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-1">
              {t("org.settings.seatsEyebrow", locale)}
            </p>
            <h2 className="font-fraunces text-xl text-ink mb-5">
              {t("org.settings.seatsTitle", locale)}
            </h2>

            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-fraunces text-3xl text-ink">
                    {memberCount}
                  </span>
                  <span className="text-sm text-ink-body">
                    / {includedSeats} {t("org.settings.includedSeats", locale)}
                  </span>
                </div>

                <div className="h-2 w-full max-w-xs rounded-full bg-sand overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${
                      memberCount > includedSeats ? "bg-sage" : "bg-sage"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((memberCount / includedSeats) * 100))}%`,
                    }}
                  />
                </div>

                {extraSeats > 0 ? (
                  <p className="text-sm text-bronze">
                    {tf("org.settings.extraSeatsInfo", locale, { extra: extraSeats, plural: extraSeats !== 1 && locale === "en" ? "s" : "" })}
                  </p>
                ) : (
                  <p className="text-sm text-ink-body">
                    {tf("org.settings.seatsAvailable", locale, { available: includedSeats - memberCount, plural: (includedSeats - memberCount) !== 1 && locale === "en" ? "s" : "" })}
                  </p>
                )}

                {pendingCount > 0 && (
                  <p className="text-xs text-muted mt-1">
                    {tf("org.settings.pendingInvites", locale, { count: pendingCount, plural: pendingCount !== 1 && locale === "en" ? "s" : "" })}
                  </p>
                )}
              </div>

              {/* Upgrade hint for team plan near limit */}
              {tier === "team" && memberCount >= includedSeats - 2 && (
                <div className="shrink-0 rounded-xl border border-sand bg-cream p-4 text-xs max-w-[200px]">
                  <p className="font-semibold text-ink mb-1">
                    {t("org.settings.needMoreSeats", locale)}
                  </p>
                  <p className="text-ink-body mb-2">
                    {t("org.settings.upgradeHint", locale)}
                  </p>
                  <a
                    href="/billing/checkout?plan=org_monthly"
                    className="font-semibold text-bronze hover:underline"
                  >
                    {t("org.settings.upgradeLink", locale)}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Member roles */}
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-1">
            {t("org.settings.rolesEyebrow", locale)}
          </p>
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
                <OrgMemberRoleEditor
                  orgId={orgId}
                  userId={m.userId}
                  currentRole={m.role}
                  isSelf={m.userId === profileId}
                  locale={locale}
                />
              </div>
            ))}
          </div>
        </section>

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
          {org.status === "INACTIVE" ? (
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
