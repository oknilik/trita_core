"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  teamId: string;
  userId: string;
  isHu: boolean;
}

export function TeamMemberRemoveButton({ teamId, userId, isHu }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/team/${teamId}/members/${userId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          className="min-h-[32px] inline-flex items-center rounded-lg bg-rose-600 px-2.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {loading ? "…" : (isHu ? "Igen" : "Yes")}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          disabled={loading}
          className="min-h-[32px] inline-flex items-center rounded-lg border border-[#e8e4dc] bg-white px-2.5 text-xs font-semibold text-[#3d3a35] transition hover:border-[#c8410a]/30"
        >
          {isHu ? "Nem" : "No"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="min-h-[36px] inline-flex items-center rounded-lg border border-[#e8e4dc] bg-white px-3 text-xs font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
    >
      {isHu ? "Eltávolítás" : "Remove"}
    </button>
  );
}
