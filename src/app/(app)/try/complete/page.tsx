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
  // localStorage csak kliensen olvasható — hydration-biztos minta, szándékos.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setHasDraft(hasAssessmentDraftInStorage("TRITAN")); }, []);

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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent-primary)] border-t-transparent" />
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
          <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
        </Link>

        {/* Celebration */}
        <div className="mb-6">
          <p className="mb-1 text-3xl">🎉</p>
          <h1 className="font-fraunces text-2xl text-ink">
            {t("tryComplete.doneTitle", locale)}
          </h1>
          <p className="mt-2 text-body leading-relaxed text-ink-body">
            {t("tryComplete.doneBody", locale)}
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/sign-up?redirect_url=/try/claim"
            className="flex min-h-[52px] items-center justify-center rounded-xl bg-[var(--color-accent-primary)] px-6 text-body font-bold text-white shadow-md shadow-[var(--color-accent-primary)]/20 transition-all hover:-translate-y-px hover:brightness-[1.06]"
          >
            {t("tryComplete.registerCta", locale)}
          </Link>

          <Link
            href="/sign-in?redirect_url=/try/claim"
            className="flex min-h-[52px] items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-white px-6 text-body font-medium text-ink-body transition-colors hover:border-[var(--color-accent-primary)]/40 hover:text-[var(--color-accent-primary)]"
          >
            {t("tryComplete.loginCta", locale)}
          </Link>
        </div>

        {/* Privacy note */}
        <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          {t("tryComplete.privacyNote", locale)}
          {" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-[var(--color-text-secondary)]">
            {t("tryComplete.privacyLink", locale)}
          </Link>
        </p>
      </div>
    </div>
  );
}
