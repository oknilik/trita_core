"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["ORG_ADMIN", "ORG_MANAGER", "ORG_MEMBER"] as const;
type OrgRole = typeof ROLES[number];

interface OrgMemberRoleEditorProps {
  orgId: string;
  userId: string;
  currentRole: string;
  isSelf: boolean;
  locale: string;
}

function roleLabel(role: string, isHu: boolean): string {
  if (role === "ORG_ADMIN") return "Admin";
  if (role === "ORG_MANAGER") return isHu ? "Menedzser" : "Manager";
  return isHu ? "Tag" : "Member";
}

export function OrgMemberRoleEditor({
  orgId,
  userId,
  currentRole,
  isSelf,
  locale,
}: OrgMemberRoleEditorProps) {
  const router = useRouter();
  const isHu = locale !== "en";
  const [role, setRole] = useState<OrgRole>(
    ROLES.includes(currentRole as OrgRole) ? (currentRole as OrgRole) : "ORG_MEMBER"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newRole: OrgRole) {
    if (newRole === role) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "LAST_ADMIN") {
          setError(isHu ? "Nem módosítható — utolsó admin." : "Cannot change — last admin.");
        } else {
          setError(isHu ? "Hiba történt." : "Something went wrong.");
        }
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

  if (isSelf) {
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        role === "ORG_ADMIN" ? "bg-[#c8410a]/10 text-[#c8410a]" :
        role === "ORG_MANAGER" ? "bg-[#1a1814]/10 text-[#1a1814]" :
        "bg-[#e8e4dc] text-[#3d3a35]"
      }`}>
        {roleLabel(role, isHu)}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={role}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value as OrgRole)}
        className="min-h-[36px] rounded-lg border border-[#e8e4dc] bg-white px-2 text-xs font-semibold text-[#1a1814] focus:border-[#c8410a] focus:outline-none disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{roleLabel(r, isHu)}</option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
