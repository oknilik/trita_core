"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
  userId: string;
  username: string | null;
  email: string | null;
}

interface AddParticipantButtonProps {
  orgId: string;
  campaignId: string;
  members: Member[];
  isHu: boolean;
}

export function AddParticipantButton({
  orgId,
  campaignId,
  members,
  isHu,
}: AddParticipantButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      setSelected(new Set());
      router.refresh();
    } catch {
      setError("ERROR");
    } finally {
      setLoading(false);
    }
  }

  if (members.length === 0) return null;

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="min-h-[44px] rounded-lg border border-[#e8e4dc] bg-white px-5 text-sm font-semibold text-[#3d3a35] transition hover:border-[#c8410a]/40 hover:text-[#c8410a]"
        >
          {isHu ? "+ Résztvevők hozzáadása" : "+ Add participants"}
        </button>
      ) : (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-4"
        >
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-[#a09a90]">
            {isHu ? "// résztvevők kiválasztása" : "// select participants"}
          </p>
          <div className="mb-4 max-h-56 overflow-y-auto space-y-1">
            {members.map((m) => (
              <label
                key={m.userId}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-[#e8e4dc]/50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(m.userId)}
                  onChange={() => toggle(m.userId)}
                  className="accent-[#c8410a]"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#1a1814]">
                    {m.username ?? m.email ?? "—"}
                  </p>
                  {m.username && m.email && (
                    <p className="truncate text-xs text-[#3d3a35]/60">{m.email}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
          {error && <p className="mb-3 text-xs text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || selected.size === 0}
              className="min-h-[44px] rounded-lg bg-[#c8410a] px-5 text-sm font-semibold text-white transition hover:bg-[#b53a09] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? isHu ? "Hozzáadás…" : "Adding…"
                : isHu
                  ? `Hozzáadás (${selected.size})`
                  : `Add (${selected.size})`}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setSelected(new Set()); setError(null); }}
              className="min-h-[44px] rounded-lg border border-[#e8e4dc] px-5 text-sm font-semibold text-[#3d3a35] transition hover:bg-[#e8e4dc]"
            >
              {isHu ? "Mégse" : "Cancel"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
