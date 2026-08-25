"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { SerializedTeam } from "@/lib/org-stats";
import { TeamCreateForm } from "@/components/manager/TeamCreateForm";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { Card } from "@/components/ui/primitives/Card";
import { ChevronRightIcon, RoleClusterIcon } from "@/components/ui/icons";

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
  isHu,
}: OrgTeamsTabProps) {
  const loc = locale as Locale;
  // Fejléc-gombos létrehozás (UX-audit #18): az űrlap nem a lista alján ül,
  // hanem a szekció-fejléc „+ Új csapat" gombjára nyíló panelben.
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Fejléc: a team-nézettel azonos címhierarchia + elsődleges akció. */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionEyebrow tone="org">{isHu ? "csapatok" : "teams"}</SectionEyebrow>
          <h2 className="mt-1 font-fraunces text-3xl text-ink">
            {isHu ? "Csapatok" : "Teams"}{" "}
            <span className="font-sans text-sm font-normal text-muted">({teams.length})</span>
          </h2>
        </div>
        {isManager && canCreateTeam ? (
          <button
            type="button"
            onClick={() => setCreateOpen((v) => !v)}
            aria-expanded={createOpen}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-action-primary-bg px-4 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
          >
            <span aria-hidden>{createOpen ? "×" : "+"}</span>
            {t("org.teams.newTitle", loc)}
          </button>
        ) : null}
      </div>

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/team/${team.id}`}
              className="group flex min-h-44 flex-col justify-between gap-5 rounded-2xl border border-surface-org-border bg-surface-card p-5 shadow-[var(--ui-shadow-sm)] transition hover:border-[var(--color-layer-org-bright)]/40 hover:shadow-[var(--ui-shadow-md)]"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-layer-org-soft)] text-[var(--color-layer-org-bright)]">
                    <RoleClusterIcon />
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg text-muted transition group-hover:bg-[var(--color-layer-org-soft)] group-hover:text-[var(--color-layer-org-bright)]">
                    <ChevronRightIcon className="h-4 w-4" />
                  </span>
                </div>
                <h3 className="mt-4 truncate text-caption font-semibold text-ink transition-colors group-hover:text-[var(--color-layer-org-bright)]">
                  {team.name}
                </h3>
                <p className="mt-1 text-note text-muted">
                  {team._count.members}{" "}
                  {t(team._count.members === 1 ? "org.teams.memberCount" : "org.teams.membersCount", loc)}
                </p>
              </div>
              <span
                className={[
                  "inline-flex self-start rounded-full px-2.5 py-1 text-micro font-semibold",
                  team.hasPublishedReport
                    ? "bg-state-success-bg text-state-success-fg"
                    : "bg-surface-muted text-muted",
                ].join(" ")}
              >
                {team.hasPublishedReport
                  ? isHu
                    ? "Riport elérhető"
                    : "Report available"
                  : isHu
                    ? "Még nincs publikált riport"
                    : "No published report yet"}
              </span>
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
