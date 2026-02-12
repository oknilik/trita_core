import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { FadeIn } from "@/components/landing/FadeIn";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

interface BottomCTAProps {
  locale: Locale;
}

export async function BottomCTA({ locale }: BottomCTAProps) {
  let ctaTag = t("landing.ctaTag", locale);
  let ctaTitle = t("landing.ctaTitle", locale);
  let ctaBody = t("landing.ctaBody", locale);

  let primaryHref = "/sign-up";
  let primaryLabel = t("landing.ctaSignUp", locale);
  let secondaryHref = "/sign-in";
  let secondaryLabel = t("landing.signIn", locale);

  let user = null;
  try {
    user = await currentUser();
  } catch {
    user = null;
  }

  if (user) {
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: user.id },
      select: { id: true, onboardedAt: true },
    });

    secondaryHref = "/dashboard";
    secondaryLabel = t("landing.openDashboard", locale);
    ctaTag = t("landing.ctaTagInProgress", locale);

    if (!profile?.onboardedAt) {
      primaryHref = "/onboarding";
      primaryLabel = t("landing.ctaCompleteProfile", locale);
      ctaTitle = t("landing.ctaTitleCompleteProfile", locale);
      ctaBody = t("landing.ctaBodyCompleteProfile", locale);
    } else {
      const [draft, latestResult, inviteCount] = await Promise.all([
        prisma.assessmentDraft.findUnique({
          where: { userProfileId: profile.id },
          select: { id: true },
        }),
        prisma.assessmentResult.findFirst({
          where: { userProfileId: profile.id },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        }),
        prisma.observerInvitation.count({
          where: { inviterId: profile.id },
        }),
      ]);

      if (draft) {
        primaryHref = "/assessment";
        primaryLabel = t("actions.continueTest", locale);
        ctaTitle = t("landing.ctaTitleContinue", locale);
        ctaBody = t("landing.ctaBodyContinue", locale);
      } else if (!latestResult) {
        primaryHref = "/assessment";
        primaryLabel = t("actions.startTest", locale);
        ctaTitle = t("landing.ctaTitleStartAssessment", locale);
        ctaBody = t("landing.ctaBodyStartAssessment", locale);
      } else if (inviteCount === 0) {
        primaryHref = "/dashboard#invite";
        primaryLabel = t("landing.ctaRequestFeedback", locale);
        ctaTitle = t("landing.ctaTitleRequestFeedback", locale);
        ctaBody = t("landing.ctaBodyRequestFeedback", locale);
      } else {
        primaryHref = "/dashboard#results";
        primaryLabel = t("landing.ctaViewResults", locale);
        ctaTitle = t("landing.ctaTitleResults", locale);
        ctaBody = t("landing.ctaBodyResults", locale);
      }

      if (primaryHref.startsWith("/dashboard")) {
        secondaryHref = "/research";
        secondaryLabel = t("landing.notifyMe", locale);
      }
    }
  }

  return (
    <section className="px-4 py-12 md:py-16">
      <FadeIn>
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-6 py-14 text-center shadow-2xl shadow-indigo-200 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
            {ctaTag}
          </p>
          <h2 className="text-2xl font-bold text-white md:text-4xl">
            {ctaTitle}
          </h2>
          <p className="max-w-2xl text-sm text-indigo-100">
            {ctaBody}
          </p>

          <div className="flex w-full max-w-md flex-col items-center gap-3 md:flex-row md:justify-center">
            <Link
              href={primaryHref}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-white px-8 text-base font-semibold text-indigo-700 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl md:w-auto"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 md:w-auto"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
