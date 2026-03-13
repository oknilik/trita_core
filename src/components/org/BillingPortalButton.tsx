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
      className="inline-flex min-h-[40px] items-center rounded-lg border border-[#e8e4dc] bg-white px-4 text-xs font-semibold text-[#3d3a35] hover:border-[#c8410a] hover:text-[#c8410a] transition-colors disabled:opacity-60"
    >
      {loading
        ? "..."
        : isHu
        ? "Számlázás kezelése →"
        : "Manage billing →"}
    </button>
  );
}
