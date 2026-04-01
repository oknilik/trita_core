"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { CampaignWithStats } from "@/lib/org-stats";
import { Card } from "@/components/ui/primitives/Card";
import { CampaignCard } from "./CampaignCard";
import { Button } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { SectionHeading } from "@/components/ui/primitives/SectionHeading";

interface OrgCampaignsTabProps {
  orgId: string;
  campaigns: CampaignWithStats[];
  isManager: boolean;
  canManageCampaigns: boolean;
  actionGateCopy?: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  } | null;
  isHu: boolean;
}

export function OrgCampaignsTab({
  orgId,
  campaigns: initialCampaigns,
  isManager,
  canManageCampaigns,
  actionGateCopy = null,
  isHu,
}: OrgCampaignsTabProps) {
  const router = useRouter();
  const loc: Locale = isHu ? "hu" : "en";
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
      setError(t("org.campaigns.networkError", loc));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Active campaigns */}
      <section>
        <SectionEyebrow className="mb-1">
          {t("org.campaigns.activeEyebrow", loc)}
        </SectionEyebrow>
        <SectionHeading className="mb-5">
          {t("org.campaigns.activeTitle", loc)}
          {activeCampaigns.length > 0 && (
            <span className="ml-2 font-sans text-sm font-normal text-ink-body/50">
              ({activeCampaigns.length})
            </span>
          )}
        </SectionHeading>

        {activeCampaigns.length === 0 ? (
          <div className="rounded-xl border border-sand bg-cream p-8 text-center">
            <p className="text-sm text-ink-body/60">
              {t("org.campaigns.noActive", loc)}
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
                isManager={canManageCampaigns}
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
            <SectionEyebrow as="span" tone="muted">
              {t("org.campaigns.draftsDivider", loc)}
            </SectionEyebrow>
            <div className="flex-1 border-t border-sand" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {draftCampaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                orgId={orgId}
                isHu={isHu}
                isManager={canManageCampaigns}
                variant="draft"
              />
            ))}
          </div>
        </section>
      )}

      {/* New campaign CTA / Form */}
      {isManager && canManageCampaigns && (
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
                    {t("org.campaigns.newCta", loc)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-body">
                    {t("org.campaigns.newCtaDesc", loc)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-bronze">
                  {t("org.campaigns.createLink", loc)}
                </span>
              </div>
            </button>
          ) : (
            <Card spacing="lg" className="md:p-8">
              <SectionEyebrow className="mb-1">
                {t("org.campaigns.newEyebrow", loc)}
              </SectionEyebrow>
              <SectionHeading className="mb-5">
                {t("org.campaigns.createTitle", loc)}
              </SectionHeading>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink">
                    {t("org.campaigns.nameLabel", loc)}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("org.campaigns.namePlaceholder", loc)}
                    maxLength={100}
                    required
                    disabled={loading}
                    className="min-h-[44px] rounded-lg border border-sand bg-cream px-3 text-sm text-ink placeholder:text-muted focus:border-sage/40 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink">
                    {t("org.campaigns.descLabel", loc)}
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("org.campaigns.descPlaceholder", loc)}
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
                  <Button
                    type="submit"
                    disabled={!name.trim()}
                    loading={loading}
                    variant="primary"
                  >
                    {loading
                      ? t("org.campaigns.creating", loc)
                      : t("org.campaigns.createButton", loc)}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowNewForm(false);
                      setName("");
                      setDescription("");
                      setError(null);
                    }}
                    disabled={loading}
                    variant="secondary"
                  >
                    {t("org.campaigns.cancel", loc)}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </section>
      )}

      {isManager && !canManageCampaigns && actionGateCopy && (
        <section>
          <Card spacing="lg" className="md:p-8">
            <SectionEyebrow className="mb-1">
              {isHu ? "Kampány akciók" : "Campaign actions"}
            </SectionEyebrow>
            <SectionHeading>{actionGateCopy.title}</SectionHeading>
            <p className="mt-2 text-sm text-ink-body">{actionGateCopy.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-lg bg-sand px-5 text-sm font-semibold text-muted">
                {t("org.campaigns.newCta", loc)}
              </span>
              <a
                href={actionGateCopy.ctaHref}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-sand bg-white px-5 text-sm font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze"
              >
                {actionGateCopy.ctaLabel}
              </a>
            </div>
          </Card>
        </section>
      )}

      {/* Closed campaigns */}
      {closedCampaigns.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex-1 border-t border-sand" />
            <SectionEyebrow as="span" tone="muted">
              {t("org.campaigns.closedDivider", loc)}
            </SectionEyebrow>
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
                  isManager={canManageCampaigns}
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
