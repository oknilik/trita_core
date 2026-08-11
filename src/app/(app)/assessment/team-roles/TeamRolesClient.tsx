"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { TeamRoleQuestionnaire } from "@/components/assessment/TeamRoleQuestionnaire";
import type { TeamRoleSelections } from "@/lib/team-role-questions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

interface TeamRolesClientProps {
  locale: Locale;
}

type Phase = "form" | "error";

export function TeamRolesClient({ locale }: TeamRolesClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [submitting, setSubmitting] = useState(false);
  const [lastFailed, setLastFailed] = useState<TeamRoleSelections | null>(null);

  const submit = useCallback(
    async (selections: TeamRoleSelections) => {
      setSubmitting(true);
      try {
        const res = await fetch("/api/team-roles/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selections }),
        });
        if (!res.ok) throw new Error("TEAM_ROLE_SUBMIT_FAILED");
        // Siker: a submitting állapot marad, amíg a navigáció megtörténik.
        setLastFailed(null);
        router.push(JOURNEY_HOME_HANDOFF_PATH);
      } catch {
        // A kitöltés ~4 perc munka — hiba (400/403/hálózat) esetén NEM
        // navigálunk el némán, mint korábban („redirect regardless"): a
        // válaszok state-ben maradnak, és újrapróbálhatók (a peer-kliens,
        // TeamRolePeersClient mintája).
        setLastFailed(selections);
        setPhase("error");
        setSubmitting(false);
      }
    },
    [router],
  );

  const handleSkip = useCallback(() => {
    router.push(JOURNEY_HOME_HANDOFF_PATH);
  }, [router]);

  if (phase === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="font-fraunces text-2xl text-ink">
          {t("teamRole.errorTitle", locale)}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">
          {t("teamRole.errorBody", locale)}
        </p>
        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            if (lastFailed) void submit(lastFailed);
          }}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-action-primary-bg px-6 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t(submitting ? "teamRole.submitting" : "teamRole.retry", locale)}
        </button>
        {/* A lépés opcionális — hibánál is nyitva marad a kihagyás. */}
        <button
          type="button"
          disabled={submitting}
          onClick={handleSkip}
          className="mt-3 inline-flex min-h-[44px] items-center px-4 text-caption font-medium text-muted transition hover:text-ink disabled:opacity-50"
        >
          {t("teamRole.skip", locale)}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <TeamRoleQuestionnaire
        locale={locale}
        submitting={submitting}
        onComplete={(selections) => void submit(selections)}
        onSkip={handleSkip}
      />
    </div>
  );
}
