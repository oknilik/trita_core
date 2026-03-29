import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/candidate-credits";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return { title: t("billing.returnMetaTitle", locale), robots: { index: false } };
}

const CREDIT_LABELS: Record<number, string> = {
  1: "1× jelölt értékelés",
  5: "5× jelölt értékelés",
  10: "10× jelölt értékelés",
};

export default async function ReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; addon?: string }>;
}) {
  const [locale, params] = await Promise.all([getServerLocale(), searchParams]);
  const sessionId = params.session_id;
  const addon = params.addon;

  if (!sessionId) redirect("/dashboard");

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    redirect("/dashboard");
  }

  if (session.status === "open") {
    redirect("/billing/checkout");
  }

  if (session.status === "complete") {
    const isCandidateAddon =
      addon === "candidate" &&
      session.mode === "payment" &&
      session.metadata?.type === "candidate_addon" &&
      !!session.metadata?.orgId;

    let orgId: string | null = null;

    if (isCandidateAddon) {
      orgId = session.metadata!.orgId;
      const creditCount = parseInt(session.metadata!.creditCount ?? "1", 10);
      const actorId = session.metadata!.actorId ?? "system";

      const alreadyProcessed = await prisma.candidateCredit.findFirst({
        where: { orgId: orgId!, note: { contains: sessionId } },
        select: { id: true },
      });

      if (!alreadyProcessed) {
        const label = CREDIT_LABELS[creditCount] ?? `${creditCount}× jelölt értékelés`;
        await addCredits({
          orgId: orgId!,
          amount: creditCount,
          actorId,
          note: `${label} [${sessionId}]`,
        });
      }
    }

    if (isCandidateAddon && orgId) {
      return (
        <div className="min-h-dvh bg-cream flex items-center justify-center">
          <div className="max-w-md text-center px-6">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(26,92,58,0.08)]">
              <span className="text-3xl text-sage">✓</span>
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-2">
              // {t("billing.returnSuccessEyebrow", locale)}
            </p>
            <h1 className="font-fraunces text-2xl text-ink mb-3">
              {t("billing.returnSuccessTitle", locale)}
            </h1>
            <p className="text-sm text-ink-warm mb-6">
              {t("billing.returnCandidateBody", locale)}
            </p>
            <Link
              href={`/hiring/${orgId}`}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-6 text-sm font-semibold text-white hover:bg-sage-dark transition"
            >
              {t("billing.returnCandidateCta", locale)}
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(26,92,58,0.08)]">
            <span className="text-3xl text-sage">✓</span>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-2">
            // {t("billing.returnSuccessEyebrow", locale)}
          </p>
          <h1 className="font-fraunces text-2xl text-ink mb-3">
            {t("billing.returnSuccessTitle", locale)}
          </h1>
          <p className="text-sm text-ink-warm mb-6">
            {t("billing.returnSubBody", locale)}
          </p>
          <Link
            href="/profile/results"
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
