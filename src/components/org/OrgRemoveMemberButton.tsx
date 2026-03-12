"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OrgRemoveMemberButtonProps {
  orgId: string;
  userId: string;
  isHu: boolean;
}

export function OrgRemoveMemberButton({ orgId, userId, isHu }: OrgRemoveMemberButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "LAST_ADMIN") {
          setError(isHu ? "Nem távolítható el — utolsó admin." : "Cannot remove — last admin.");
        } else {
          setError(isHu ? "Hiba történt." : "Something went wrong.");
        }
        return;
      }
      router.refresh();
    } catch {
      setError(isHu ? "Hálózati hiba." : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleRemove}
        disabled={loading}
        className="min-h-[32px] rounded-lg border border-rose-200 bg-white px-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
      >
        {loading ? "..." : isHu ? "Eltávolít" : "Remove"}
      </button>
      {error && (
        <p className="text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}
