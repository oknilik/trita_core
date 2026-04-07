"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UpgradeButtonProps {
  tier: string;
  label: string;
}

export function UpgradeButton({ tier, label }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setLoading(true);
    router.push(`/billing/checkout?tier=${encodeURIComponent(tier)}`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "…" : label}
      </button>
      {error && (
        <p className="mt-2 text-xs text-rose-600">{error}</p>
      )}
    </div>
  );
}
