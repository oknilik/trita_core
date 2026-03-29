"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { SerializedTeam } from "@/lib/org-stats";
import { TeamCreateForm } from "@/components/manager/TeamCreateForm";

interface OrgTeamsTabProps {
  teams: SerializedTeam[];
  orgId: string;
  locale: string;
  isManager: boolean;
  isHu: boolean;
}

export function OrgTeamsTab({ teams, orgId, locale, isManager }: OrgTeamsTabProps) {
  const loc = locale as Locale;

  return (
    <div className="flex flex-col gap-6">
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
              className="group flex items-center justify-between rounded-xl border border-sand bg-white p-4 shadow-sm transition-all hover:border-sage/30 hover:bg-cream"
            >
              <div>
                <p className="font-semibold text-ink transition-colors group-hover:text-bronze">
                  {team.name}
                </p>
                <p className="text-xs text-ink-body/60">
                  {team._count.members}{" "}
                  {t(team._count.members === 1 ? "org.teams.memberCount" : "org.teams.membersCount", loc)}
                </p>
              </div>
              <span className="font-mono text-xs text-bronze opacity-0 transition-opacity group-hover:opacity-100">
                →
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Create form for managers */}
      {isManager && (
        <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
            {t("org.teams.newEyebrow", loc)}
          </p>
          <h3 className="mb-4 text-sm font-semibold text-ink">
            {t("org.teams.newTitle", loc)}
          </h3>
          <TeamCreateForm locale={locale as import("@/lib/i18n").Locale} orgId={orgId} />
        </div>
      )}
    </div>
  );
}
