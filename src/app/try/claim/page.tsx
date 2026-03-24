"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";

const DRAFT_KEY = "trita_draft_HEXACO";

export default function TryClaimPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { locale } = useLocale();
  const isHu = locale === "hu";
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

    const stored = localStorage.getItem(DRAFT_KEY);
    if (!stored) {
      // No draft — user might have already claimed or never took the test
      router.replace("/profile/results");
      return;
    }

    let draft: { answers?: Record<string, number> };
    try {
      draft = JSON.parse(stored);
    } catch {
      router.replace("/profile/results");
      return;
    }

    const answers = draft.answers ?? {};
    if (Object.keys(answers).length === 0) {
      router.replace("/profile/results");
      return;
    }

    // Submit answers to the claim endpoint
    const payload = {
      answers: Object.entries(answers).map(([questionId, value]) => ({
        questionId: Number(questionId),
        value,
      })),
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
        localStorage.removeItem(DRAFT_KEY);
        router.replace("/profile/results");
      })
      .catch((err) => {
        console.error("[claim] error:", err);
        setError(
          isHu
            ? "Hiba történt az eredmények mentésekor. Kérjük, próbáld újra."
            : "An error occurred while saving your results. Please try again.",
        );
      });
  }, [isLoaded, isSignedIn, router, isHu]);

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
          className="rounded-lg bg-[#c17f4a] px-6 py-3 text-sm font-semibold text-white"
        >
          {isHu ? "Újrapróbálom" : "Try again"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c17f4a] border-t-transparent" />
      <p className="mt-4 text-sm text-[#8a8a9a]">
        {isHu ? "Eredmények betöltése..." : "Loading your results..."}
      </p>
    </div>
  );
}
