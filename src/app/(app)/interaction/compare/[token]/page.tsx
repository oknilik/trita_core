import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { ScoreResult } from "@/lib/scoring";
import { resolveCompareInviteState } from "@/lib/compare-invite";
import { CompareConsentClient } from "./CompareConsentClient";
import { buildSignInPath } from "@/lib/navigation/auth-redirects";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";

// A páros-összehasonlító meghívó fogadó oldala (B1).
// Állapot-gépe: érvénytelen → barátságos hibalap · kijelentkezett →
// sign-in redirect_url-lel (a token a linkben él tovább — a /try/claim
// mintája) · saját link → vissza a kezelőhöz · elfogadva általam → páros
// nézet · kitöltetlen saját teszt → magyarázat + CTA (a jutalom
// kitöltéshez kötött) · különben consent.

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title:
      locale === "hu"
        ? "Páros összehasonlítás | trita"
        : "Pair comparison | trita",
    robots: { index: false },
  };
}

function StatePage({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md rounded-2xl border border-sand bg-surface-card p-8 text-center md:p-10">
        <h1 className="font-fraunces text-title leading-tight tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-3 text-caption leading-relaxed text-ink-body">{body}</p>
        <Link
          href={ctaHref}
          className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--color-accent-primary)] px-6 text-caption font-bold text-[var(--color-text-on-accent)] transition-all hover:-translate-y-px hover:brightness-[1.06]"
        >
          {ctaLabel}
        </Link>
      </div>
    </main>
  );
}

export default async function CompareInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);

  if (!userId) {
    redirect(buildSignInPath(`/interaction/compare/${token}`));
  }

  const invite = await prisma.compareInvite.findUnique({
    where: { token },
    select: {
      id: true,
      inviterId: true,
      partnerId: true,
      status: true,
      expiresAt: true,
      inviter: { select: { username: true } },
    },
  });

  if (!invite) {
    return (
      <StatePage
        title={t("results.compareInvalidTitle", locale)}
        body={t("results.compareInvalidBody", locale)}
        ctaHref="/dashboard"
        ctaLabel={t("results.comparePairBack", locale)}
      />
    );
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return redirectToSignIn();

  // Saját link megnyitása: nincs mit elfogadni — vissza a kezelő-kártyához.
  if (invite.inviterId === profile.id) {
    redirect("/interaction");
  }

  const state = resolveCompareInviteState(invite);

  if (state === "ACCEPTED" && invite.partnerId === profile.id) {
    redirect(`/interaction?pair=${invite.id}`);
  }
  if (state !== "PENDING") {
    return (
      <StatePage
        title={t("results.compareInvalidTitle", locale)}
        body={t("results.compareInvalidBody", locale)}
        ctaHref="/dashboard"
        ctaLabel={t("results.comparePairBack", locale)}
      />
    );
  }

  const latest = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profile.id, isSelfAssessment: true },
    orderBy: { createdAt: "desc" },
    select: { scores: true },
  });
  const scores = latest?.scores as ScoreResult | undefined;
  if (!scores || scores.type !== "likert") {
    return (
      <StatePage
        title={t("results.compareNeedResultTitle", locale)}
        body={t("results.compareNeedResultBody", locale)}
        ctaHref="/assessment"
        ctaLabel={t("results.compareNeedResultCta", locale)}
      />
    );
  }

  const inviterName =
    invite.inviter?.username ?? t("results.comparePartnerFallback", locale);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4 py-10">
      <CompareConsentClient token={token} inviterName={inviterName} />
    </main>
  );
}
