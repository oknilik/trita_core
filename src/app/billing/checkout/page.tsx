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
  searchParams: Promise<{ plan?: string; qty?: string }>;
}) {
  const [locale, { userId }, { plan, qty }] = await Promise.all([
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

  const membership = await getActiveOrgMembership(profile.id);
  if (!membership || !hasOrgRole(membership.role, "ORG_ADMIN")) {
    redirect(JOURNEY_HOME_HANDOFF_PATH);
  }

  const priceKey = plan ?? "org_monthly";
  const quantity = qty ? Math.max(1, parseInt(qty, 10) || 1) : undefined;

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze">
          {"// "}
          {t("billing.checkoutEyebrow", locale)}
        </p>
        <h1 className="mt-1 font-fraunces text-3xl text-ink mb-2">
          {t("billing.checkoutTitle", locale)}
        </h1>
        <p className="text-sm text-ink-warm mb-8">
          {t("billing.checkoutSubtitle", locale)}
        </p>

        <EmbeddedCheckoutClient priceKey={priceKey} quantity={quantity} />
      </main>
    </div>
  );
}
