"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GenerateOutputButtonProps {
  clientId: string;
  locale: string;
}

export function GenerateOutputButton({ clientId, locale }: GenerateOutputButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const label = locale === "en" ? "Generate debrief" : "Debrief generálása";
  const loadingLabel = locale === "en" ? "Generating…" : "Generálás…";
  const cachedLabel = locale === "en" ? "Open debrief" : "Debrief megnyitása";
  const errorGeneric = locale === "en" ? "Generation failed. Please try again." : "Generálás sikertelen. Kérlek próbáld újra.";

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/manager/output/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(errorGeneric);
      } else {
        // Encode the cacheKey so slashes in the key become URL-safe
        const encoded = encodeURIComponent(data.cacheKey);
        router.push(`/manager/outputs/${encoded}`);
      }
    } catch {
      setError(errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="min-h-[44px] rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-sm font-semibold text-white shadow transition hover:shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? loadingLabel : label}
      </button>
      {loading && (
        <p className="text-xs text-gray-500">
          {locale === "en"
            ? "This may take 10–30 seconds for the first time."
            : "Ez az első alkalommal 10–30 másodpercet vehet igénybe."}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

interface OpenOutputButtonProps {
  cacheKey: string;
  locale: string;
}

export function OpenOutputButton({ cacheKey, locale }: OpenOutputButtonProps) {
  const router = useRouter();
  const label = locale === "en" ? "Open debrief" : "Debrief megnyitása";

  return (
    <button
      onClick={() => router.push(`/manager/outputs/${encodeURIComponent(cacheKey)}`)}
      className="min-h-[44px] rounded-lg border border-indigo-600 px-6 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
    >
      {label}
    </button>
  );
}
