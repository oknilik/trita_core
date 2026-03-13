"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CampaignStatusButtonProps {
  orgId: string;
  campaignId: string;
  nextStatus: string;
  label: string;
  isDanger: boolean;
}

export function CampaignStatusButton({
  orgId,
  campaignId,
  nextStatus,
  label,
  isDanger,
}: CampaignStatusButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
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
            ? "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
            : "bg-[#c8410a] text-white hover:bg-[#b53a09]"
        }`}
      >
        {loading ? "…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
