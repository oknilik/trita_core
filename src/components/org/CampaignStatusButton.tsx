"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CampaignStatusButtonProps {
  orgId: string;
  campaignId: string;
  nextStatus: string;
  label: string;
  isDanger: boolean;
  /** Megerősítő szöveg a következményekkel — a szerver adja lokalizálva. */
  confirmMessage?: string;
}

export function CampaignStatusButton({
  orgId,
  campaignId,
  nextStatus,
  label,
  isDanger,
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
        const data = await res.json();
        setError(data.error ?? "ERROR");
        return;
      }
      router.refresh();
    } catch {
      setError("ERROR");
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
            : "bg-sage text-white hover:bg-sage-dark"
        }`}
      >
        {loading ? "…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-state-error-solid">{error}</p>}
    </div>
  );
}
