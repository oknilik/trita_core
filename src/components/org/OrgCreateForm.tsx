"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OrgCreateFormProps {
  locale: string;
}

export function OrgCreateForm({ locale }: OrgCreateFormProps) {
  const router = useRouter();
  const isHu = locale !== "en";
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ALREADY_IN_ORG") {
          setError(isHu ? "Már tagja vagy egy szervezetnek." : "You already belong to an organization.");
        } else {
          setError(isHu ? "Hiba történt. Próbáld újra." : "Something went wrong. Please try again.");
        }
        return;
      }
      // New orgs start in PENDING_SETUP — go to wizard
      router.push(`/org/${data.org.id}/setup`);
    } catch {
      setError(isHu ? "Hálózati hiba. Próbáld újra." : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-2 text-sm font-semibold text-[#1a1814]">
        {isHu ? "Szervezet neve" : "Organization name"}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isHu ? "pl. Trita Kft." : "e.g. Acme Corp"}
          maxLength={100}
          required
          className="min-h-[44px] rounded-lg border border-[#e8e4dc] bg-white px-3 text-sm font-normal text-[#1a1814] focus:border-[#c8410a] focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="min-h-[44px] rounded-lg bg-[#c8410a] px-6 text-sm font-semibold text-white transition hover:bg-[#a8340a] disabled:cursor-not-allowed disabled:bg-[#e8e4dc] disabled:text-[#3d3a35]/50"
      >
        {loading
          ? isHu ? "Létrehozás..." : "Creating..."
          : isHu ? "Létrehozás" : "Create"}
      </button>
      {error && (
        <p className="w-full text-sm text-rose-600">{error}</p>
      )}
    </form>
  );
}
