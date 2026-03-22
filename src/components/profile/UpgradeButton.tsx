"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UpgradeButtonProps {
  tier: string;
  label: string;
}

export function UpgradeButton({ tier, label }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        router.push(data.url);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#c8410a] px-6 text-sm font-semibold text-white transition hover:bg-[#b53a09] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "…" : label}
    </button>
  );
}
