"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";

interface Props {
  inviteId: string;
  isHu: boolean;
}

export function PendingInviteCancelButton({ inviteId, isHu }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  const locale: Locale = isHu ? "hu" : "en";

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch(`/api/team/pending-invite/${inviteId}`, { method: "DELETE" });
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
          onClick={handleCancel}
          disabled={loading}
          className="min-h-[32px] inline-flex items-center rounded-lg bg-rose-600 px-2.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {loading ? "…" : t("manager.pendingInviteCancel.confirmYes", locale)}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          disabled={loading}
          className="min-h-[32px] inline-flex items-center rounded-lg border border-sand bg-white px-2.5 text-xs font-semibold text-ink-body transition hover:border-sage/30"
        >
          {t("manager.pendingInviteCancel.confirmNo", locale)}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="min-h-[36px] inline-flex items-center rounded-lg border border-sand bg-white px-3 text-xs font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
    >
      {t("manager.pendingInviteCancel.cancelInvite", locale)}
    </button>
  );
}
