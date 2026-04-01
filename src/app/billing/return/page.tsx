import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/candidate-credits";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";
import { resolveBillingReturnResolution } from "@/lib/billing/return-resolution";
import { getServerAuth } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return { title: t("billing.returnMetaTitle", locale), robots: { index: false } };
}

type BillingReturnRuntime = {
  stripe: typeof stripe;
  auth: typeof getServerAuth;
  prisma: typeof prisma;
  addCredits: typeof addCredits;
  resolveJourneyFallbackForProfileId: typeof resolveJourneyFallbackForProfileId;
  redirect: typeof redirect;
  getServerLocale: typeof getServerLocale;
};

const defaultBillingReturnRuntime: BillingReturnRuntime = {
  stripe,
  auth: getServerAuth,
  prisma,
  addCredits,
  resolveJourneyFallbackForProfileId,
  redirect,
  getServerLocale,
};

function getBillingReturnRuntime(): BillingReturnRuntime {
  const overrides = (
    globalThis as {
      __TRITA_BILLING_RETURN_RUNTIME__?: Partial<BillingReturnRuntime>;
    }
  ).__TRITA_BILLING_RETURN_RUNTIME__;
  return { ...defaultBillingReturnRuntime, ...(overrides ?? {}) };
}

export default async function ReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; addon?: string }>;
}) {
  const runtime = getBillingReturnRuntime();
  const [locale, params, { userId }] = await Promise.all([
    runtime.getServerLocale(),
    searchParams,
    runtime.auth(),
  ]);
  const resolution = await resolveBillingReturnResolution(
    {
      sessionId: params.session_id,
      addon: params.addon,
      userId,
    },
    {
      findProfileByClerkId: async (clerkId) =>
        runtime.prisma.userProfile.findUnique({
          where: { clerkId },
          select: { id: true },
        }),
      resolveJourneyFallbackForProfileId: runtime.resolveJourneyFallbackForProfileId,
      retrieveSession: runtime.stripe.checkout.sessions.retrieve,
      findCandidateCreditBySession: async (orgId, sessionId) =>
        runtime.prisma.candidateCredit.findFirst({
          where: { orgId, note: { contains: sessionId } },
          select: { id: true },
        }),
      addCredits: runtime.addCredits,
    },
  );

  if (resolution.kind === "redirect") {
    runtime.redirect(resolution.destination);
  }

  if (resolution.kind === "complete") {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(26,92,58,0.08)]">
            <span className="text-3xl text-sage">✓</span>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-2">
            {"// "}
            {t("billing.returnSuccessEyebrow", locale)}
          </p>
          <h1 className="font-fraunces text-2xl text-ink mb-3">
            {t("billing.returnSuccessTitle", locale)}
          </h1>
          <p className="text-sm text-ink-warm mb-6">
            {resolution.candidateAddonApplied
              ? t("billing.returnCandidateBody", locale)
              : t("billing.returnSubBody", locale)}
          </p>
          <Link
            href={resolution.handoffDestination}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-6 text-sm font-semibold text-white hover:bg-sage-dark transition"
          >
            {t("billing.returnSubCta", locale)}
          </Link>
        </div>
      </div>
    );
  }

  // Expired or unknown state
  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center">
      <div className="max-w-md text-center px-6">
        <h1 className="font-fraunces text-2xl text-ink mb-3">
          {t("billing.returnExpiredTitle", locale)}
        </h1>
        <p className="text-sm text-ink-warm mb-6">
          {t("billing.returnExpiredBody", locale)}
        </p>
        <Link
          href="/billing/checkout"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-6 text-sm font-semibold text-white hover:bg-sage-dark transition"
        >
          {t("billing.returnExpiredCta", locale)}
        </Link>
      </div>
    </div>
  );
}
