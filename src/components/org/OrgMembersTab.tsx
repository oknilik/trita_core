"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { SerializedMember, SerializedPendingInvite } from "@/lib/org-stats";
import { Card } from "@/components/ui/primitives/Card";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { SectionHeading } from "@/components/ui/primitives/SectionHeading";
import { StatusChip, type StatusChipVariant } from "@/components/ui/primitives/StatusChip";
import { OrgInviteForm } from "./OrgInviteForm";
import { OrgRemoveMemberButton } from "./OrgRemoveMemberButton";
import { OrgPendingInviteCancelButton } from "./OrgPendingInviteCancelButton";

function roleBadgeConfig(role: string): { variant: StatusChipVariant; className?: string } {
  if (role === "ORG_ADMIN") return { variant: "info", className: "bg-sage/10 text-bronze" };
  if (role === "ORG_CONSULTANT") return { variant: "info", className: "bg-state-warning-bg text-state-warning-fg" };
  if (role === "ORG_MANAGER") return { variant: "neutral", className: "bg-ink/10 text-ink" };
  return { variant: "neutral" };
}

function roleLabel(role: string, loc: Locale) {
  if (role === "ORG_ADMIN") return t("org.members.roleAdmin", loc);
  if (role === "ORG_CONSULTANT") return t("org.members.roleConsultant", loc);
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
  /** Tag-dossié bázis-URL (`/org/[id]/members`) VAGY null. A page számolja
   *  ki a canViewMemberDossier-t (env-t olvas) — a kliens sosem hívja. */
  dossierBaseHref?: string | null;
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
  dossierBaseHref = null,
  isHu,
  locale,
  dateLocale,
}: OrgMembersTabProps) {
  const loc = locale as Locale;
  // Fejléc-gombos meghívó (UX-audit #18): az űrlap nem a lista alatt ül,
  // hanem a fejléc „+ Tag meghívása" gombjára nyíló panelben.
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Members list */}
      <Card spacing="lg" className="md:p-8">
        <SectionEyebrow className="mb-1">
          {t("org.members.eyebrow", loc)}
        </SectionEyebrow>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <SectionHeading>
            {t("org.members.title", loc)}{" "}
            <span className="font-sans text-sm font-normal text-ink-body/50">
              ({members.length})
            </span>
          </SectionHeading>
          {isManager && canInviteMembers ? (
            <button
              type="button"
              onClick={() => setInviteOpen((v) => !v)}
              aria-expanded={inviteOpen}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-action-primary-bg px-4 text-caption font-semibold text-white transition hover:brightness-110"
            >
              <span aria-hidden>{inviteOpen ? "×" : "+"}</span>
              {t("org.members.inviteTitle", loc)}
            </button>
          ) : null}
        </div>

        {isManager && canInviteMembers && inviteOpen && (
          <div className="mb-5 rounded-xl border border-sand bg-cream/40 p-4">
            <p className="mb-3 text-xs text-ink-body/60">
              {t("org.members.inviteDescription", loc)}
            </p>
            <OrgInviteForm orgId={orgId} locale={locale} canInviteManager={isAdmin} />
          </div>
        )}

        <div className="flex flex-col divide-y divide-sand">
          {members.map((m) => {
            const badge = roleBadgeConfig(m.role);
            return (
              // Mobilon a név/e-mail saját sorba kerül, a szerep-chip +
              // dátum + műveletek alatta tördelve — md-től az eredeti
              // egysoros elrendezés.
              <div
                key={m.id}
                className="flex flex-col gap-1.5 py-3 md:flex-row md:items-center md:justify-between md:gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {m.user.username ?? m.user.email ?? "—"}
                  </p>
                  {m.user.username && (
                    <p className="truncate text-xs text-ink-body/60">{m.user.email}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                  <StatusChip variant={badge.variant} className={badge.className}>
                    {roleLabel(m.role, loc)}
                  </StatusChip>
                  <span className="text-xs text-ink-body/50">
                    {new Date(m.joinedAt).toLocaleDateString(dateLocale)}
                  </span>
                  {dossierBaseHref && (
                    // Láthatatlan 44px-es érintési sáv (before:-inset-y) —
                    // a chip vizuális mérete nem nő, a sor nem feszül szét.
                    <Link
                      href={`${dossierBaseHref}/${m.userId}`}
                      className="relative inline-flex items-center rounded-full border border-sand bg-cream px-2.5 py-0.5 text-xs text-ink-body transition-colors before:absolute before:inset-x-0 before:-inset-y-3 before:content-[''] hover:border-sage-ring hover:text-ink"
                    >
                      {isHu ? "Dossié" : "Dossier"}
                    </Link>
                  )}
                  {isAdmin && m.userId !== profileId && (
                    <OrgRemoveMemberButton orgId={orgId} userId={m.userId} isHu={isHu} />
                  )}
                </div>
              </div>
            );
          })}

          {members.length === 0 && pendingInvites.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-body/50">
              {t("org.members.noMembers", loc)}
            </p>
          )}
        </div>

        {/* Függő meghívók KÜLÖN, alapból zárt szekcióban (UX-audit #27) —
            a valódi tagok és a várakozó meghívók két külön fogalom. */}
        {pendingInvites.length > 0 && (
          <details className="mt-4 rounded-xl border border-sand bg-cream/40">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-ink-body">
              {isHu
                ? `Függő meghívók (${pendingInvites.length})`
                : `Pending invites (${pendingInvites.length})`}
            </summary>
            <div className="flex flex-col divide-y divide-sand border-t border-sand px-4">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col gap-1.5 py-3 md:flex-row md:items-center md:justify-between md:gap-3"
                >
                  <div className="min-w-0 opacity-60">
                    <p className="truncate text-sm font-semibold text-ink" title={inv.email}>
                      {inv.email}
                    </p>
                    <p className="text-xs text-ink-body/60">
                      {t("org.members.invitePending", loc)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                    <StatusChip variant="warning" className="text-state-warning-solid">
                      {t("org.members.pendingBadge", loc)}
                    </StatusChip>
                    {isManager && canInviteMembers && (
                      <OrgPendingInviteCancelButton orgId={orgId} inviteId={inv.id} isHu={isHu} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </Card>

      {isManager && !canInviteMembers && actionGateCopy && (
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
              className="inline-flex min-h-[44px] items-center rounded-lg border border-sand bg-surface-card px-6 text-sm font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze"
            >
              {actionGateCopy.ctaLabel}
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
