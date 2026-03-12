"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OrgRenameFormProps {
  orgId: string;
  currentName: string;
  locale: string;
}

export function OrgRenameForm({ orgId, currentName, locale }: OrgRenameFormProps) {
  const router = useRouter();
  const isHu = locale !== "en";
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() === currentName) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        setError(isHu ? "Hiba történt." : "Something went wrong.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError(isHu ? "Hálózati hiba." : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
          {isHu ? "Szervezet neve" : "Organization name"}
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            maxLength={100}
            required
            className="min-h-[44px] rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-normal text-gray-900 focus:border-indigo-300 focus:outline-none"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading || name.trim() === currentName}
        className="min-h-[44px] rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "..." : isHu ? "Mentés" : "Save"}
      </button>
      {saved && (
        <p className="text-xs text-green-600">{isHu ? "Mentve." : "Saved."}</p>
      )}
      {error && (
        <p className="text-xs text-rose-600">{error}</p>
      )}
    </form>
  );
}
