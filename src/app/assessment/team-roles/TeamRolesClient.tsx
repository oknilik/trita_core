"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { TeamRoleQuestionnaire } from "@/components/assessment/TeamRoleQuestionnaire";
import type { TeamRoleAnswers } from "@/lib/team-role-scoring";
import type { Locale } from "@/lib/i18n";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

interface TeamRolesClientProps {
  locale: Locale;
}

export function TeamRolesClient({ locale }: TeamRolesClientProps) {
  const router = useRouter();

  const handleComplete = useCallback(
    async (answers: TeamRoleAnswers) => {
      try {
        await fetch("/api/team-roles/submit", {
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
      <TeamRoleQuestionnaire
        locale={locale}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </div>
  );
}
