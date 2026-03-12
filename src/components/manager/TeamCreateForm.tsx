"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

interface TeamCreateFormProps {
  locale: Locale;
  orgId?: string;
}

export function TeamCreateForm({ locale, orgId }: TeamCreateFormProps) {
  const isHu = locale !== "en";
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), ...(orgId ? { orgId } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "ERROR");
        return;
      }
      const { team } = await res.json();
      router.push(`/team/${team.id}`);
    } catch {
      setError("ERROR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">
          {isHu ? "Csapat neve" : "Team name"}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isHu ? "pl. Marketing csapat" : "e.g. Marketing team"}
          maxLength={80}
          className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-normal text-gray-900 focus:border-indigo-300 focus:outline-none"
          disabled={loading}
        />
        {error && (
          <p className="text-xs text-rose-600">
            {isHu ? "Hiba. Próbáld újra." : "Something went wrong. Please try again."}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="min-h-[44px] rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        {loading
          ? isHu ? "Létrehozás…" : "Creating…"
          : isHu ? "Létrehozás" : "Create team"}
      </button>
    </form>
  );
}
