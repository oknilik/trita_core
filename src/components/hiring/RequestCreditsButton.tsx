"use client";

import { useState } from "react";

export function RequestCreditsButton({
  orgId,
  isHu,
}: {
  orgId: string;
  isHu: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRequest() {
    if (sent || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/hiring/request-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      if (res.ok) setSent(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <span className="min-h-[36px] inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-[11px] font-semibold text-emerald-700">
        {isHu ? "✓ Kérés elküldve" : "✓ Request sent"}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleRequest()}
      disabled={loading}
      className="min-h-[36px] inline-flex items-center rounded-lg border border-[#c8410a] bg-white px-4 text-[11px] font-semibold text-[#c8410a] transition hover:bg-[#fff5f0] disabled:opacity-50"
    >
      {loading
        ? "…"
        : isHu
          ? "Kredit igénylése az admintól"
          : "Request credits from admin"}
    </button>
  );
}
