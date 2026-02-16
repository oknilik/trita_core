"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { FadeIn } from "@/components/landing/FadeIn";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

export function BottomCTA() {
  const { locale } = useLocale();

  return (
    <section className="px-4 py-12 md:py-16">
      <FadeIn>
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-6 py-14 text-center shadow-2xl shadow-indigo-200 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
            {t("landing.ctaTag", locale)}
          </p>
          <h2 className="text-2xl font-bold text-white md:text-4xl">
            {t("landing.ctaTitle", locale)}
          </h2>
          <p className="max-w-2xl text-sm text-indigo-100">
            {t("landing.ctaBody", locale)}
          </p>

          <div className="flex w-full max-w-md flex-col items-center gap-3 md:flex-row md:justify-center">
            <SignedOut>
              <Link
                href="/sign-up"
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-white px-8 text-base font-semibold text-indigo-700 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl md:w-auto"
              >
                {t("landing.ctaSignUp", locale)}
              </Link>
              <Link
                href="/sign-in"
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 md:w-auto"
              >
                {t("landing.signIn", locale)}
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-white px-8 text-base font-semibold text-indigo-700 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl md:w-auto"
              >
                {t("landing.openDashboard", locale)}
              </Link>
              <Link
                href="/research"
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 md:w-auto"
              >
                {t("landing.notifyMe", locale)}
              </Link>
            </SignedIn>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
