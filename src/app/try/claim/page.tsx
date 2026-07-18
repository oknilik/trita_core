"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import {
  clearAssessmentDraftFromStorage,
  readAssessmentDraftFromStorage,
  toAssessmentAnswerPayload,
} from "@/lib/assessment-draft";

export default function TryClaimPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { locale } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const claimed = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-up?redirect_url=/try/claim");
      return;
    }
    if (claimed.current) return;
    claimed.current = true;

    const draft = readAssessmentDraftFromStorage({ testType: "TRITAN" });
    if (!draft) {
      // No draft — user might have already claimed or never took the test
      router.replace("/onboarding");
      return;
    }

    const answers = draft.answers ?? {};
    if (Object.keys(answers).length === 0) {
      router.replace("/onboarding");
      return;
    }

    // Submit answers to the claim endpoint
    const payload = {
      answers: toAssessmentAnswerPayload(answers),
    };

    fetch("/api/assessment/claim-guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Claim failed");
        }
        clearAssessmentDraftFromStorage("TRITAN");
        router.replace("/onboarding");
      })
      .catch((err) => {
        console.error("[claim] error:", err);
        setError(t("tryClaim.error", locale));
      });
  }, [isLoaded, isSignedIn, router, locale]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5">
        <p className="mb-4 text-center text-[15px] text-rose-700">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            claimed.current = false;
          }}
          className="rounded-lg bg-[var(--color-accent-primary)] px-6 py-3 text-sm font-semibold text-white"
        >
          {t("tryClaim.retryCta", locale)}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent-primary)] border-t-transparent" />
      <p className="mt-4 text-sm text-[var(--color-text-muted)]">
        {t("tryClaim.loading", locale)}
      </p>
    </div>
  );
}
