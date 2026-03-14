"use client";

import Link from "next/link";
import type { SerializedTeam } from "@/lib/org-stats";
import { TeamCreateForm } from "@/components/manager/TeamCreateForm";

interface OrgTeamsTabProps {
  teams: SerializedTeam[];
  orgId: string;
  locale: string;
  isManager: boolean;
  isHu: boolean;
}

export function OrgTeamsTab({ teams, orgId, locale, isManager, isHu }: OrgTeamsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Teams grid */}
      {teams.length === 0 ? (
        <div className="rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-8 text-center">
          <p className="text-sm text-[#3d3a35]/60">
            {isHu
              ? "Még nincs csapat. Hozz létre egyet lentebb!"
              : "No teams yet. Create one below!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/team/${team.id}`}
              className="group flex items-center justify-between rounded-xl border border-[#e8e4dc] bg-white p-4 shadow-sm transition-all hover:border-[#c8410a]/30 hover:bg-[#faf9f6]"
            >
              <div>
                <p className="font-semibold text-[#1a1814] transition-colors group-hover:text-[#c8410a]">
                  {team.name}
                </p>
                <p className="text-xs text-[#3d3a35]/60">
                  {team._count.members}{" "}
                  {isHu ? "tag" : team._count.members === 1 ? "member" : "members"}
                </p>
              </div>
              <span className="font-mono text-xs text-[#c8410a] opacity-0 transition-opacity group-hover:opacity-100">
                →
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Create form for managers */}
      {isManager && (
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c8410a]">
            {isHu ? "// új csapat" : "// new team"}
          </p>
          <h3 className="mb-4 text-sm font-semibold text-[#1a1814]">
            {isHu ? "Új csapat létrehozása" : "Create a new team"}
          </h3>
          <TeamCreateForm locale={locale as import("@/lib/i18n").Locale} orgId={orgId} />
        </div>
      )}
    </div>
  );
}
