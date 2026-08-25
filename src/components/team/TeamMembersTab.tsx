"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { TeamInviteForm } from "@/components/manager/TeamInviteForm";
import { PendingInviteCancelButton } from "@/components/manager/PendingInviteCancelButton";
import { PendingInviteResendButton } from "@/components/manager/PendingInviteResendButton";
import { TeamMemberRemoveButton } from "@/components/manager/TeamMemberRemoveButton";
import { TeamMemberRoleEditor } from "@/components/team/TeamMemberRoleEditor";
import {
  TeamMemberAddPicker,
  type AddableOrgMember,
} from "@/components/team/TeamMemberAddPicker";
import { StatusChip } from "@/components/ui/primitives/StatusChip";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

interface SerializedMemberRow {
  id: string;
  userId: string;
  displayName: string;
  email: string | null;
  role: string;
}

interface SerializedPendingInvite {
  id: string;
  email: string;
}

interface TeamMembersTabProps {
  members: SerializedMemberRow[];
  pendingInvites: SerializedPendingInvite[];
  teamId: string;
  profileId: string;
  /** Adminisztratív csapattag-kezelés: hozzáadás, szerepkör és törlés. */
  isOrgManager: boolean;
  /** teamInviteEmail capability: e-mailes meghívó — csak admin-paritás. */
  canEmailInvite: boolean;
  /** A szervezet tagjai, akik még nincsenek a csapatban — a kezelői út. */
  addableOrgMembers: AddableOrgMember[];
  /** Tag-dossié bázis-URL VAGY null — kizárólag tanácsadói jogosultságnál;
   * a kliens sosem számol hozzáférést. */
  dossierBaseHref?: string | null;
  isHu: boolean;
  locale: string;
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

export function TeamMembersTab({
  members,
  pendingInvites,
  teamId,
  profileId,
  isOrgManager,
  canEmailInvite,
  addableOrgMembers,
  dossierBaseHref = null,
  isHu,
  locale,
}: TeamMembersTabProps) {
  const loc: Locale = isHu ? "hu" : "en";
  const [addOpen, setAddOpen] = useState(false);

  return (
    <section className="pt-6" aria-labelledby="team-member-directory-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionEyebrow className="mb-1">
            {t("teamComp.membersTabEyebrow", loc)}
          </SectionEyebrow>
          <h2
            id="team-member-directory-title"
            className="font-fraunces text-3xl text-ink"
          >
            {isHu ? "A csapat tagjai" : "Your teammates"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-note text-muted">
            {members.length}{" "}
            {isHu ? "csapattárs" : members.length === 1 ? "teammate" : "teammates"}
          </span>
          {isOrgManager ? (
            <button
              type="button"
              onClick={() => setAddOpen((open) => !open)}
              aria-expanded={addOpen}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-action-primary-bg px-4 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
            >
              <span aria-hidden>{addOpen ? "×" : "+"}</span>
              {t("teamComp.addMember", loc)}
            </button>
          ) : null}
        </div>
      </div>

      {isOrgManager && addOpen ? (
        <div className="mb-5 rounded-2xl border border-surface-team-border bg-surface-card p-5 shadow-[var(--ui-shadow-sm)]">
          <p className="mb-3 text-note text-ink-body">
            {isHu
              ? "Adj hozzá tagot a szervezet meglévő tagjai közül."
              : "Add a member from the organization's existing members."}
          </p>
          <TeamMemberAddPicker
            teamId={teamId}
            candidates={addableOrgMembers}
            isHu={isHu}
          />

          {canEmailInvite ? (
            <div className="mt-5 border-t border-dashed border-sand pt-5">
              <p className="mb-3 text-note text-ink-body">
                {isHu
                  ? "Vagy hívj meg új tagot e-maillel. Fontos: az e-mailes meghívott a szervezethez is csatlakozik, nem csak ehhez a csapathoz."
                  : "Or invite a new member by email. Note: an email invitee joins the organization too, not just this team."}
              </p>
              <TeamInviteForm teamId={teamId} locale={locale as "hu" | "en"} />
            </div>
          ) : null}
        </div>
      ) : null}

      {members.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((member) => (
            <article
              key={member.id}
              className="flex min-w-0 flex-col rounded-2xl border border-surface-team-border bg-surface-card p-4 shadow-[var(--ui-shadow-sm)]"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--color-layer-team-accent)]/15 bg-[var(--color-layer-team-soft)] font-fraunces text-xl text-[var(--color-layer-team-accent)]"
                >
                  {initials(member.displayName, locale) || "·"}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-caption font-semibold text-ink">
                    {member.displayName}
                  </h3>
                  <p
                    className="mt-1 truncate text-note text-muted"
                    title={member.email ?? undefined}
                  >
                    {member.email ?? "—"}
                  </p>
                </div>
              </div>

              {isOrgManager ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sand pt-3">
                  <TeamMemberRoleEditor
                    teamId={teamId}
                    userId={member.userId}
                    currentRole={member.role}
                    isSelf={member.userId === profileId}
                    canEdit
                    locale={locale}
                  />
                  {dossierBaseHref ? (
                    <Link
                      href={`${dossierBaseHref}/${member.userId}`}
                      className="inline-flex min-h-9 items-center rounded-lg border border-sand bg-surface-card px-3 text-note font-semibold text-ink-body transition hover:border-[var(--color-layer-team-accent)]/30 hover:text-ink"
                    >
                      {isHu ? "Dossié" : "Dossier"}
                    </Link>
                  ) : null}
                  {member.userId !== profileId ? (
                    <TeamMemberRemoveButton
                      teamId={teamId}
                      userId={member.userId}
                      isHu={isHu}
                    />
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-caption text-ink-body">
          {isHu ? "Még nincs csapattag." : "There are no teammates yet."}
        </p>
      )}

      {/* A függő meghívás adminisztratív adat, tagi nézetben nem jelenik meg. */}
      {isOrgManager && pendingInvites.length > 0 ? (
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
                  <p className="truncate text-sm font-semibold text-ink">{invite.email}</p>
                  <p className="text-xs text-ink-body/60">
                    {t("teamComp.inviteSent", loc)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                  <StatusChip variant="warning">
                    {t("teamComp.pendingStatus", loc)}
                  </StatusChip>
                  <PendingInviteResendButton inviteId={invite.id} isHu={isHu} />
                  <PendingInviteCancelButton inviteId={invite.id} isHu={isHu} />
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
