"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface Props {
  orgId: string;
  inviteId: string;
  isHu: boolean;
}

export function OrgPendingInviteCancelButton({ orgId, inviteId, isHu }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  const loc: Locale = isHu ? "hu" : "en";

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch(`/api/org/${orgId}/invite/${inviteId}`, { method: "DELETE" });
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
          onClick={handleCancel}
          disabled={loading}
          className="min-h-[44px] inline-flex items-center rounded-lg bg-state-error-solid px-4 text-xs font-semibold text-white transition hover:bg-state-error-fg disabled:opacity-50"
        >
          {loading ? "…" : t("org.actions.cancelInviteYes", loc)}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          disabled={loading}
          className="min-h-[44px] inline-flex items-center rounded-lg border border-sand bg-surface-card px-4 text-xs font-semibold text-ink-body transition hover:border-sage/30"
        >
          {t("org.actions.cancelInviteNo", loc)}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="min-h-[44px] inline-flex items-center rounded-lg border border-sand bg-surface-card px-3 text-xs font-semibold text-state-error-solid transition hover:border-state-error-border hover:bg-state-error-bg"
    >
      {t("org.actions.cancelInviteButton", loc)}
    </button>
  );
}
