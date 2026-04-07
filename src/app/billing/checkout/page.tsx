import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { getActiveOrgMembership } from "@/lib/org-context";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { getServerAuth } from "@/lib/auth-server";
import { EmbeddedCheckoutClient } from "./EmbeddedCheckoutClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return { title: t("billing.checkoutMetaTitle", locale), robots: { index: false } };
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; qty?: string; tier?: string; teamId?: string }>;
}) {
  const [locale, { userId }, params] = await Promise.all([
    getServerLocale(),
    getServerAuth(),
    searchParams,
  ]);

  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  // One-time purchase mode (tier param) — no org requirement for self_plus
  const isOneTimePurchase = !!params.tier;
  const isSelfTier = params.tier === "self_plus";

  if (!isOneTimePurchase) {
    // Subscription checkout requires ORG_ADMIN
    const membership = await getActiveOrgMembership(profile.id);
    if (!membership || !hasOrgRole(membership.role, "ORG_ADMIN")) {
      redirect(JOURNEY_HOME_HANDOFF_PATH);
    }
  }

  const priceKey = params.plan ?? "org_monthly";
  const quantity = params.qty ? Math.max(1, parseInt(params.qty, 10) || 1) : undefined;

  const isHu = locale !== "en";
  const eyebrow = isOneTimePurchase
    ? (isHu ? "vásárlás" : "purchase")
    : t("billing.checkoutEyebrow", locale);
  const title = isOneTimePurchase
    ? (isHu ? "Biztonságos fizetés" : "Secure checkout")
    : t("billing.checkoutTitle", locale);

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze">
          {"// "}
          {eyebrow}
        </p>
        <h1 className="mt-1 font-fraunces text-3xl text-ink mb-2">
          {title}
        </h1>
        <p className="text-sm text-ink-warm mb-8">
          {t("billing.checkoutSubtitle", locale)}
        </p>

        <EmbeddedCheckoutClient
          priceKey={isOneTimePurchase ? undefined : priceKey}
          quantity={quantity}
          tier={params.tier}
          teamId={params.teamId}
          locale={locale}
        />
      </main>
    </div>
  );
}
