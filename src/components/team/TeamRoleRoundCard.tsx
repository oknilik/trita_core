"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardStatusChip } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

interface TeamRoleMemberStatus {
  userId: string;
  name: string;
  hasQuestionnaire: boolean;
  hasEstimate: boolean;
}

interface TeamRoleRoundCardProps {
  teamId: string;
  isRoundActive: boolean;
  totalMembers: number;
  completedCount: number;
  estimateCount: number;
  members: TeamRoleMemberStatus[];
  canManage: boolean;
  isHu: boolean;
}

export function TeamRoleRoundCard({
  teamId,
  isRoundActive,
  totalMembers,
  completedCount,
  estimateCount,
  members,
  canManage,
  isHu,
}: TeamRoleRoundCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const allDone = completedCount === totalMembers;

  async function toggleRound() {
    setLoading(true);
    try {
      await fetch("/api/team/role-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, active: !isRoundActive }),
      });
      router.refresh();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-sand bg-surface-card p-5 shadow-[0_10px_26px_rgba(26,26,46,0.03)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <SectionEyebrow tone="muted">
            {isHu ? "csapat szerep teszt" : "team role assessment"}
          </SectionEyebrow>
          <h3 className="mt-1 font-fraunces text-heading text-ink">
            {isHu ? "Csapatszerep kör" : "Team role round"}
          </h3>
        </div>
        <DashboardStatusChip
          label={
            isRoundActive
              ? allDone
                ? (isHu ? "Lezárható" : "Can close")
                : (isHu ? "Aktív" : "Active")
              : completedCount > 0
                ? `${completedCount}/${totalMembers}`
                : (isHu ? "Nem indult" : "Not started")
          }
          tone={isRoundActive ? (allDone ? "sage" : "warm") : "muted"}
        />
      </div>

      <p className="mt-2 text-xs leading-relaxed text-ink-body">
        {isHu
          ? "A TeamRole csapatszerep teszt feltérképezi, ki milyen szerepben erős a csapatmunkában. A személyiségprofilból becslés már elérhető, de a valódi kérdőív pontosabb képet ad."
          : "The TeamRole team role test maps out everyone's strengths in teamwork. Profile-based estimates are available, but the actual questionnaire gives a more accurate picture."}
      </p>

      {/* Progress */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="min-w-0 rounded-xl border border-sand bg-cream px-2 py-2.5 text-center md:px-3">
          <p className="font-fraunces text-heading leading-none text-sage-dark">{completedCount}</p>
          <p className="mt-1 break-words text-micro uppercase tracking-wide text-muted md:tracking-widest">
            {isHu ? "kitöltötte" : "completed"}
          </p>
        </div>
        <div className="min-w-0 rounded-xl border border-sand bg-cream px-2 py-2.5 text-center md:px-3">
          <p className="font-fraunces text-heading leading-none text-[var(--color-accent-primary-strong)]">{estimateCount}</p>
          <p className="mt-1 break-words text-micro uppercase tracking-wide text-muted md:tracking-widest">
            {isHu ? "becslésből" : "estimated"}
          </p>
        </div>
        <div className="min-w-0 rounded-xl border border-sand bg-cream px-2 py-2.5 text-center md:px-3">
          <p className="font-fraunces text-heading leading-none text-ink">{totalMembers - completedCount - estimateCount}</p>
          <p className="mt-1 break-words text-micro uppercase tracking-wide text-muted md:tracking-widest">
            {isHu ? "hiányzik" : "missing"}
          </p>
        </div>
      </div>

      {/* Member list */}
      {isRoundActive && members.length > 0 && (
        <div className="mt-4 divide-y divide-sand rounded-xl border border-sand bg-surface-card">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-ink">{m.name}</span>
              {m.hasQuestionnaire ? (
                <DashboardStatusChip label={isHu ? "Kitöltve" : "Done"} tone="sage" />
              ) : m.hasEstimate ? (
                <DashboardStatusChip label={isHu ? "Becslés" : "Estimate"} tone="warm" />
              ) : (
                <DashboardStatusChip label={isHu ? "Várakozik" : "Pending"} tone="muted" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {canManage && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void toggleRound()}
            disabled={loading}
            className={`min-h-[44px] rounded-lg px-5 text-xs font-semibold transition disabled:opacity-50 ${
              isRoundActive
                ? "border border-sand bg-surface-card text-ink-body hover:border-state-error-border hover:text-state-error-fg"
                : "bg-sage text-[var(--color-action-primary-fg)] hover:bg-sage-dark"
            }`}
          >
            {loading
              ? "..."
              : isRoundActive
                ? (isHu ? "Kör lezárása" : "Close round")
                : (isHu ? "Csapatszerep kör indítása" : "Start team role round")}
          </button>
          {isRoundActive && !allDone && (
            <span className="text-note text-muted">
              {isHu
                ? `${totalMembers - completedCount} tag még nem töltötte ki`
                : `${totalMembers - completedCount} members haven't completed yet`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
