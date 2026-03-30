"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export function RequestCreditsButton({
  orgId,
  locale,
}: {
  orgId: string;
  locale: Locale;
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
      <span className="min-h-[42px] inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-[11px] font-semibold text-emerald-700">
        {t("hiring.requestSent", locale)}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleRequest()}
      disabled={loading}
      className="min-h-[42px] inline-flex items-center rounded-xl border border-sage/35 bg-white px-4 text-[11px] font-semibold text-sage-dark transition hover:border-sage/55 hover:bg-sage-soft disabled:opacity-50"
    >
      {loading
        ? "…"
        : t("hiring.requestCredits", locale)}
    </button>
  );
}
