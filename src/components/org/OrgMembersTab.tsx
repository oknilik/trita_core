"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { SerializedMember, SerializedPendingInvite } from "@/lib/org-stats";
import { Card } from "@/components/ui/primitives/Card";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { StatusChip, type StatusChipVariant } from "@/components/ui/primitives/StatusChip";
import { OrgInviteForm } from "./OrgInviteForm";
import { OrgMemberRoleEditor } from "./OrgMemberRoleEditor";
import { OrgRemoveMemberButton } from "./OrgRemoveMemberButton";
import { OrgPendingInviteCancelButton } from "./OrgPendingInviteCancelButton";

function roleBadgeConfig(role: string): { variant: StatusChipVariant; className?: string } {
  if (role === "ORG_ADMIN") {
    return {
      variant: "info",
      className: "bg-sage/10 text-[var(--color-accent-primary-strong)]",
    };
  }
  if (role === "ORG_CONSULTANT") {
    return {
      variant: "info",
      className: "bg-state-warning-bg text-state-warning-fg",
    };
  }
  if (role === "ORG_MANAGER") {
    return { variant: "neutral", className: "bg-ink/10 text-ink" };
  }
  return { variant: "neutral" };
}

function roleLabel(role: string, loc: Locale) {
  if (role === "ORG_ADMIN") return t("org.members.roleAdmin", loc);
  if (role === "ORG_CONSULTANT") return t("org.members.roleConsultant", loc);
  if (role === "ORG_MANAGER") return t("org.members.roleManager", loc);
  return t("org.members.roleMember", loc);
}

function initials(displayName: string, locale: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toLocaleUpperCase(locale === "en" ? "en-US" : "hu-HU");
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
  /** Tag-dossié bázis-URL VAGY null — kizárólag tanácsadói jogosultságnál. */
  dossierBaseHref?: string | null;
  isHu: boolean;
  locale: string;
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
  dossierBaseHref = null,
  isHu,
  locale,
}: OrgMembersTabProps) {
  const loc = locale as Locale;
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <section className="pt-6" aria-labelledby="org-member-directory-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionEyebrow className="mb-1">
              {t("org.members.eyebrow", loc)}
            </SectionEyebrow>
            <h2
              id="org-member-directory-title"
              className="font-fraunces text-3xl text-ink"
            >
              {isHu ? "A szervezet tagjai" : "Organization members"}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-note text-muted">
              {members.length} {isHu ? "tag" : members.length === 1 ? "member" : "members"}
            </span>
            {isManager && canInviteMembers ? (
              <button
                type="button"
                onClick={() => setInviteOpen((open) => !open)}
                aria-expanded={inviteOpen}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-action-primary-bg px-4 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
              >
                <span aria-hidden>{inviteOpen ? "×" : "+"}</span>
                {t("org.members.inviteTitle", loc)}
              </button>
            ) : null}
          </div>
        </div>

        {isManager && canInviteMembers && inviteOpen ? (
          <div className="mb-5 rounded-2xl border border-surface-org-border bg-surface-card p-5 shadow-[var(--ui-shadow-sm)]">
            <p className="mb-3 text-note text-ink-body">
              {t("org.members.inviteDescription", loc)}
            </p>
            <OrgInviteForm orgId={orgId} locale={locale} canInviteManager={isAdmin} />
          </div>
        ) : null}

        {members.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((member) => {
              const displayName = member.user.username ?? member.user.email ?? "–";
              const badge = roleBadgeConfig(member.role);

              return (
                <article
                  key={member.id}
                  className="flex min-w-0 flex-col rounded-2xl border border-surface-org-border bg-surface-card p-4 shadow-[var(--ui-shadow-sm)]"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--color-layer-org-accent)]/15 bg-[var(--color-layer-org-soft)] font-fraunces text-xl text-[var(--color-layer-org-accent)]"
                    >
                      {initials(displayName, locale) || "·"}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-caption font-semibold text-ink">
                        {displayName}
                      </h3>
                      <p
                        className="mt-1 truncate text-note text-muted"
                        title={member.user.email ?? undefined}
                      >
                        {member.user.email ?? "–"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sand pt-3">
                    {isAdmin ? (
                      <OrgMemberRoleEditor
                        orgId={orgId}
                        userId={member.userId}
                        currentRole={member.role}
                        isSelf={member.userId === profileId}
                        locale={locale}
                      />
                    ) : (
                      <StatusChip variant={badge.variant} className={badge.className}>
                        {roleLabel(member.role, loc)}
                      </StatusChip>
                    )}
                    {dossierBaseHref ? (
                      <Link
                        href={`${dossierBaseHref}/${member.userId}`}
                        className="inline-flex min-h-9 items-center rounded-lg border border-sand bg-surface-card px-3 text-note font-semibold text-ink-body transition hover:border-[var(--color-layer-org-accent)]/30 hover:text-ink"
                      >
                        {isHu ? "Dossié" : "Dossier"}
                      </Link>
                    ) : null}
                    {isAdmin && member.userId !== profileId ? (
                      <OrgRemoveMemberButton
                        orgId={orgId}
                        userId={member.userId}
                        isHu={isHu}
                      />
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-caption text-ink-body">
            {t("org.members.noMembers", loc)}
          </p>
        )}

        {pendingInvites.length > 0 ? (
          <details className="mt-5 rounded-xl border border-sand bg-surface-card">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-ink-body">
              {isHu
                ? `Függő meghívók (${pendingInvites.length})`
                : `Pending invites (${pendingInvites.length})`}
            </summary>
            <div className="flex flex-col divide-y divide-sand border-t border-sand px-4">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between md:gap-3"
                >
                  <div className="min-w-0 opacity-60">
                    <p className="truncate text-sm font-semibold text-ink" title={invite.email}>
                      {invite.email}
                    </p>
                    <p className="text-xs text-ink-body/60">
                      {t("org.members.invitePending", loc)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                    <StatusChip variant="warning" className="text-state-warning-fg">
                      {t("org.members.pendingBadge", loc)}
                    </StatusChip>
                    {isManager && canInviteMembers ? (
                      <OrgPendingInviteCancelButton
                        orgId={orgId}
                        inviteId={invite.id}
                        isHu={isHu}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </section>

      {isManager && !canInviteMembers && actionGateCopy ? (
        <Card spacing="lg" className="md:p-8">
          <SectionEyebrow className="mb-1">
            {t("org.members.inviteEyebrow", loc)}
          </SectionEyebrow>
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
              className="inline-flex min-h-[44px] items-center rounded-lg border border-sand bg-surface-card px-6 text-sm font-semibold text-ink-body transition hover:border-sage/40 hover:text-[var(--color-accent-primary-strong)]"
            >
              {actionGateCopy.ctaLabel}
            </a>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
