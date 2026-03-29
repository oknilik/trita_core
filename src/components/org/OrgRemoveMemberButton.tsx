"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface OrgRemoveMemberButtonProps {
  orgId: string;
  userId: string;
  isHu: boolean;
}

export function OrgRemoveMemberButton({ orgId, userId, isHu }: OrgRemoveMemberButtonProps) {
  const router = useRouter();
  const loc: Locale = isHu ? "hu" : "en";
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
          setError(t("org.actions.removeLastAdmin", loc));
        } else {
          setError(t("org.actions.removeError", loc));
        }
        return;
      }
      router.refresh();
    } catch {
      setError(t("org.actions.removeNetworkError", loc));
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
        {loading ? "..." : t("org.actions.removeButton", loc)}
      </button>
      {error && (
        <p className="text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}
