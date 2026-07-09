"use client";
import { useState } from "react";

export function BillingPortalButton({ isHu }: { isHu: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex min-h-[40px] items-center rounded-lg border border-sand bg-white px-4 text-xs font-semibold text-ink-body hover:border-sage hover:text-bronze transition-colors disabled:opacity-60"
    >
      {loading
        ? "..."
        : isHu
        ? "Számlázás kezelése →"
        : "Manage billing →"}
    </button>
  );
}
