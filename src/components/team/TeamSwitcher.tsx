"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Csapat-váltó a csapat-hero-ban: több csapat esetén a tag itt jelöli ki,
// melyik a „sajátja" — a Vezérlő ezután erre a csapatra visz (a kijelölés
// perzisztens: UserProfile.activeTeamId). Egy csapatnál nem renderel.

export interface TeamSwitcherTeam {
  id: string;
  name: string;
}

export function TeamSwitcher({
  teams,
  activeTeamId,
  isHu,
}: {
  teams: TeamSwitcherTeam[];
  activeTeamId: string;
  isHu: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (teams.length < 2) return null;
  const active = teams.find((team) => team.id === activeTeamId) ?? teams[0];

  const pick = async (teamId: string) => {
    if (busy || teamId === activeTeamId) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/team/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      setOpen(false);
      router.push(`/team/${teamId}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex min-h-[36px] items-center gap-2 rounded-[10px] bg-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/[0.82] transition hover:bg-white/[0.14] disabled:opacity-60"
      >
        <span className="text-micro uppercase tracking-widest text-white/[0.45]">
          {isHu ? "Csapat" : "Team"}
        </span>
        <span className="max-w-[180px] truncate">{active.name}</span>
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 4.5L6 8l3.5-3.5" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 z-30 mt-2 w-[240px] overflow-hidden rounded-xl border border-sand bg-white py-1 shadow-[0_18px_40px_rgba(26,26,46,0.18)]"
        >
          {teams.map((team) => {
            const isActive = team.id === activeTeamId;
            return (
              <button
                key={team.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => pick(team.id)}
                disabled={busy}
                className={[
                  "flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-caption transition-colors",
                  isActive
                    ? "bg-sage/10 font-semibold text-ink"
                    : "text-ink-body hover:bg-cream hover:text-ink",
                ].join(" ")}
              >
                <span className="min-w-0 truncate">{team.name}</span>
                {isActive ? (
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 text-sage-dark"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8.5l3 3 7-7" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
