"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { SerializedTeam } from "@/lib/org-stats";
import { TeamCreateForm } from "@/components/manager/TeamCreateForm";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { Card } from "@/components/ui/primitives/Card";
import { ChevronRightIcon } from "@/components/ui/icons";

interface OrgTeamsTabProps {
  teams: SerializedTeam[];
  orgId: string;
  locale: string;
  isManager: boolean;
  canCreateTeam: boolean;
  actionGateCopy?: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  } | null;
  isHu: boolean;
}

export function OrgTeamsTab({
  teams,
  orgId,
  locale,
  isManager,
  canCreateTeam,
  actionGateCopy = null,
}: OrgTeamsTabProps) {
  const loc = locale as Locale;
  // Fejléc-gombos létrehozás (UX-audit #18): az űrlap nem a lista alján ül,
  // hanem a szekció-fejléc „+ Új csapat" gombjára nyíló panelben.
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Fejléc: cím + elsődleges akció egy sorban */}
      {isManager && canCreateTeam ? (
        <div className="flex items-center justify-between gap-3">
          <SectionEyebrow>{t("org.teams.newEyebrow", loc)}</SectionEyebrow>
          <button
            type="button"
            onClick={() => setCreateOpen((v) => !v)}
            aria-expanded={createOpen}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-action-primary-bg px-4 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
          >
            <span aria-hidden>{createOpen ? "×" : "+"}</span>
            {t("org.teams.newTitle", loc)}
          </button>
        </div>
      ) : null}

      {isManager && canCreateTeam && createOpen && (
        <Card spacing="lg" className="md:p-8">
          <h3 className="mb-4 text-sm font-semibold text-ink">
            {t("org.teams.newTitle", loc)}
          </h3>
          <TeamCreateForm locale={locale as import("@/lib/i18n").Locale} orgId={orgId} />
        </Card>
      )}

      {/* Teams grid */}
      {teams.length === 0 ? (
        <div className="rounded-xl border border-sand bg-cream p-8 text-center">
          <p className="text-sm text-ink-body/60">
            {t("org.teams.noTeams", loc)}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/team/${team.id}`}
              className="group flex items-center justify-between rounded-xl border border-sand bg-surface-card p-4 shadow-sm transition-all hover:border-sage/30 hover:bg-cream"
            >
              <div>
                <p className="font-semibold text-ink transition-colors group-hover:text-[var(--color-accent-primary-strong)]">
                  {team.name}
                </p>
                <p className="text-xs text-ink-body/60">
                  {team._count.members}{" "}
                  {t(team._count.members === 1 ? "org.teams.memberCount" : "org.teams.membersCount", loc)}
                </p>
              </div>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent-primary-strong)]" />
            </Link>
          ))}
        </div>
      )}

      {isManager && !canCreateTeam && actionGateCopy && (
        <Card spacing="lg" className="md:p-8">
          <SectionEyebrow className="mb-1">
            {t("org.teams.newEyebrow", loc)}
          </SectionEyebrow>
          <h3 className="mb-2 text-sm font-semibold text-ink">
            {actionGateCopy.title}
          </h3>
          <p className="mb-4 text-sm text-ink-body">{actionGateCopy.description}</p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-lg bg-sand px-6 text-sm font-semibold text-muted">
              {t("org.teams.newTitle", loc)}
            </span>
            <a
              href={actionGateCopy.ctaHref}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-sand bg-surface-card px-6 text-sm font-semibold text-ink-body transition hover:border-sage/40 hover:text-[var(--color-accent-primary-strong)]"
            >
              {actionGateCopy.ctaLabel}
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
