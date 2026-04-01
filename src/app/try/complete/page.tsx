"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";

export default function TryCompletePage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { locale } = useLocale();
  const [hasDraft, setHasDraft] = useState<boolean | null>(null);
  useEffect(() => { setHasDraft(hasAssessmentDraftInStorage("HEXACO")); }, []);

  useEffect(() => {
    if (hasDraft === false) router.replace("/try");
  }, [hasDraft, router]);

  // If already signed in, go claim the results
  useEffect(() => {
    if (isSignedIn) router.replace("/try/claim");
  }, [isSignedIn, router]);

  if (hasDraft !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c17f4a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="font-fraunces mb-10 inline-flex text-2xl font-black tracking-tight text-ink"
        >
          <span className="text-[#3d6b5e]">t</span>rit<span className="text-[#c17f4a]">a</span>
        </Link>

        {/* Celebration */}
        <div className="mb-6">
          <p className="mb-1 text-3xl">🎉</p>
          <h1 className="font-fraunces text-2xl text-ink">
            {t("tryComplete.doneTitle", locale)}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-body">
            {t("tryComplete.doneBody", locale)}
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/sign-up?redirect_url=/try/claim"
            className="flex min-h-[52px] items-center justify-center rounded-xl bg-[#c17f4a] px-6 text-[15px] font-bold text-white shadow-md shadow-[#c17f4a]/20 transition-all hover:-translate-y-px hover:brightness-[1.06]"
          >
            {t("tryComplete.registerCta", locale)}
          </Link>

          <Link
            href="/sign-in?redirect_url=/try/claim"
            className="flex min-h-[52px] items-center justify-center rounded-xl border border-[#e8e0d3] bg-white px-6 text-[15px] font-medium text-ink-body transition-colors hover:border-[#c17f4a]/40 hover:text-[#c17f4a]"
          >
            {t("tryComplete.loginCta", locale)}
          </Link>
        </div>

        {/* Privacy note */}
        <p className="mt-6 text-center text-xs text-[#8a8a9a]">
          {t("tryComplete.privacyNote", locale)}
          {" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-[#4a4a5e]">
            {t("tryComplete.privacyLink", locale)}
          </Link>
        </p>
      </div>
    </div>
  );
}
