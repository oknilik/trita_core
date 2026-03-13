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

interface OrgMember {
  id: string;
  userId: string;
  user: { username: string | null; email: string | null };
}

interface CampaignListProps {
  orgId: string;
  campaigns: Campaign[];
  members: OrgMember[];
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

function AddMembersPanel({
  orgId,
  campaignId,
  members,
  isHu,
  onAdded,
  onClose,
}: {
  orgId: string;
  campaignId: string;
  members: OrgMember[];
  isHu: boolean;
  onAdded: (count: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/campaigns/${campaignId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selected) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "ERROR");
        return;
      }
      onAdded(selected.size);
      onClose();
    } catch {
      setError("ERROR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleAdd}
      onClick={(e) => e.stopPropagation()}
      className="mt-2 rounded-lg border border-[#e8e4dc] bg-[#faf9f6] p-3"
    >
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-[#a09a90]">
        {isHu ? "// résztvevők hozzáadása" : "// add participants"}
      </p>
      {members.length === 0 ? (
        <p className="text-xs text-[#a09a90]">
          {isHu ? "Nincsenek tagok." : "No members."}
        </p>
      ) : (
        <div className="mb-3 max-h-40 overflow-y-auto space-y-1">
          {members.map((m) => (
            <label
              key={m.userId}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-[#e8e4dc]/50"
            >
              <input
                type="checkbox"
                checked={selected.has(m.userId)}
                onChange={() => toggle(m.userId)}
                className="accent-[#c8410a]"
              />
              <span className="text-sm text-[#1a1814]">
                {m.user.username ?? m.user.email ?? "—"}
              </span>
            </label>
          ))}
        </div>
      )}
      {error && <p className="mb-2 text-xs text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || selected.size === 0}
          className="min-h-[36px] rounded-lg bg-[#c8410a] px-4 text-xs font-semibold text-white transition hover:bg-[#b53a09] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? isHu ? "Hozzáadás…" : "Adding…"
            : isHu ? `Hozzáadás (${selected.size})` : `Add (${selected.size})`}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[36px] rounded-lg border border-[#e8e4dc] px-4 text-xs font-semibold text-[#3d3a35] transition hover:bg-[#e8e4dc]"
        >
          {isHu ? "Mégse" : "Cancel"}
        </button>
      </div>
    </form>
  );
}

export function CampaignList({
  orgId,
  campaigns: initialCampaigns,
  members,
  canManage,
  isHu,
}: CampaignListProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
            <div key={c.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/org/${orgId}/campaigns/${c.id}`}
                  className="group min-w-0 flex-1"
                >
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
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {statusBadge(c.status, isHu)}
                  {canManage && c.status !== "CLOSED" && (
                    <button
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      className="min-h-[32px] rounded-lg border border-[#e8e4dc] px-2.5 text-xs font-semibold text-[#3d3a35] transition hover:border-[#c8410a]/40 hover:text-[#c8410a]"
                      title={isHu ? "Résztvevők kezelése" : "Manage participants"}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
              {expandedId === c.id && (
                <AddMembersPanel
                  orgId={orgId}
                  campaignId={c.id}
                  members={members}
                  isHu={isHu}
                  onAdded={(count) => {
                    setCampaigns((prev) =>
                      prev.map((x) =>
                        x.id === c.id
                          ? { ...x, _count: { participants: x._count.participants + count } }
                          : x
                      )
                    );
                  }}
                  onClose={() => setExpandedId(null)}
                />
              )}
            </div>
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
              <p className="text-xs text-rose-600">{error}</p>
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
