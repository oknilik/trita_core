import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
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
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">

        <div>
          <Link
            href={`/org/${orgId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a35] hover:text-[#c8410a] mb-6 transition-colors"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {isHu ? "Vissza a szervezethez" : "Back to organization"}
          </Link>

          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
              {isHu ? "// beállítások" : "// settings"}
            </p>
            <h1 className="font-playfair text-3xl text-[#1a1814] md:text-4xl">
              {org.name}
            </h1>
          </div>
        </div>

        {/* Org name */}
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// szervezet neve" : "// organization name"}
          </p>
          <h2 className="font-playfair text-xl text-[#1a1814] mb-5">
            {isHu ? "Szervezet neve" : "Organization name"}
          </h2>
          <OrgRenameForm orgId={orgId} currentName={org.name} locale={locale} />
        </section>

        {/* Előfizetés */}
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// előfizetés" : "// subscription"}
          </p>
          <h2 className="font-playfair text-xl text-[#1a1814] mb-5">
            {isHu ? "Előfizetés" : "Subscription"}
          </h2>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    subStatus === "active"
                      ? "bg-[rgba(26,92,58,0.08)] text-[#1a5c3a]"
                      : subStatus === "trialing"
                      ? "bg-[rgba(200,65,10,0.08)] text-[#c8410a]"
                      : "bg-[#e8e4dc] text-[#5a5650]"
                  }`}
                >
                  {subStatus === "active"
                    ? isHu ? "Aktív" : "Active"
                    : subStatus === "trialing"
                    ? "Trial"
                    : subStatus === "past_due"
                    ? isHu ? "Fizetési hiba" : "Past due"
                    : subStatus === "canceled"
                    ? isHu ? "Lemondva" : "Canceled"
                    : isHu ? "Nincs előfizetés" : "No subscription"}
                </span>
                {subStatus === "trialing" && trialEnd && (
                  <span className="text-xs text-[#7a756e]">
                    {daysLeft !== null && daysLeft > 0
                      ? isHu
                        ? `${daysLeft} nap van hátra`
                        : `${daysLeft} days left`
                      : isHu
                      ? "Ma jár le"
                      : "Expires today"}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a09a90]">
                {subStatus === "active"
                  ? isHu
                    ? "A hozzáférés aktív."
                    : "Access is active."
                  : subStatus === "trialing"
                  ? isHu
                    ? "14 napos próbaidőszak – kártyaadat nélkül."
                    : "14-day trial – no credit card required."
                  : isHu
                  ? "Az előfizetés aktiválásához kattints az alábbi gombra."
                  : "Activate your subscription using the button below."}
              </p>
            </div>

            <div className="flex flex-shrink-0 gap-2">
              {(subStatus === "trialing" || subStatus === "none") && (
                <a
                  href="/billing/checkout?plan=org_monthly"
                  className="inline-flex min-h-[40px] items-center rounded-lg bg-[#c8410a] px-4 text-xs font-semibold text-white hover:bg-[#a33408] transition-colors"
                >
                  {isHu ? "Aktiválás →" : "Activate →"}
                </a>
              )}
              {(subStatus === "active" || subStatus === "past_due") && (
                <BillingPortalButton isHu={isHu} />
              )}
              {subStatus === "canceled" && (
                <a
                  href="/billing/checkout?plan=org_monthly"
                  className="inline-flex min-h-[40px] items-center rounded-lg border border-[#c8410a] px-4 text-xs font-semibold text-[#c8410a] hover:bg-[#fef3ec] transition-colors"
                >
                  {isHu ? "Újraaktiválás" : "Reactivate"}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Seat info — team / org plans only */}
        {tier !== "scale" && tier !== "none" && includedSeats !== Infinity && (
          <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
              {isHu ? "// létszám" : "// seats"}
            </p>
            <h2 className="font-playfair text-xl text-[#1a1814] mb-5">
              {isHu ? "Aktív helyek" : "Active seats"}
            </h2>

            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-playfair text-3xl text-[#1a1814]">
                    {memberCount}
                  </span>
                  <span className="text-sm text-[#5a5650]">
                    / {includedSeats} {isHu ? "alap hely" : "included seats"}
                  </span>
                </div>

                <div className="h-2 w-full max-w-xs rounded-full bg-[#e8e4dc] overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${
                      memberCount > includedSeats ? "bg-[#c8410a]" : "bg-[#1a5c3a]"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((memberCount / includedSeats) * 100))}%`,
                    }}
                  />
                </div>

                {extraSeats > 0 ? (
                  <p className="text-sm text-[#c8410a]">
                    {isHu
                      ? `+${extraSeats} extra hely · ${extraSeats} × €19/hó a következő számlán`
                      : `+${extraSeats} extra seat${extraSeats !== 1 ? "s" : ""} · ${extraSeats} × €19/mo on next invoice`}
                  </p>
                ) : (
                  <p className="text-sm text-[#5a5650]">
                    {isHu
                      ? `${includedSeats - memberCount} hely elérhető`
                      : `${includedSeats - memberCount} seat${includedSeats - memberCount !== 1 ? "s" : ""} available`}
                  </p>
                )}

                {pendingCount > 0 && (
                  <p className="text-xs text-[#a09a90] mt-1">
                    {isHu
                      ? `+${pendingCount} meghívás függőben`
                      : `+${pendingCount} invitation${pendingCount !== 1 ? "s" : ""} pending`}
                  </p>
                )}
              </div>

              {/* Upgrade hint for team plan near limit */}
              {tier === "team" && memberCount >= includedSeats - 2 && (
                <div className="shrink-0 rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-4 text-xs max-w-[200px]">
                  <p className="font-semibold text-[#1a1814] mb-1">
                    {isHu ? "Több hely kell?" : "Need more seats?"}
                  </p>
                  <p className="text-[#5a5650] mb-2">
                    {isHu
                      ? "Az Org csomag 40 helyet tartalmaz €149/hó áron."
                      : "The Org plan includes 40 seats for €149/mo."}
                  </p>
                  <a
                    href="/billing/checkout?plan=org_monthly"
                    className="font-semibold text-[#c8410a] hover:underline"
                  >
                    {isHu ? "Upgrade →" : "Upgrade →"}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Member roles */}
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// szerepkörök" : "// roles"}
          </p>
          <h2 className="font-playfair text-xl text-[#1a1814] mb-5">
            {isHu ? "Tagok szerepkörei" : "Member roles"}
          </h2>
          <div className="flex flex-col divide-y divide-[#e8e4dc]">
            {members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1a1814]">
                    {m.user.username ?? m.user.email ?? "—"}
                  </p>
                  {m.user.username && (
                    <p className="truncate text-xs text-[#3d3a35]/60">{m.user.email}</p>
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
            {isHu ? "// veszélyes zóna" : "// danger zone"}
          </p>
          <h2 className="font-playfair text-xl text-rose-900 mb-4">
            {isHu ? "Veszélyes zóna" : "Danger zone"}
          </h2>
          <p className="mb-4 text-sm text-rose-700">
            {isHu
              ? "A szervezet deaktiválása után tagjai nem tudnak bejelentkezni az org-hoz kötött felületekre."
              : "Deactivating the organization will block members from accessing org-scoped pages."}
          </p>
          {org.status === "INACTIVE" ? (
            <p className="text-sm font-semibold text-rose-800">
              {isHu ? "A szervezet már inaktív." : "Organization is already inactive."}
            </p>
          ) : (
            <OrgDeactivateButton orgId={orgId} locale={locale} />
          )}
        </section>

      </main>
    </div>
  );
}
