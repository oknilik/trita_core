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
  const [confirm, setConfirm] = useState(false);
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
      setConfirm(false);
    }
  }

  // Kétlépcsős törlés + diszkrét trigger (UX-audit #16): korábban EGY katt
  // eltávolította a tagot a szervezetből — most megerősítés kell, és a
  // nyugalmi állapot halvány szöveg-link, nem piros gomb.
  if (confirm) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="min-h-[32px] inline-flex items-center rounded-lg bg-rose-600 px-2.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "…" : isHu ? "Eltávolítás" : "Remove"}
          </button>
          <button
            type="button"
            onClick={() => setConfirm(false)}
            disabled={loading}
            className="min-h-[32px] inline-flex items-center rounded-lg border border-sand bg-white px-2.5 text-xs font-semibold text-ink-body transition hover:border-sage/30"
          >
            {isHu ? "Mégse" : "Cancel"}
          </button>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="min-h-[32px] inline-flex items-center rounded-lg px-2 text-xs font-medium text-ink-body/60 transition hover:bg-rose-50 hover:text-rose-600"
      >
        {t("org.actions.removeButton", loc)}
      </button>
      {error && (
        <p className="text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}
