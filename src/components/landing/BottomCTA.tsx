"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { FadeIn } from "@/components/landing/FadeIn";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

type CtaStatus = {
  onboarded: boolean;
  hasDraft: boolean;
  hasResult: boolean;
  sentInvites: number;
  pendingInvites: number;
  completedObserver: number;
};

export function BottomCTA() {
  const { locale } = useLocale();
  const [status, setStatus] = useState<CtaStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/profile/status");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setStatus({
          onboarded: Boolean(data.onboarded),
          hasDraft: Boolean(data.hasDraft),
          hasResult: Boolean(data.hasResult),
          sentInvites: Number(data.sentInvites ?? 0),
          pendingInvites: Number(data.pendingInvites ?? 0),
          completedObserver: Number(data.completedObserver ?? 0),
        });
      } catch {
        // silent fallback to generic CTA copy
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const signedInContent = useMemo(() => {
    if (!status) {
      return {
        tagKey: "landing.ctaTagInProgress",
        titleKey: "landing.ctaTitleContinue",
        bodyKey: "landing.ctaBodyContinue",
        primaryHref: "/dashboard",
        primaryLabelKey: "landing.openDashboard",
        secondaryHref: "/research",
        secondaryLabelKey: "landing.notifyMe",
      } as const;
    }

    if (!status.onboarded) {
      return {
        tagKey: "landing.ctaTagInProgress",
        titleKey: "landing.ctaTitleCompleteProfile",
        bodyKey: "landing.ctaBodyCompleteProfile",
        primaryHref: "/onboarding",
        primaryLabelKey: "landing.ctaCompleteProfile",
      } as const;
    }

    if (status.hasDraft) {
      return {
        tagKey: "landing.ctaTagInProgress",
        titleKey: "landing.ctaTitleContinue",
        bodyKey: "landing.ctaBodyContinue",
        primaryHref: "/assessment",
        primaryLabelKey: "landing.ctaTitleContinue",
      } as const;
    }

    if (!status.hasResult) {
      return {
        tagKey: "landing.ctaTagInProgress",
        titleKey: "landing.ctaTitleStartAssessment",
        bodyKey: "landing.ctaBodyStartAssessment",
        primaryHref: "/assessment",
        primaryLabelKey: "landing.ctaTitleStartAssessment",
      } as const;
    }

    if (status.sentInvites === 0 || status.pendingInvites > 0) {
      return {
        tagKey: "landing.ctaTagInProgress",
        titleKey: "landing.ctaTitleRequestFeedback",
        bodyKey: "landing.ctaBodyRequestFeedback",
        primaryHref: "/dashboard#invite",
        primaryLabelKey: "landing.ctaRequestFeedback",
      } as const;
    }

    if (status.completedObserver > 0) {
      return {
        tagKey: "landing.ctaTagInProgress",
        titleKey: "landing.ctaTitleResults",
        bodyKey: "landing.ctaBodyResults",
        primaryHref: "/dashboard",
        primaryLabelKey: "landing.openDashboard",
      } as const;
    }

    return {
      tagKey: "landing.ctaTagInProgress",
      titleKey: "landing.ctaTitleContinue",
      bodyKey: "landing.ctaBodyContinue",
      primaryHref: "/dashboard",
      primaryLabelKey: "landing.openDashboard",
      secondaryHref: "/research",
      secondaryLabelKey: "landing.notifyMe",
    } as const;
  }, [status]);

  return (
    <section className="px-4 py-12 md:py-16">
      <FadeIn>
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-14 text-center shadow-2xl shadow-indigo-200 md:py-16">
          <SignedOut>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
              {t("landing.ctaTag", locale)}
            </p>
            <h2 className="text-2xl font-bold text-white md:text-4xl">
              {t("landing.ctaTitle", locale)}
            </h2>
            <p className="max-w-2xl text-sm text-indigo-100">
              {t("landing.ctaBody", locale)}
            </p>
          </SignedOut>

          <SignedIn>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
              {t(signedInContent.tagKey, locale)}
            </p>
            <h2 className="text-2xl font-bold text-white md:text-4xl">
              {t(signedInContent.titleKey, locale)}
            </h2>
            <p className="max-w-2xl text-sm text-indigo-100">
              {t(signedInContent.bodyKey, locale)}
            </p>
          </SignedIn>

          <div className="flex w-full max-w-md flex-col items-center gap-3 md:flex-row md:justify-center">
            <SignedOut>
              <Link
                href="/sign-up"
                className="flex min-h-[48px] w-full items-center justify-center rounded-lg bg-white px-8 text-base font-semibold text-indigo-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-50 hover:shadow-xl md:w-auto"
              >
                {t("landing.ctaSignUp", locale)}
              </Link>
              <Link
                href="/sign-in"
                className="flex min-h-[48px] w-full items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 md:w-auto"
              >
                {t("landing.signIn", locale)}
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                href={signedInContent.primaryHref}
                scroll={!signedInContent.primaryHref.includes("#")}
                className="flex min-h-[48px] w-full items-center justify-center rounded-lg bg-white px-8 text-base font-semibold text-indigo-700 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-50 hover:shadow-xl md:w-auto"
              >
                {t(signedInContent.primaryLabelKey, locale)}
              </Link>
              {signedInContent.secondaryHref && signedInContent.secondaryLabelKey ? (
                <Link
                  href={signedInContent.secondaryHref}
                  scroll={!signedInContent.secondaryHref.includes("#")}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 md:w-auto"
                >
                  {t(signedInContent.secondaryLabelKey, locale)}
                </Link>
              ) : null}
            </SignedIn>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
