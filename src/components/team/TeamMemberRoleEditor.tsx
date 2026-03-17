"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TEAM_ROLES = ["member", "manager"] as const;
type TeamRole = (typeof TEAM_ROLES)[number];

function roleLabel(role: string, isHu: boolean): string {
  if (role === "manager") return isHu ? "Menedzser" : "Manager";
  return isHu ? "Tag" : "Member";
}

function roleBadgeStyle(role: string): string {
  if (role === "manager") return "bg-[#c8410a]/10 text-[#c8410a] border-[#c8410a]/20";
  return "bg-[#e8e4dc] text-[#3d3a35] border-[#e8e4dc]";
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
  const isHu = locale !== "en";
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
        {roleLabel(role, isHu)}
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
            ? isHu ? "Saját role nem módosítható." : "Cannot change own role."
            : isHu ? "Hiba történt." : "Something went wrong."
        );
        return;
      }
      setRole(newRole);
      router.refresh();
    } catch {
      setError(isHu ? "Hálózati hiba." : "Network error.");
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
        className="min-h-[36px] rounded-lg border border-[#e8e4dc] bg-white px-2 text-xs font-semibold text-[#1a1814] focus:border-[#c8410a] focus:outline-none disabled:opacity-50"
      >
        {TEAM_ROLES.map((r) => (
          <option key={r} value={r}>
            {roleLabel(r, isHu)}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
