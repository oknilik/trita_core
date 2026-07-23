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
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-4 py-12">
        <p className="font-mono text-[11px] uppercase tracking-widest text-bronze">
          {t("teamRolePeers.eyebrow", locale)}
        </p>
        <h1 className="mt-3 text-center font-fraunces text-3xl leading-tight text-ink">
          {t("teamRolePeers.introTitle", locale)}
        </h1>
        <p className="mt-2 text-center text-sm text-muted">{campaignName}</p>
        <p className="mt-5 max-w-md text-center text-[14px] leading-relaxed text-ink-body">
          {tf("teamRolePeers.introBody", locale, { count: TEAM_ROLE_ITEM_COUNT })}
        </p>
        <div className="mt-6 w-full rounded-xl border border-sage/30 bg-sage/5 px-4 py-3.5">
          <p className="text-[13px] leading-relaxed text-ink-body">
            <span className="font-semibold text-ink">
              {t("teamRolePeers.anonTitle", locale)}
            </span>{" "}
            {t("teamRolePeers.anonBody", locale)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPhase("rating")}
          className="mt-8 inline-flex min-h-[48px] items-center rounded-[10px] bg-ink px-8 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {t("teamRolePeers.start", locale)}
        </button>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-muted">
          {tf("teamRolePeers.progress", locale, {
            done: doneCount,
            total: teammates.length,
          })}
        </p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="text-4xl">💬</div>
        <h1 className="mt-4 font-fraunces text-2xl text-ink">
          {t("teamRolePeers.doneTitle", locale)}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">
          {t("teamRolePeers.doneBody", locale)}
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-ink px-6 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          {t("teamRolePeers.backToDashboard", locale)}
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="font-fraunces text-2xl text-ink">
          {t("teamRolePeers.errorTitle", locale)}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">
          {t("teamRolePeers.errorBody", locale)}
        </p>
        <button
          type="button"
          onClick={() => {
            setPhase("rating");
            if (lastFailed) {
              void submitOne(lastFailed.aboutUserId, lastFailed.selections);
            }
          }}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-ink px-6 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          {t("teamRolePeers.retry", locale)}
        </button>
      </div>
    );
  }

  // rating
  if (!current) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-widest text-bronze">
          {t("teamRolePeers.eyebrow", locale)}
        </p>
        <p className="font-mono text-[11px] text-muted">
          {tf("teamRolePeers.progress", locale, {
            done: doneCount,
            total: teammates.length,
          })}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-sand bg-white px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/15 font-fraunces text-lg text-sage">
          {current.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-fraunces text-lg text-ink">{current.name}</p>
          <p className="text-[12px] text-muted">{campaignName}</p>
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
    </div>
  );
}
