"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { StatusChip, type StatusChipVariant } from "@/components/ui/primitives/StatusChip";

const ROLES = ["ORG_ADMIN", "ORG_MANAGER", "ORG_MEMBER"] as const;
type OrgRole = typeof ROLES[number];

interface OrgMemberRoleEditorProps {
  orgId: string;
  userId: string;
  currentRole: string;
  isSelf: boolean;
  locale: string;
}

function roleLabel(role: string, loc: Locale): string {
  if (role === "ORG_ADMIN") return t("org.members.roleAdmin", loc);
  if (role === "ORG_CONSULTANT") return t("org.members.roleConsultant", loc);
  if (role === "ORG_MANAGER") return t("org.members.roleManager", loc);
  return t("org.members.roleMember", loc);
}

function roleBadgeConfig(role: string): { variant: StatusChipVariant; className?: string } {
  if (role === "ORG_ADMIN") return { variant: "info", className: "bg-sage/10 text-[var(--color-accent-primary-strong)]" };
  if (role === "ORG_CONSULTANT") return { variant: "info", className: "bg-state-warning-bg text-state-warning-fg" };
  if (role === "ORG_MANAGER") return { variant: "neutral", className: "bg-ink/10 text-ink" };
  return { variant: "neutral" };
}

export function OrgMemberRoleEditor({
  orgId,
  userId,
  currentRole,
  isSelf,
  locale,
}: OrgMemberRoleEditorProps) {
  const router = useRouter();
  const loc = locale as Locale;
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
          setError(t("org.forms.lastAdminError", loc));
        } else {
          setError(t("org.forms.roleChangeError", loc));
        }
        return;
      }
      setRole(newRole);
      router.refresh();
    } catch {
      setError(t("org.forms.roleNetworkError", loc));
    } finally {
      setLoading(false);
    }
  }

  // A tanácsadói szerepet a platform osztja ki, ezért itt nem módosítható;
  // a saját szerepkör pedig továbbra is védett az ön-demotálástól.
  if (isSelf || currentRole === "ORG_CONSULTANT") {
    const visibleRole = currentRole === "ORG_CONSULTANT" ? currentRole : role;
    const badge = roleBadgeConfig(visibleRole);
    return (
      <StatusChip variant={badge.variant} className={badge.className}>
        {roleLabel(visibleRole, loc)}
      </StatusChip>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={role}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value as OrgRole)}
        className="min-h-[44px] rounded-lg border border-sand bg-surface-card px-2 text-base font-semibold text-ink focus:border-sage focus:outline-none disabled:opacity-50 md:min-h-[36px] md:text-xs"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{roleLabel(r, loc)}</option>
        ))}
      </select>
      {role === "ORG_MANAGER" && (
        <p className="text-micro text-muted">
          {t("org.forms.teamPermissionsHint", loc)}
        </p>
      )}
      {error && <p className="text-xs text-state-error-fg">{error}</p>}
    </div>
  );
}
