"use client";

// Csapattársi szerep-visszajelzés — kártya-carousel csapattársanként.
// Minden kész személy után azonnal beküldünk (személyenkénti batch), így
// megszakadásnál nem vész el a már beadott visszajelzés.

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TeamRoleQuestionnaire } from "@/components/assessment/TeamRoleQuestionnaire";
import { TEAM_ROLE_ITEM_COUNT } from "@/lib/team-role-questions";
import type { TeamRoleSelections } from "@/lib/team-role-questions";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import {
  AssessmentFlowHeader,
  AssessmentFlowShell,
  AssessmentIntro,
  AssessmentStatus,
  assessmentPrimaryActionClass,
} from "@/components/assessment/AssessmentFlowShell";

interface Teammate {
  userId: string;
  name: string;
  done: boolean;
}

interface TeamRolePeersClientProps {
  locale: Locale;
  campaignId: string;
  campaignName: string;
  teammates: Teammate[];
}

type Phase = "intro" | "rating" | "done" | "error";

export function TeamRolePeersClient({
  locale,
  campaignId,
  campaignName,
  teammates,
}: TeamRolePeersClientProps) {
  const router = useRouter();
  const initialPending = useMemo(
    () => teammates.filter((m) => !m.done),
    [teammates],
  );
  const [phase, setPhase] = useState<Phase>(
    initialPending.length === 0 ? "done" : "intro",
  );
  const [doneIds, setDoneIds] = useState<Set<string>>(
    () => new Set(teammates.filter((m) => m.done).map((m) => m.userId)),
  );
  const [submitting, setSubmitting] = useState(false);
  const [lastFailed, setLastFailed] = useState<{
    aboutUserId: string;
    selections: TeamRoleSelections;
  } | null>(null);

  const pending = teammates.filter((m) => !doneIds.has(m.userId));
  const current = pending[0] ?? null;
  const doneCount = doneIds.size;

  const submitOne = useCallback(
    async (aboutUserId: string, selections: TeamRoleSelections) => {
      setSubmitting(true);
      try {
        const res = await fetch("/api/team-roles/peers/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId,
            observations: [{ aboutUserId, selections }],
          }),
        });
        if (!res.ok) throw new Error("submit failed");
        setLastFailed(null);
        setDoneIds((prev) => {
          const next = new Set(prev);
          next.add(aboutUserId);
          if (next.size >= teammates.length) setPhase("done");
          return next;
        });
      } catch {
        setLastFailed({ aboutUserId, selections });
        setPhase("error");
      } finally {
        setSubmitting(false);
      }
    },
    [campaignId, teammates.length],
  );

  if (phase === "intro") {
    return (
      <AssessmentIntro
        eyebrow={t("teamRolePeers.eyebrow", locale)}
        title={t("teamRolePeers.introTitle", locale)}
        campaignName={campaignName}
        body={tf("teamRolePeers.introBody", locale, { count: TEAM_ROLE_ITEM_COUNT })}
        notice={
          <>
            <span className="font-semibold text-ink">
              {t("teamRolePeers.anonTitle", locale)}
            </span>{" "}
            {t("teamRolePeers.anonBody", locale)}
          </>
        }
        action={<button type="button" onClick={() => setPhase("rating")} className={assessmentPrimaryActionClass}>{t("teamRolePeers.start", locale)}</button>}
        meta={tf("teamRolePeers.progress", locale, {
            done: doneCount,
            total: teammates.length,
        })}
      />
    );
  }

  if (phase === "done") {
    return (
      <AssessmentStatus
        tone="success"
        title={t("teamRolePeers.doneTitle", locale)}
        body={t("teamRolePeers.doneBody", locale)}
        action={<button type="button" onClick={() => router.push("/dashboard")} className={assessmentPrimaryActionClass}>{t("teamRolePeers.backToDashboard", locale)}</button>}
      />
    );
  }

  if (phase === "error") {
    return (
      <AssessmentStatus
        tone="error"
        title={t("teamRolePeers.errorTitle", locale)}
        body={t("teamRolePeers.errorBody", locale)}
        action={<button
          type="button"
          onClick={() => {
            setPhase("rating");
            if (lastFailed) {
              void submitOne(lastFailed.aboutUserId, lastFailed.selections);
            }
          }}
          className={assessmentPrimaryActionClass}
        >
          {t("teamRolePeers.retry", locale)}
        </button>}
      />
    );
  }

  // rating
  if (!current) return null;

  return (
    <AssessmentFlowShell>
      <AssessmentFlowHeader
        eyebrow={t("teamRolePeers.eyebrow", locale)}
        progress={tf("teamRolePeers.progress", locale, {
            done: doneCount,
            total: teammates.length,
        })}
      />

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-sand bg-surface-card px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/15 font-fraunces text-lg text-sage">
          {current.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-fraunces text-lg text-ink">{current.name}</p>
          <p className="text-xs text-muted">{campaignName}</p>
        </div>
      </div>

      <div className="mt-4">
        <TeamRoleQuestionnaire
          key={current.userId}
          locale={locale}
          perspective="peer"
          subjectName={current.name}
          withIntro={false}
          submitting={submitting}
          onComplete={(selections) => void submitOne(current.userId, selections)}
        />
      </div>
    </AssessmentFlowShell>
  );
}
