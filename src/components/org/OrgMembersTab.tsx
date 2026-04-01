"use client";

import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { SerializedMember, SerializedPendingInvite } from "@/lib/org-stats";
import { Card } from "@/components/ui/primitives/Card";
import { OrgInviteForm } from "./OrgInviteForm";
import { OrgRemoveMemberButton } from "./OrgRemoveMemberButton";
import { OrgPendingInviteCancelButton } from "./OrgPendingInviteCancelButton";

function roleBadgeClass(role: string) {
  if (role === "ORG_ADMIN") return "bg-sage/10 text-bronze";
  if (role === "ORG_MANAGER") return "bg-ink/10 text-ink";
  return "bg-sand text-ink-body";
}

function roleLabel(role: string, loc: Locale) {
  if (role === "ORG_ADMIN") return t("org.members.roleAdmin", loc);
  if (role === "ORG_MANAGER") return t("org.members.roleManager", loc);
  return t("org.members.roleMember", loc);
}

interface OrgMembersTabProps {
  members: SerializedMember[];
  pendingInvites: SerializedPendingInvite[];
  orgId: string;
  profileId: string;
  isManager: boolean;
  isAdmin: boolean;
  canInviteMembers: boolean;
  actionGateCopy?: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  } | null;
  isHu: boolean;
  locale: string;
  dateLocale: string;
}

export function OrgMembersTab({
  members,
  pendingInvites,
  orgId,
  profileId,
  isManager,
  isAdmin,
  canInviteMembers,
  actionGateCopy = null,
  isHu,
  locale,
  dateLocale,
}: OrgMembersTabProps) {
  const loc = locale as Locale;

  return (
    <div className="flex flex-col gap-6">
      {/* Members list */}
      <Card spacing="lg" className="md:p-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
          {t("org.members.eyebrow", loc)}
        </p>
        <h2 className="mb-5 font-fraunces text-xl text-ink">
          {t("org.members.title", loc)}{" "}
          <span className="font-sans text-sm font-normal text-ink-body/50">
            ({members.length + pendingInvites.length})
          </span>
        </h2>

        <div className="flex flex-col divide-y divide-sand">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {m.user.username ?? m.user.email ?? "—"}
                </p>
                {m.user.username && (
                  <p className="truncate text-xs text-ink-body/60">{m.user.email}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(m.role)}`}
                >
                  {roleLabel(m.role, loc)}
                </span>
                <span className="text-xs text-ink-body/50">
                  {new Date(m.joinedAt).toLocaleDateString(dateLocale)}
                </span>
                {isAdmin && m.userId !== profileId && (
                  <OrgRemoveMemberButton orgId={orgId} userId={m.userId} isHu={isHu} />
                )}
              </div>
            </div>
          ))}

          {pendingInvites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0 opacity-60">
                <p className="truncate text-sm font-semibold text-ink">{inv.email}</p>
                <p className="text-xs text-ink-body/60">
                  {t("org.members.invitePending", loc)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                  {t("org.members.pendingBadge", loc)}
                </span>
                {isManager && canInviteMembers && (
                  <OrgPendingInviteCancelButton orgId={orgId} inviteId={inv.id} isHu={isHu} />
                )}
              </div>
            </div>
          ))}

          {members.length === 0 && pendingInvites.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-body/50">
              {t("org.members.noMembers", loc)}
            </p>
          )}
        </div>
      </Card>

      {/* Invite form */}
      {isManager && canInviteMembers && (
        <Card spacing="lg" className="md:p-8">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
            {t("org.members.inviteEyebrow", loc)}
          </p>
          <h3 className="mb-3 text-sm font-semibold text-ink">
            {t("org.members.inviteTitle", loc)}
          </h3>
          <p className="mb-4 text-xs text-ink-body/60">
            {t("org.members.inviteDescription", loc)}
          </p>
          <OrgInviteForm orgId={orgId} locale={locale} canInviteManager={isAdmin} />
        </Card>
      )}

      {isManager && !canInviteMembers && actionGateCopy && (
        <Card spacing="lg" className="md:p-8">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
            {t("org.members.inviteEyebrow", loc)}
          </p>
          <h3 className="mb-2 text-sm font-semibold text-ink">
            {actionGateCopy.title}
          </h3>
          <p className="mb-4 text-sm text-ink-body">{actionGateCopy.description}</p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-lg bg-sand px-6 text-sm font-semibold text-muted">
              {t("org.members.inviteTitle", loc)}
            </span>
            <a
              href={actionGateCopy.ctaHref}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-sand bg-white px-6 text-sm font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze"
            >
              {actionGateCopy.ctaLabel}
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
