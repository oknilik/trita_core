"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { CampaignWithStats } from "@/lib/org-stats";
import { Card } from "@/components/ui/primitives/Card";
import { CampaignCard } from "./CampaignCard";
import { EmptyState } from "@/components/ui/primitives/EmptyState";
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
  const loc: Locale = isHu ? "hu" : "en";
  const campaigns = initialCampaigns;

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const draftCampaigns = campaigns.filter((c) => c.status === "DRAFT");
  const closedCampaigns = campaigns.filter((c) => c.status === "CLOSED");

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
          <EmptyState
            title={t("org.campaigns.noActive", loc)}
            description={isHu ? "Indíts egy új mérést, hogy megjelenjen itt." : "Create a new measurement and it will appear here."}
          />
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

      {/* New campaign CTA — a wizardra visz (típusválasztó + csapat-célzás) */}
      {isManager && canManageCampaigns && (
        <section>
          <Link
            href={`/org/${orgId}/campaigns/new`}
            className="group block w-full rounded-2xl border-2 border-dashed border-sand bg-surface-card p-8 text-center transition hover:border-sage/40 hover:bg-cream"
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
          </Link>
        </section>
      )}

      {isManager && !canManageCampaigns && actionGateCopy && (
        <section>
          <Card spacing="lg" className="md:p-8">
            <SectionEyebrow className="mb-1">
              {isHu ? "Mérés akciók" : "Measurement actions"}
            </SectionEyebrow>
            <SectionHeading>{actionGateCopy.title}</SectionHeading>
            <p className="mt-2 text-sm text-ink-body">{actionGateCopy.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-lg bg-sand px-5 text-sm font-semibold text-muted">
                {t("org.campaigns.newCta", loc)}
              </span>
              <a
                href={actionGateCopy.ctaHref}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-sand bg-surface-card px-5 text-sm font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze"
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
          <div className="rounded-2xl border border-sand bg-surface-card shadow-sm overflow-hidden">
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
