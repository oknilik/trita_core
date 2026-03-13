"use client";

import { useState } from "react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  closedAt: string | null;
  creator: { username: string | null };
  _count: { participants: number };
}

interface CampaignListProps {
  orgId: string;
  campaigns: Campaign[];
  canManage: boolean;
  isHu: boolean;
}

function statusBadge(status: string, isHu: boolean) {
  if (status === "ACTIVE")
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        {isHu ? "Aktív" : "Active"}
      </span>
    );
  if (status === "CLOSED")
    return (
      <span className="rounded-full bg-[#e8e4dc] px-2.5 py-0.5 text-xs font-semibold text-[#3d3a35]">
        {isHu ? "Lezárva" : "Closed"}
      </span>
    );
  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      {isHu ? "Vázlat" : "Draft"}
    </span>
  );
}

export function CampaignList({
  orgId,
  campaigns: initialCampaigns,
  canManage,
  isHu,
}: CampaignListProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "ERROR");
        return;
      }
      const { campaign } = await res.json();
      setCampaigns((prev) => [
        {
          ...campaign,
          creator: { username: null },
          _count: { participants: 0 },
        },
        ...prev,
      ]);
      setName("");
      setDescription("");
    } catch {
      setError("ERROR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {campaigns.length === 0 ? (
        <div className="mb-6 rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-8 text-center">
          <p className="text-sm text-[#3d3a35]/60">
            {isHu
              ? "Még nincs 360° kampány. Hozz létre egyet lentebb!"
              : "No 360° campaigns yet. Create one below!"}
          </p>
        </div>
      ) : (
        <div className="mb-6 flex flex-col divide-y divide-[#e8e4dc]">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/org/${orgId}/campaigns/${c.id}`}
              className="group flex items-center justify-between gap-3 py-3 transition-colors hover:text-[#c8410a]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1a1814] transition-colors group-hover:text-[#c8410a]">
                  {c.name}
                </p>
                {c.description && (
                  <p className="mt-0.5 truncate text-xs text-[#3d3a35]/60">
                    {c.description}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-[#3d3a35]/50">
                  {c._count.participants}{" "}
                  {isHu ? "résztvevő" : c._count.participants === 1 ? "participant" : "participants"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {statusBadge(c.status, isHu)}
                <span className="font-mono text-xs text-[#c8410a] opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {canManage && (
        <div className="border-t border-[#e8e4dc] pt-5">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">
            {isHu ? "// új kampány" : "// new campaign"}
          </p>
          <h3 className="mb-3 text-sm font-semibold text-[#1a1814]">
            {isHu ? "Új 360° kampány" : "New 360° campaign"}
          </h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isHu ? "Kampány neve" : "Campaign name"}
              maxLength={100}
              required
              className="min-h-[44px] rounded-lg border border-[#e8e4dc] bg-[#faf9f6] px-3 text-sm text-[#1a1814] placeholder:text-[#3d3a35]/40 focus:border-[#c8410a]/40 focus:outline-none"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isHu ? "Leírás (opcionális)" : "Description (optional)"}
              maxLength={500}
              className="min-h-[44px] rounded-lg border border-[#e8e4dc] bg-[#faf9f6] px-3 text-sm text-[#1a1814] placeholder:text-[#3d3a35]/40 focus:border-[#c8410a]/40 focus:outline-none"
            />
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="min-h-[44px] rounded-lg bg-[#c8410a] px-5 text-sm font-semibold text-white transition hover:bg-[#b53a09] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? isHu ? "Létrehozás…" : "Creating…"
                : isHu ? "Kampány létrehozása" : "Create campaign"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
