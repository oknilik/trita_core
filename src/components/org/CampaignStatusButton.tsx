"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";
import { presentUserError } from "@/lib/user-errors";

interface CampaignStatusButtonProps {
  orgId: string;
  campaignId: string;
  nextStatus: string;
  label: string;
  isDanger: boolean;
  locale: Locale;
  /** Megerősítő szöveg a következményekkel — a szerver adja lokalizálva. */
  confirmMessage?: string;
}

export function CampaignStatusButton({
  orgId,
  campaignId,
  nextStatus,
  label,
  isDanger,
  locale,
  confirmMessage,
}: CampaignStatusButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(t(presentUserError({ code: data.error, status: res.status }), locale));
        return;
      }
      router.refresh();
    } catch {
      setError(t(presentUserError({ code: "NETWORK_ERROR" }), locale));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`min-h-[44px] rounded-lg px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          isDanger
            ? "border border-state-error-border bg-surface-card text-state-error-fg hover:bg-state-error-bg"
            : "bg-sage text-[var(--color-action-primary-fg)] hover:bg-sage-dark"
        }`}
      >
        {loading ? "…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-state-error-fg">{error}</p>}
    </div>
  );
}
