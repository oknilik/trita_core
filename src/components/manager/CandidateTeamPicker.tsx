"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
      setError(isHu ? "Hiba történt. Próbáld újra." : "Something went wrong. Please try again.");
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
        className="flex-1 min-w-[180px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">{isHu ? "— Nincs csapat —" : "— No team —"}</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={!isDirty || isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40"
      >
        {isPending ? (isHu ? "Mentés…" : "Saving…") : (isHu ? "Mentés" : "Save")}
      </button>
      {saved && !isDirty && (
        <span className="text-xs font-medium text-emerald-600">
          {isHu ? "Mentve!" : "Saved!"}
        </span>
      )}
      {error && (
        <span className="text-xs font-medium text-red-500">{error}</span>
      )}
    </div>
  );
}
