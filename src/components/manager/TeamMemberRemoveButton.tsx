"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";

interface Props {
  teamId: string;
  userId: string;
  isHu: boolean;
}

export function TeamMemberRemoveButton({ teamId, userId, isHu }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  const locale: Locale = isHu ? "hu" : "en";

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
      // Destruktív megerősítés: 44px-es érintési célok + nagyobb térköz.
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          className="min-h-[44px] inline-flex items-center rounded-lg bg-[var(--color-action-destructive-bg)] px-4 text-xs font-semibold text-[var(--color-action-destructive-fg)] transition hover:bg-[var(--color-action-destructive-bg-hover)] disabled:opacity-50"
        >
          {loading ? "…" : t("manager.teamMemberRemove.confirmYes", locale)}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          disabled={loading}
          className="min-h-[44px] inline-flex items-center rounded-lg border border-sand bg-surface-card px-4 text-xs font-semibold text-ink-body transition hover:border-sage/30"
        >
          {t("manager.teamMemberRemove.confirmNo", locale)}
        </button>
      </div>
    );
  }

  // Diszkrét trigger (UX-audit #16): a destruktív akció ne versenyezzen a
  // sor többi elemével – halvány szöveg-link, hover-re válik piros hangsúlyúvá.
  // A megerősítő lépés (fenti confirm-ág) változatlanul kötelező.
  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="relative min-h-[36px] inline-flex items-center rounded-lg px-2 text-xs font-medium text-ink-body/60 transition before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] hover:bg-state-error-bg hover:text-state-error-fg"
    >
      {t("manager.teamMemberRemove.remove", locale)}
    </button>
  );
}
