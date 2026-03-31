"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { BelbinQuestionnaire } from "@/components/assessment/BelbinQuestionnaire";
import type { BelbinAnswers } from "@/lib/belbin-scoring";
import type { Locale } from "@/lib/i18n";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

interface BelbinClientProps {
  locale: Locale;
}

export function BelbinClient({ locale }: BelbinClientProps) {
  const router = useRouter();

  const handleComplete = useCallback(
    async (answers: BelbinAnswers) => {
      try {
        await fetch("/api/belbin/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
      } catch {
        // Non-critical: redirect regardless
      }
      router.push(JOURNEY_HOME_HANDOFF_PATH);
    },
    [router],
  );

  const handleSkip = useCallback(() => {
    router.push(JOURNEY_HOME_HANDOFF_PATH);
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <BelbinQuestionnaire
        locale={locale}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </div>
  );
}
