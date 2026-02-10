"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { TritaLogo } from "@/components/TritaLogo";
import { DoodleIllustration } from "@/components/landing/DoodleIllustration";
import { FadeIn } from "@/components/landing/FadeIn";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

export function HeroSection() {
  const { locale } = useLocale();

  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-10 md:pt-20 md:pb-14">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-50/70 via-white to-white" />

      <div className="relative mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <FadeIn>
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600">
              <TritaLogo size={18} showText={false} />
              {t("landing.heroTag", locale)}
            </span>

            <h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
              {t("landing.heroTitleLine1", locale)}{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t("landing.heroTitleLine2", locale)}
              </span>
            </h1>

            <p className="max-w-lg text-base text-gray-600 md:text-lg">
              {t("landing.heroBody", locale)}
            </p>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className="flex min-h-[48px] items-center justify-center rounded-xl bg-indigo-600 px-8 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200"
              >
                {t("landing.joinResearch", locale)}
              </Link>

              <SignedIn>
                <Link
                  href="/dashboard"
                  className="flex min-h-[48px] items-center justify-center rounded-xl border border-gray-200 bg-white px-8 text-base font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  {t("landing.openDashboard", locale)}
                </Link>
              </SignedIn>
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="flex min-h-[48px] items-center justify-center rounded-xl border border-gray-200 bg-white px-8 text-base font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  {t("landing.signIn", locale)}
                </Link>
              </SignedOut>
            </div>

            <p className="text-xs text-gray-400">
              {t("landing.estimatedTime", locale)}
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto w-full max-w-sm"
          >
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white p-3 shadow-xl shadow-indigo-100/40">
              <div className="h-56 w-full md:h-64">
                <DoodleIllustration />
              </div>
            </div>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  );
}
