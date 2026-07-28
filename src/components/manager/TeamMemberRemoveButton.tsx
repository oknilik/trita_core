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
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          className="min-h-[32px] inline-flex items-center rounded-lg bg-rose-600 px-2.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {loading ? "…" : t("manager.teamMemberRemove.confirmYes", locale)}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          disabled={loading}
          className="min-h-[32px] inline-flex items-center rounded-lg border border-sand bg-white px-2.5 text-xs font-semibold text-ink-body transition hover:border-sage/30"
        >
          {t("manager.teamMemberRemove.confirmNo", locale)}
        </button>
      </div>
    );
  }

  // Diszkrét trigger (UX-audit #16): a destruktív akció ne versenyezzen a
  // sor többi elemével — halvány szöveg-link, hover-re válik piros hangsúlyúvá.
  // A megerősítő lépés (fenti confirm-ág) változatlanul kötelező.
  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="min-h-[36px] inline-flex items-center rounded-lg px-2 text-xs font-medium text-ink-body/60 transition hover:bg-rose-50 hover:text-rose-600"
    >
      {t("manager.teamMemberRemove.remove", locale)}
    </button>
  );
}
