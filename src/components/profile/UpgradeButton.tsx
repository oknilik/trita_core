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

  async function handleClick() {
    setLoading(true);
    setError(null);
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
        setError(data.error === "PRICE_NOT_CONFIGURED"
          ? "Ez a csomag jelenleg nem elérhető."
          : "Hiba történt. Próbáld újra.");
        setLoading(false);
      }
    } catch {
      setError("Hiba történt. Próbáld újra.");
      setLoading(false);
    }
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
