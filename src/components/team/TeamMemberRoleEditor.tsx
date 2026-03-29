"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const TEAM_ROLES = ["member", "manager"] as const;
type TeamRole = (typeof TEAM_ROLES)[number];

function roleLabel(role: string, loc: Locale): string {
  if (role === "manager") return t("teamComp.roleManagerLabel", loc);
  return t("teamComp.roleMemberLabel", loc);
}

function roleBadgeStyle(role: string): string {
  if (role === "manager") return "bg-sage/10 text-bronze border-sage/20";
  return "bg-sand text-ink-body border-sand";
}

interface TeamMemberRoleEditorProps {
  teamId: string;
  userId: string;
  currentRole: string;
  isSelf: boolean;
  canEdit: boolean;
  locale: string;
}

export function TeamMemberRoleEditor({
  teamId,
  userId,
  currentRole,
  isSelf,
  canEdit,
  locale,
}: TeamMemberRoleEditorProps) {
  const router = useRouter();
  const loc: Locale = locale === "en" ? "en" : "hu";
  const [role, setRole] = useState<TeamRole>(
    currentRole === "manager" ? "manager" : "member"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canEdit || isSelf) {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadgeStyle(role)}`}
      >
        {roleLabel(role, loc)}
      </span>
    );
  }

  async function handleChange(newRole: TeamRole) {
    if (newRole === role) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${teamId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "CANNOT_CHANGE_SELF"
            ? t("teamComp.cannotChangeSelf", loc)
            : t("teamComp.somethingWentWrong", loc)
        );
        return;
      }
      setRole(newRole);
      router.refresh();
    } catch {
      setError(t("teamComp.networkError", loc));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={role}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value as TeamRole)}
        className="min-h-[36px] rounded-lg border border-sand bg-white px-2 text-xs font-semibold text-ink focus:border-sage focus:outline-none disabled:opacity-50"
      >
        {TEAM_ROLES.map((r) => (
          <option key={r} value={r}>
            {roleLabel(r, loc)}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
