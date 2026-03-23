"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CampaignWithStats } from "@/lib/org-stats";
import { CampaignCard } from "./CampaignCard";

interface OrgCampaignsTabProps {
  orgId: string;
  campaigns: CampaignWithStats[];
  isManager: boolean;
  isHu: boolean;
}

export function OrgCampaignsTab({
  orgId,
  campaigns: initialCampaigns,
  isManager,
  isHu,
}: OrgCampaignsTabProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>(initialCampaigns);
  const [showNewForm, setShowNewForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const draftCampaigns = campaigns.filter((c) => c.status === "DRAFT");
  const closedCampaigns = campaigns.filter((c) => c.status === "CLOSED");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "ERROR");
        return;
      }
      const { campaign } = await res.json();
      const newCampaign: CampaignWithStats = {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description ?? null,
        status: campaign.status,
        createdAt: campaign.createdAt,
        closedAt: campaign.closedAt ?? null,
        creator: { username: null },
        participants: [],
        selfDoneCount: 0,
        observerDoneCount: 0,
        totalCount: 0,
      };
      setCampaigns((prev) => [newCampaign, ...prev]);
      setName("");
      setDescription("");
      setShowNewForm(false);
      router.refresh();
    } catch {
      setError(isHu ? "Hálózati hiba. Próbáld újra." : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Active campaigns */}
      <section>
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
          {isHu ? "// aktív körök" : "// active rounds"}
        </p>
        <h2 className="mb-5 font-fraunces text-xl text-ink">
          {isHu ? "Aktív kampányok" : "Active campaigns"}
          {activeCampaigns.length > 0 && (
            <span className="ml-2 font-sans text-sm font-normal text-ink-body/50">
              ({activeCampaigns.length})
            </span>
          )}
        </h2>

        {activeCampaigns.length === 0 ? (
          <div className="rounded-xl border border-sand bg-cream p-8 text-center">
            <p className="text-sm text-ink-body/60">
              {isHu
                ? "Nincs aktív kampány. Indíts egy vázlatból, vagy hozz létre újat!"
                : "No active campaigns. Activate a draft or create a new one!"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeCampaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                orgId={orgId}
                isHu={isHu}
                isManager={isManager}
                variant="active"
              />
            ))}
          </div>
        )}
      </section>

      {/* Draft campaigns */}
      {draftCampaigns.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex-1 border-t border-sand" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              {isHu ? "vázlatok" : "drafts"}
            </span>
            <div className="flex-1 border-t border-sand" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {draftCampaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                orgId={orgId}
                isHu={isHu}
                isManager={isManager}
                variant="draft"
              />
            ))}
          </div>
        </section>
      )}

      {/* New campaign CTA / Form */}
      {isManager && (
        <section>
          {!showNewForm ? (
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="group w-full rounded-2xl border-2 border-dashed border-sand bg-white p-8 text-center transition hover:border-sage/40 hover:bg-cream"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-bronze transition group-hover:bg-sage/10">
                  <svg
                    viewBox="0 0 16 16"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {isHu ? "Új 360° kampány" : "New 360° campaign"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-body">
                    {isHu
                      ? "Szervezett 360° visszajelzési kör indítása a csapatban"
                      : "Launch a structured 360° feedback round for your team"}
                  </p>
                </div>
                <span className="text-xs font-semibold text-bronze">
                  {isHu ? "Létrehozás →" : "Create →"}
                </span>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
              <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                {isHu ? "// új kampány" : "// new campaign"}
              </p>
              <h2 className="mb-5 font-fraunces text-xl text-ink">
                {isHu ? "Kampány létrehozása" : "Create campaign"}
              </h2>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink">
                    {isHu ? "Kampány neve" : "Campaign name"}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isHu ? "pl. Q1 2026 értékelés" : "e.g. Q1 2026 review"}
                    maxLength={100}
                    required
                    disabled={loading}
                    className="min-h-[44px] rounded-lg border border-sand bg-cream px-3 text-sm text-ink placeholder:text-muted focus:border-sage/40 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink">
                    {isHu ? "Leírás (opcionális)" : "Description (optional)"}
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={isHu ? "Rövid leírás a kampányról…" : "Brief description…"}
                    maxLength={500}
                    disabled={loading}
                    className="min-h-[44px] rounded-lg border border-sand bg-cream px-3 text-sm text-ink placeholder:text-muted focus:border-sage/40 focus:outline-none"
                  />
                </div>
                {error && (
                  <p className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="min-h-[44px] rounded-lg bg-sage px-5 text-sm font-semibold text-white transition hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? isHu ? "Létrehozás…" : "Creating…"
                      : isHu ? "Kampány létrehozása" : "Create campaign"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewForm(false);
                      setName("");
                      setDescription("");
                      setError(null);
                    }}
                    disabled={loading}
                    className="min-h-[44px] rounded-lg border border-sand bg-white px-5 text-sm font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze disabled:opacity-50"
                  >
                    {isHu ? "Mégse" : "Cancel"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      {/* Closed campaigns */}
      {closedCampaigns.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex-1 border-t border-sand" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              {isHu ? "lezárt körök" : "closed rounds"}
            </span>
            <div className="flex-1 border-t border-sand" />
          </div>
          <div className="rounded-2xl border border-sand bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 divide-y divide-transparent">
              {closedCampaigns.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  orgId={orgId}
                  isHu={isHu}
                  isManager={isManager}
                  variant="closed"
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
