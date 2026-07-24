"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";

type Team = { id: string; name: string };

export function CandidateTeamPicker({
  candidateId,
  currentTeamId,
  teams,
  isHu,
}: {
  candidateId: string;
  currentTeamId: string | null;
  teams: Team[];
  isHu: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string>(currentTeamId ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locale: Locale = isHu ? "hu" : "en";

  const isDirty = selected !== (currentTeamId ?? "");

  async function handleSave() {
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/manager/candidates/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: selected || null }),
    });
    if (!res.ok) {
      setError(t("manager.candidateTeamPicker.error", locale));
      return;
    }
    setSaved(true);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selected}
        onChange={(e) => { setSelected(e.target.value); setSaved(false); }}
        className="flex-1 min-w-[180px] rounded-lg border border-sand bg-white px-3 py-2 text-sm text-ink focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">{t("manager.candidateTeamPicker.noTeam", locale)}</option>
        {teams.map((tm) => (
          <option key={tm.id} value={tm.id}>{tm.name}</option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={!isDirty || isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40"
      >
        {isPending ? t("manager.candidateTeamPicker.saving", locale) : t("manager.candidateTeamPicker.save", locale)}
      </button>
      {saved && !isDirty && (
        <span className="text-xs font-medium text-emerald-600">
          {t("manager.candidateTeamPicker.saved", locale)}
        </span>
      )}
      {error && (
        <span className="text-xs font-medium text-red-500">{error}</span>
      )}
    </div>
  );
}
