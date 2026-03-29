"use client";

import { useState } from "react";
import Link from "next/link";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

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

function statusBadge(status: string, loc: Locale) {
  if (status === "ACTIVE")
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        {t("org.list.statusActive", loc)}
      </span>
    );
  if (status === "CLOSED")
    return (
      <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-ink-body">
        {t("org.list.statusClosed", loc)}
      </span>
    );
  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      {t("org.list.statusDraft", loc)}
    </span>
  );
}

function AddMembersPanel({
  orgId,
  campaignId,
  members,
  loc,
  onAdded,
  onClose,
}: {
  orgId: string;
  campaignId: string;
  members: OrgMember[];
  loc: Locale;
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
      className="mt-2 rounded-lg border border-sand bg-cream p-3"
    >
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
        {t("org.list.addEyebrow", loc)}
      </p>
      {members.length === 0 ? (
        <p className="text-xs text-muted">
          {t("org.list.noMembers", loc)}
        </p>
      ) : (
        <div className="mb-3 max-h-40 overflow-y-auto space-y-1">
          {members.map((m) => (
            <label
              key={m.userId}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-sand/50"
            >
              <input
                type="checkbox"
                checked={selected.has(m.userId)}
                onChange={() => toggle(m.userId)}
                className="accent-sage"
              />
              <span className="text-sm text-ink">
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
          className="min-h-[36px] rounded-lg bg-sage px-4 text-xs font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? t("org.list.adding", loc)
            : tf("org.list.addButton", loc, { count: selected.size })}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[36px] rounded-lg border border-sand px-4 text-xs font-semibold text-ink-body transition hover:bg-sand"
        >
          {t("org.list.cancel", loc)}
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
  const loc: Locale = isHu ? "hu" : "en";
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
        <div className="mb-6 rounded-xl border border-sand bg-cream p-8 text-center">
          <p className="text-sm text-ink-body/60">
            {t("org.list.noCampaigns", loc)}
          </p>
        </div>
      ) : (
        <div className="mb-6 flex flex-col divide-y divide-sand">
          {campaigns.map((c) => (
            <div key={c.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/org/${orgId}/campaigns/${c.id}`}
                  className="group min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-bronze">
                    {c.name}
                  </p>
                  {c.description && (
                    <p className="mt-0.5 truncate text-xs text-ink-body/60">
                      {c.description}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-body/50">
                    {c._count.participants}{" "}
                    {t(c._count.participants === 1 ? "org.list.participantCount" : "org.list.participantsCount", loc)}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {statusBadge(c.status, loc)}
                  {canManage && c.status !== "CLOSED" && (
                    <button
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      className="min-h-[32px] rounded-lg border border-sand px-2.5 text-xs font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze"
                      title={t("org.list.manageTitle", loc)}
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
                  loc={loc}
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
        <div className="border-t border-sand pt-5">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
            {t("org.list.newEyebrow", loc)}
          </p>
          <h3 className="mb-3 text-sm font-semibold text-ink">
            {t("org.list.newTitle", loc)}
          </h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("org.list.namePlaceholder", loc)}
              maxLength={100}
              required
              className="min-h-[44px] rounded-lg border border-sand bg-cream px-3 text-sm text-ink placeholder:text-ink-body/40 focus:border-sage/40 focus:outline-none"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("org.list.descPlaceholder", loc)}
              maxLength={500}
              className="min-h-[44px] rounded-lg border border-sand bg-cream px-3 text-sm text-ink placeholder:text-ink-body/40 focus:border-sage/40 focus:outline-none"
            />
            {error && (
              <p className="text-xs text-rose-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="min-h-[44px] rounded-lg bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? t("org.list.creating", loc)
                : t("org.list.createButton", loc)}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
