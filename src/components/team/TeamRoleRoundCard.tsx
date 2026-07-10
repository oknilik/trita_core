"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardStatusChip } from "@/components/dashboard/DashboardPrimitives";

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
    <div className="rounded-2xl border border-sand bg-white p-5 shadow-[0_10px_26px_rgba(26,26,46,0.03)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            {isHu ? "// csapat szerep teszt" : "// team role assessment"}
          </p>
          <h3 className="mt-1 font-fraunces text-[18px] text-ink">
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

      <p className="mt-2 text-[12px] leading-relaxed text-ink-body">
        {isHu
          ? "A TeamRole csapatszerep teszt feltérképezi, ki milyen szerepben erős a csapatmunkában. A személyiségprofilból becslés már elérhető, de a valódi kérdőív pontosabb képet ad."
          : "The TeamRole team role test maps out everyone's strengths in teamwork. Profile-based estimates are available, but the actual questionnaire gives a more accurate picture."}
      </p>

      {/* Progress */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-sand bg-cream px-3 py-2.5 text-center">
          <p className="font-fraunces text-[20px] leading-none text-sage-dark">{completedCount}</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted">
            {isHu ? "kitöltötte" : "completed"}
          </p>
        </div>
        <div className="rounded-xl border border-sand bg-cream px-3 py-2.5 text-center">
          <p className="font-fraunces text-[20px] leading-none text-bronze">{estimateCount}</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted">
            {isHu ? "becslésből" : "estimated"}
          </p>
        </div>
        <div className="rounded-xl border border-sand bg-cream px-3 py-2.5 text-center">
          <p className="font-fraunces text-[20px] leading-none text-ink">{totalMembers - completedCount - estimateCount}</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted">
            {isHu ? "hiányzik" : "missing"}
          </p>
        </div>
      </div>

      {/* Member list */}
      {isRoundActive && members.length > 0 && (
        <div className="mt-4 divide-y divide-sand rounded-xl border border-sand bg-white">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between px-3 py-2">
              <span className="text-[12px] text-ink">{m.name}</span>
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
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void toggleRound()}
            disabled={loading}
            className={`min-h-[44px] rounded-lg px-5 text-[12px] font-semibold transition disabled:opacity-50 ${
              isRoundActive
                ? "border border-sand bg-white text-ink-body hover:border-rose-200 hover:text-rose-700"
                : "bg-sage text-white hover:bg-sage-dark"
            }`}
          >
            {loading
              ? "..."
              : isRoundActive
                ? (isHu ? "Kör lezárása" : "Close round")
                : (isHu ? "Csapatszerep kör indítása" : "Start team role round")}
          </button>
          {isRoundActive && !allDone && (
            <span className="text-[11px] text-muted">
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
