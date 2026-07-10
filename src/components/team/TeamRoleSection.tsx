"use client";

import { useMemo } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { estimateTeamRolesFromHexaco } from "@/lib/team-role-estimate";
import { TEAM_ROLES, getTopRoles } from "@/lib/team-role-scoring";
import type { TeamRoleCode, TeamRoleScores } from "@/lib/team-role-scoring";
import type { SerializedTeamMember } from "@/lib/team-stats";

interface MemberWithTeamRole {
  id: string;
  userId: string;
  displayName: string;
  hasScores: boolean;
  teamRoleScores: TeamRoleScores | null;
  top3: { role: TeamRoleCode; score: number }[];
  primaryRole: TeamRoleCode | null;
  /** "questionnaire" = real fill-out, "estimate" = derived from HEXACO */
  source: "questionnaire" | "estimate" | null;
}

const ROLE_COLORS: Record<TeamRoleCode, string> = {
  PL: "var(--color-visual-gradient-indigo)",
  RI: "#0ea5e9",
  CO: "var(--color-state-success-strong)",
  SH: "var(--color-state-warning-strong)",
  ME: "var(--color-visual-gradient-violet)",
  TW: "#ec4899",
  IM: "#14b8a6",
  CF: "#f97316",
  SP: "#84cc16",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function RoleChip({
  role,
  isHu,
  size = "sm",
}: {
  role: TeamRoleCode;
  isHu: boolean;
  size?: "sm" | "xs";
}) {
  const color = ROLE_COLORS[role];
  const label = isHu ? TEAM_ROLES[role].hu : TEAM_ROLES[role].en;
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${
        size === "xs"
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-1 text-xs"
      }`}
      style={{ backgroundColor: `${color}18`, color }}
    >
      {label}
    </span>
  );
}

// ── TeamRoleCompletionStatus ────────────────────────────────────────────────────

function TeamRoleCompletionStatus({
  members,
  isHu,
}: {
  members: MemberWithTeamRole[];
  isHu: boolean;
}) {
  const withScores = members.filter((m) => m.hasScores).length;
  const questionnaireCount = members.filter((m) => m.source === "questionnaire").length;
  const estimateCount = members.filter((m) => m.source === "estimate").length;
  const total = members.length;
  const pct = total > 0 ? Math.round((withScores / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-sand bg-cream p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            {t("teamComp.profileStatus", isHu ? "hu" : "en")}
          </p>
          <p className="mt-0.5 text-xs text-ink-body">
            {t("teamComp.profileStatusDesc", isHu ? "hu" : "en").replace("{done}", String(withScores)).replace("{total}", String(total))}
          </p>
          <p className="mt-1 text-xs text-muted">
            {isHu
              ? `${questionnaireCount} valódi kitöltés · ${estimateCount} HEXACO-becslés`
              : `${questionnaireCount} real fill-out · ${estimateCount} HEXACO estimate`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-sm font-semibold text-ink">
            {pct}%
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-sage transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RoleComposition ───────────────────────────────────────────────────────────

function RoleComposition({
  members,
  isHu,
}: {
  members: MemberWithTeamRole[];
  isHu: boolean;
}) {
  const roleCounts = useMemo(() => {
    const counts: Partial<Record<TeamRoleCode, number>> = {};
    for (const m of members) {
      if (!m.primaryRole) continue;
      counts[m.primaryRole] = (counts[m.primaryRole] ?? 0) + 1;
    }
    return counts;
  }, [members]);

  const sorted = (Object.entries(roleCounts) as [TeamRoleCode, number][])
    .sort((a, b) => b[1] - a[1]);

  const withData = members.filter((m) => m.primaryRole).length;

  if (withData === 0) {
    return (
      <p className="text-sm text-muted">
        {t("teamComp.noRoleData", isHu ? "hu" : "en")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map(([role, count]) => {
        const pct = Math.round((count / withData) * 100);
        return (
          <div key={role} className="flex items-center gap-3">
            <div className="w-28 shrink-0">
              <RoleChip role={role} isHu={isHu} size="xs" />
            </div>
            <div className="flex flex-1 items-center gap-2">
              <div className="flex-1 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: ROLE_COLORS[role] }}
                />
              </div>
              <span className="w-6 text-right font-mono text-xs text-ink-body">
                {count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── RoleAlerts ───────────────────────────────────────────────────────────────

const ALL_ROLES = Object.keys(TEAM_ROLES) as TeamRoleCode[];

function RoleAlerts({
  members,
  isHu,
}: {
  members: MemberWithTeamRole[];
  isHu: boolean;
}) {
  const withData = members.filter((m) => m.primaryRole);

  if (withData.length < 2) return null;

  const roleCounts: Record<TeamRoleCode, number> = {} as Record<TeamRoleCode, number>;
  for (const r of ALL_ROLES) roleCounts[r] = 0;
  for (const m of withData) {
    if (m.primaryRole) roleCounts[m.primaryRole]++;
  }

  const missing = ALL_ROLES.filter((r) => roleCounts[r] === 0);
  const overrepresented = ALL_ROLES.filter(
    (r) => roleCounts[r] >= 3 && withData.length >= 5,
  );

  if (missing.length === 0 && overrepresented.length === 0) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10l5 5 9-9" />
        </svg>
        <p className="text-sm text-emerald-700">
          {t("teamComp.wellDiversified", isHu ? "hu" : "en")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {missing.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            {t("teamComp.missingRoles", isHu ? "hu" : "en")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((r) => (
              <RoleChip key={r} role={r} isHu={isHu} size="xs" />
            ))}
          </div>
        </div>
      )}
      {overrepresented.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {t("teamComp.overrepresentedRoles", isHu ? "hu" : "en")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {overrepresented.map((r) => (
              <RoleChip key={r} role={r} isHu={isHu} size="xs" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── IndividualTeamRoleTable ─────────────────────────────────────────────────────

function IndividualTeamRoleTable({
  members,
  isHu,
}: {
  members: MemberWithTeamRole[];
  isHu: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-sand">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sand bg-cream">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-body">
              {t("teamComp.thMember", isHu ? "hu" : "en")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-body">
              {t("teamComp.thPrimary", isHu ? "hu" : "en")}
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-body sm:table-cell">
              {t("teamComp.thSecondary", isHu ? "hu" : "en")}
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-body md:table-cell">
              {t("teamComp.thSupporting", isHu ? "hu" : "en")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sand bg-white">
          {members.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold text-ink">
                  {m.displayName}
                </span>
                {m.source === "questionnaire" ? (
                  <span className="ml-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    {isHu ? "kitöltött" : "completed"}
                  </span>
                ) : m.source === "estimate" ? (
                  <span className="ml-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    {isHu ? "becslés" : "estimate"}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3">
                {m.top3[0] ? (
                  <RoleChip role={m.top3[0].role} isHu={isHu} size="xs" />
                ) : (
                  <span className="text-xs text-muted">
                    {t("teamComp.noData", isHu ? "hu" : "en")}
                  </span>
                )}
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                {m.top3[1] ? (
                  <RoleChip role={m.top3[1].role} isHu={isHu} size="xs" />
                ) : null}
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                {m.top3[2] ? (
                  <RoleChip role={m.top3[2].role} isHu={isHu} size="xs" />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── CrossAnalysis ─────────────────────────────────────────────────────────────

// Action-oriented roles: SH, IM, CF
// People-oriented roles: CO, TW, RI
// Thought-oriented roles: PL, ME, SP

const ROLE_CATEGORY: Record<TeamRoleCode, "action" | "people" | "thought"> = {
  SH: "action", IM: "action", CF: "action",
  CO: "people", TW: "people", RI: "people",
  PL: "thought", ME: "thought", SP: "thought",
};

function CrossAnalysis({
  members,
  isHu,
}: {
  members: MemberWithTeamRole[];
  isHu: boolean;
}) {
  const withData = members.filter((m) => m.primaryRole);
  if (withData.length < 2) return null;

  const categoryCounts = { action: 0, people: 0, thought: 0 };
  for (const m of withData) {
    if (m.primaryRole) {
      categoryCounts[ROLE_CATEGORY[m.primaryRole]]++;
    }
  }
  const total = withData.length;

  const loc: Locale = isHu ? "hu" : "en";
  const categories = [
    {
      key: "action" as const,
      labelKey: "teamComp.actionOriented",
      roles: ["SH", "IM", "CF"] as TeamRoleCode[],
      color: "var(--color-state-warning-strong)",
    },
    {
      key: "people" as const,
      labelKey: "teamComp.peopleOriented",
      roles: ["CO", "TW", "RI"] as TeamRoleCode[],
      color: "var(--color-state-success-strong)",
    },
    {
      key: "thought" as const,
      labelKey: "teamComp.thoughtOriented",
      roles: ["PL", "ME", "SP"] as TeamRoleCode[],
      color: "var(--color-visual-gradient-indigo)",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {categories.map((cat) => {
        const count = categoryCounts[cat.key];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div
            key={cat.key}
            className="flex flex-col gap-2 rounded-xl border border-sand bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">
                {t(cat.labelKey, loc)}
              </span>
              <span className="font-mono text-xs text-ink-body">{pct}%</span>
            </div>
            <div className="flex-1 overflow-hidden rounded-full bg-sand">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: cat.color }}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {cat.roles.map((r) => (
                <RoleChip key={r} role={r} isHu={isHu} size="xs" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main: TeamRoleSection ───────────────────────────────────────────────────

interface TeamRoleSectionProps {
  members: SerializedTeamMember[];
  isHu: boolean;
}

export function TeamRoleSection({ members, isHu }: TeamRoleSectionProps) {
  const loc: Locale = isHu ? "hu" : "en";
  const membersWithTeamRole = useMemo<MemberWithTeamRole[]>(() => {
    return members.map((m) => {
      // Real questionnaire result always wins over the HEXACO estimate
      if (m.teamRoleScores && m.teamRoleSource === "questionnaire") {
        const teamRoleScores = m.teamRoleScores as TeamRoleScores;
        const top3 = getTopRoles(teamRoleScores, 3);
        return {
          id: m.id,
          userId: m.userId,
          displayName: m.displayName,
          hasScores: true,
          teamRoleScores,
          top3,
          primaryRole: top3[0]?.role ?? null,
          source: "questionnaire" as const,
        };
      }

      const hasHexaco = m.scores && "H" in m.scores && "X" in m.scores;
      if (!hasHexaco) {
        return {
          id: m.id,
          userId: m.userId,
          displayName: m.displayName,
          hasScores: false,
          teamRoleScores: null,
          top3: [],
          primaryRole: null,
          source: null,
        };
      }
      const teamRoleScores = estimateTeamRolesFromHexaco(
        m.scores as Record<"H" | "E" | "X" | "A" | "C" | "O", number>,
      );
      const top3 = getTopRoles(teamRoleScores, 3);
      return {
        id: m.id,
        userId: m.userId,
        displayName: m.displayName,
        hasScores: true,
        teamRoleScores,
        top3,
        primaryRole: top3[0]?.role ?? null,
        source: "estimate" as const,
      };
    });
  }, [members]);

  return (
    <div className="flex flex-col gap-8 py-6">
      <div>
        <SectionEyebrow className="text-[11px] tracking-[2px]">
          {"// "}
          {t("teamComp.estimatedRolesEyebrow", loc)}
        </SectionEyebrow>
        <h2 className="mt-1 font-fraunces text-2xl text-ink">
          {t("teamComp.teamRoleTitle", loc)}
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-body">
          {t("teamComp.teamRoleDesc", loc)}
        </p>
      </div>

      {/* Completion status */}
      <TeamRoleCompletionStatus members={membersWithTeamRole} isHu={isHu} />

      {/* Role composition */}
      <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
        <SectionEyebrow as="h3" className="mb-1 text-[11px] tracking-[2px]">
          {"// "}
          {t("teamComp.roleDistributionEyebrow", loc)}
        </SectionEyebrow>
        <h4 className="mb-5 font-fraunces text-xl text-ink">
          {t("teamComp.roleCompositionTitle", loc)}
        </h4>
        <RoleComposition members={membersWithTeamRole} isHu={isHu} />
      </section>

      {/* Alerts */}
      <section>
        <SectionEyebrow as="h3" className="mb-3 text-[11px] tracking-[2px]">
          {"// "}
          {t("teamComp.balanceAlertsEyebrow", loc)}
        </SectionEyebrow>
        <RoleAlerts members={membersWithTeamRole} isHu={isHu} />
      </section>

      {/* Cross-analysis */}
      <section>
        <SectionEyebrow as="h3" className="mb-1 text-[11px] tracking-[2px]">
          {"// "}
          {t("teamComp.categoryAnalysisEyebrow", loc)}
        </SectionEyebrow>
        <p className="mb-4 text-sm text-ink-body">
          {t("teamComp.categoryAnalysisDesc", loc)}
        </p>
        <CrossAnalysis members={membersWithTeamRole} isHu={isHu} />
      </section>

      {/* Individual table */}
      <section>
        <SectionEyebrow as="h3" className="mb-1 text-[11px] tracking-[2px]">
          {"// "}
          {t("teamComp.individualRolesEyebrow", loc)}
        </SectionEyebrow>
        <h4 className="mb-4 font-fraunces text-xl text-ink">
          {t("teamComp.memberRoleProfiles", loc)}
        </h4>
        <IndividualTeamRoleTable members={membersWithTeamRole} isHu={isHu} />
      </section>
    </div>
  );
}
