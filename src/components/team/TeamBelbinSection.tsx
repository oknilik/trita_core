"use client";

import { useMemo } from "react";
import { estimateBelbinFromHexaco } from "@/lib/belbin-estimate";
import { BELBIN_ROLES, getTopRoles } from "@/lib/belbin-scoring";
import type { BelbinRoleCode, BelbinScores } from "@/lib/belbin-scoring";
import type { SerializedTeamMember } from "@/lib/team-stats";

interface MemberWithBelbin {
  id: string;
  userId: string;
  displayName: string;
  hasScores: boolean;
  belbinScores: BelbinScores | null;
  top3: { role: BelbinRoleCode; score: number }[];
  primaryRole: BelbinRoleCode | null;
}

const ROLE_COLORS: Record<BelbinRoleCode, string> = {
  PL: "#6366f1",
  RI: "#0ea5e9",
  CO: "#10b981",
  SH: "#f59e0b",
  ME: "#8b5cf6",
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
  role: BelbinRoleCode;
  isHu: boolean;
  size?: "sm" | "xs";
}) {
  const color = ROLE_COLORS[role];
  const label = isHu ? BELBIN_ROLES[role].hu : BELBIN_ROLES[role].en;
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

// ── BelbinCompletionStatus ────────────────────────────────────────────────────

function BelbinCompletionStatus({
  members,
  isHu,
}: {
  members: MemberWithBelbin[];
  isHu: boolean;
}) {
  const withScores = members.filter((m) => m.hasScores).length;
  const total = members.length;
  const pct = total > 0 ? Math.round((withScores / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1a1814]">
            {isHu ? "Személyiségprofil státusz" : "Personality profile status"}
          </p>
          <p className="mt-0.5 text-xs text-[#5a5650]">
            {isHu
              ? `${withScores} / ${total} tagnak van HEXACO adata — a Belbin-becslések erre épülnek`
              : `${withScores} / ${total} members have HEXACO data — Belbin estimates are derived from this`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-sm font-semibold text-[#1a1814]">
            {pct}%
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#e8e4dc]">
            <div
              className="h-full rounded-full bg-[#c8410a] transition-all"
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
  members: MemberWithBelbin[];
  isHu: boolean;
}) {
  const roleCounts = useMemo(() => {
    const counts: Partial<Record<BelbinRoleCode, number>> = {};
    for (const m of members) {
      if (!m.primaryRole) continue;
      counts[m.primaryRole] = (counts[m.primaryRole] ?? 0) + 1;
    }
    return counts;
  }, [members]);

  const sorted = (Object.entries(roleCounts) as [BelbinRoleCode, number][])
    .sort((a, b) => b[1] - a[1]);

  const withData = members.filter((m) => m.primaryRole).length;

  if (withData === 0) {
    return (
      <p className="text-sm text-[#a09a90]">
        {isHu ? "Nincs elég adat a csapatszerep-eloszláshoz." : "Not enough data for role distribution."}
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
              <div className="flex-1 overflow-hidden rounded-full bg-[#e8e4dc]">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: ROLE_COLORS[role] }}
                />
              </div>
              <span className="w-6 text-right font-mono text-xs text-[#5a5650]">
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

const ALL_ROLES = Object.keys(BELBIN_ROLES) as BelbinRoleCode[];

function RoleAlerts({
  members,
  isHu,
}: {
  members: MemberWithBelbin[];
  isHu: boolean;
}) {
  const withData = members.filter((m) => m.primaryRole);

  if (withData.length < 2) return null;

  const roleCounts: Record<BelbinRoleCode, number> = {} as Record<BelbinRoleCode, number>;
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
          {isHu
            ? "A csapat jól diverzifikált — minden fő szerepkör képviselt."
            : "The team is well-diversified — all key roles are represented."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {missing.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            {isHu ? "Hiányzó szerepkörök" : "Missing roles"}
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
            {isHu ? "Túlreprezentált szerepkörök" : "Overrepresented roles"}
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

// ── IndividualBelbinTable ─────────────────────────────────────────────────────

function IndividualBelbinTable({
  members,
  isHu,
}: {
  members: MemberWithBelbin[];
  isHu: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e8e4dc]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e8e4dc] bg-[#faf9f6]">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5a5650]">
              {isHu ? "Tag" : "Member"}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5a5650]">
              {isHu ? "Elsődleges" : "Primary"}
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5a5650] sm:table-cell">
              {isHu ? "Másodlagos" : "Secondary"}
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5a5650] md:table-cell">
              {isHu ? "Kiegészítő" : "Supporting"}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e8e4dc] bg-white">
          {members.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold text-[#1a1814]">
                  {m.displayName}
                </span>
              </td>
              <td className="px-4 py-3">
                {m.top3[0] ? (
                  <RoleChip role={m.top3[0].role} isHu={isHu} size="xs" />
                ) : (
                  <span className="text-xs text-[#a09a90]">
                    {isHu ? "Nincs adat" : "No data"}
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

const ROLE_CATEGORY: Record<BelbinRoleCode, "action" | "people" | "thought"> = {
  SH: "action", IM: "action", CF: "action",
  CO: "people", TW: "people", RI: "people",
  PL: "thought", ME: "thought", SP: "thought",
};

function CrossAnalysis({
  members,
  isHu,
}: {
  members: MemberWithBelbin[];
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

  const categories = [
    {
      key: "action" as const,
      labelHu: "Cselekvő",
      labelEn: "Action-oriented",
      roles: ["SH", "IM", "CF"] as BelbinRoleCode[],
      color: "#f59e0b",
    },
    {
      key: "people" as const,
      labelHu: "Kapcsolati",
      labelEn: "People-oriented",
      roles: ["CO", "TW", "RI"] as BelbinRoleCode[],
      color: "#10b981",
    },
    {
      key: "thought" as const,
      labelHu: "Gondolkodó",
      labelEn: "Thought-oriented",
      roles: ["PL", "ME", "SP"] as BelbinRoleCode[],
      color: "#6366f1",
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
            className="flex flex-col gap-2 rounded-xl border border-[#e8e4dc] bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1a1814]">
                {isHu ? cat.labelHu : cat.labelEn}
              </span>
              <span className="font-mono text-xs text-[#5a5650]">{pct}%</span>
            </div>
            <div className="flex-1 overflow-hidden rounded-full bg-[#e8e4dc]">
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

// ── Main: TeamBelbinSection ───────────────────────────────────────────────────

interface TeamBelbinSectionProps {
  members: SerializedTeamMember[];
  isHu: boolean;
}

export function TeamBelbinSection({ members, isHu }: TeamBelbinSectionProps) {
  const membersWithBelbin = useMemo<MemberWithBelbin[]>(() => {
    return members.map((m) => {
      if (!m.scores) {
        return {
          id: m.id,
          userId: m.userId,
          displayName: m.displayName,
          hasScores: false,
          belbinScores: null,
          top3: [],
          primaryRole: null,
        };
      }
      // Only estimate for HEXACO-coded dimensions
      const hasHexaco = "H" in m.scores && "X" in m.scores;
      if (!hasHexaco) {
        return {
          id: m.id,
          userId: m.userId,
          displayName: m.displayName,
          hasScores: false,
          belbinScores: null,
          top3: [],
          primaryRole: null,
        };
      }
      const belbinScores = estimateBelbinFromHexaco(
        m.scores as Record<"H" | "E" | "X" | "A" | "C" | "O", number>,
      );
      const top3 = getTopRoles(belbinScores, 3);
      return {
        id: m.id,
        userId: m.userId,
        displayName: m.displayName,
        hasScores: true,
        belbinScores,
        top3,
        primaryRole: top3[0]?.role ?? null,
      };
    });
  }, [members]);

  return (
    <div className="flex flex-col gap-8 py-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
          {isHu ? "// csapatszerepek becslése" : "// estimated team roles"}
        </p>
        <h2 className="mt-1 font-playfair text-2xl text-[#1a1814]">
          {isHu ? "Belbin csapatszerep-elemzés" : "Belbin team role analysis"}
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#5a5650]">
          {isHu
            ? "A személyiségprofilok alapján becsült Belbin-szerepkörök. A pontos méréshez minden tagnak ki kell töltenie a Belbin kérdőívet."
            : "Belbin roles estimated from personality profiles. For exact measurements, all members should complete the Belbin questionnaire."}
        </p>
      </div>

      {/* Completion status */}
      <BelbinCompletionStatus members={membersWithBelbin} isHu={isHu} />

      {/* Role composition */}
      <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
        <h3 className="mb-1 font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
          {isHu ? "// szerepkör-eloszlás" : "// role distribution"}
        </h3>
        <h4 className="mb-5 font-playfair text-xl text-[#1a1814]">
          {isHu ? "Csapatszerepek megoszlása" : "Team role composition"}
        </h4>
        <RoleComposition members={membersWithBelbin} isHu={isHu} />
      </section>

      {/* Alerts */}
      <section>
        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
          {isHu ? "// egyensúly-figyelmeztetések" : "// balance alerts"}
        </h3>
        <RoleAlerts members={membersWithBelbin} isHu={isHu} />
      </section>

      {/* Cross-analysis */}
      <section>
        <h3 className="mb-1 font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
          {isHu ? "// kategória-elemzés" : "// category analysis"}
        </h3>
        <p className="mb-4 text-sm text-[#5a5650]">
          {isHu
            ? "A csapat tagjai hogyan oszlanak meg a három fő szerepkategória között."
            : "How team members distribute across the three core role categories."}
        </p>
        <CrossAnalysis members={membersWithBelbin} isHu={isHu} />
      </section>

      {/* Individual table */}
      <section>
        <h3 className="mb-1 font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
          {isHu ? "// egyéni szerepkörök" : "// individual roles"}
        </h3>
        <h4 className="mb-4 font-playfair text-xl text-[#1a1814]">
          {isHu ? "Tagok szerep-profilja" : "Member role profiles"}
        </h4>
        <IndividualBelbinTable members={membersWithBelbin} isHu={isHu} />
      </section>
    </div>
  );
}
