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
import { Card } from "@/components/ui/primitives/Card";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

interface SerializedMemberRow {
  id: string;
  userId: string;
  displayName: string;
  email: string | null;
  role: string;
  joinedAt: string;
  hasAssessment: boolean;
  testType: string | null;
}

interface SerializedPendingInvite {
  id: string;
  email: string;
  createdAt: string;
}

interface TeamMembersTabProps {
  members: SerializedMemberRow[];
  pendingInvites: SerializedPendingInvite[];
  teamId: string;
  profileId: string;
  isOrgManager: boolean;
  /** teamInviteEmail capability: e-mailes meghívó — csak admin-paritás. */
  canEmailInvite: boolean;
  /** A szervezet tagjai, akik még nincsenek a csapatban — a manager-út. */
  addableOrgMembers: AddableOrgMember[];
  /** Tag-dossié bázis-URL (`/org/[id]/members`) VAGY null — a page számolja
   *  ki a canViewMemberDossier-t (env-t olvas); a kliens sosem hívja. */
  dossierBaseHref?: string | null;
  isHu: boolean;
  locale: string;
  dateLocale: string;
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
  dateLocale,
}: TeamMembersTabProps) {
  const loc: Locale = isHu ? "hu" : "en";
  // Fejléc-gombos tag-felvétel (UX-audit #18): az űrlap nem a lista alján ül,
  // hanem a fejléc „+ Tag hozzáadása" gombjára nyíló panelben.
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="flex flex-col gap-8 pt-6">
      {/* Members section */}
      <Card as="section" spacing="lg" className="md:p-8">
        <SectionEyebrow className="mb-1">
          {t("teamComp.membersTabEyebrow", loc)}
        </SectionEyebrow>
        <div className="mb-0.5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-fraunces text-xl text-ink">
            {t("teamComp.membersTabTitle", loc)}{" "}
            <span className="font-sans text-sm font-normal text-ink-body/50">
              ({members.length})
            </span>
          </h2>
          {isOrgManager ? (
            <button
              type="button"
              onClick={() => setAddOpen((v) => !v)}
              aria-expanded={addOpen}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-action-primary-bg px-4 text-caption font-semibold text-white transition hover:brightness-110"
            >
              <span aria-hidden>{addOpen ? "×" : "+"}</span>
              {t("teamComp.addMember", loc)}
            </button>
          ) : null}
        </div>

        {isOrgManager && addOpen && (
          <div className="mt-4 rounded-xl border border-sand bg-cream/40 p-4">
            {/* Manager-út: meglévő szervezeti tag hozzáadása a taglistából. */}
            <p className="mb-3 text-xs text-ink-body/60">
              {isHu
                ? "Adj hozzá tagot a szervezet meglévő tagjai közül."
                : "Add a member from the organization's existing members."}
            </p>
            <TeamMemberAddPicker
              teamId={teamId}
              candidates={addableOrgMembers}
              isHu={isHu}
            />

            {/* Admin-út: e-mailes meghívó — org-tagságot is keletkeztet, ezért
                csak admin-paritás. A mellékhatás KIMONDVA (UX-audit #17-copy);
                a „(Csak admin jogosultsággal.)" megjegyzés törölve — aki látta,
                annak megvolt a joga, csak zavart. */}
            {canEmailInvite && (
              <div className="mt-5 border-t border-dashed border-sand pt-5">
                <p className="mb-3 text-xs text-ink-body/60">
                  {isHu
                    ? "Vagy hívj meg új tagot e-maillel. Fontos: az e-mailes meghívott a szervezethez is csatlakozik, nem csak ehhez a csapathoz."
                    : "Or invite a new member by email. Note: an email invitee joins the organization too, not just this team."}
                </p>
                <TeamInviteForm teamId={teamId} locale={locale as "hu" | "en"} />
              </div>
            )}
          </div>
        )}

        {(members.length > 0 || pendingInvites.length > 0) && (
          <div className="mt-5 flex flex-col divide-y divide-sand">
            {members.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between md:gap-3 ${!m.hasAssessment ? "opacity-60" : ""}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {m.displayName}
                  </p>
                  {m.email && m.email !== m.displayName && (
                    <p className="truncate text-xs text-ink-body/60">
                      {m.email}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:flex-nowrap">
                  <TeamMemberRoleEditor
                    teamId={teamId}
                    userId={m.userId}
                    currentRole={m.role}
                    isSelf={m.userId === profileId}
                    canEdit={isOrgManager}
                    locale={locale}
                  />
                  {m.hasAssessment ? (
                    // Státusz-címke, nem típusnév — a belső TestType enum
                    // ("TRITAN") nem user-facing (UX-audit #16).
                    <StatusChip variant="success">
                      {t("teamComp.doneTest", loc)}
                    </StatusChip>
                  ) : (
                    <StatusChip variant="neutral" className="text-ink-body/60">
                      {t("teamComp.noTest", loc)}
                    </StatusChip>
                  )}
                  <span className="pr-0.5 text-xs tabular-nums text-ink-body/50">
                    {new Date(m.joinedAt).toLocaleDateString(dateLocale)}
                  </span>
                  {dossierBaseHref && (
                    <Link
                      href={`${dossierBaseHref}/${m.userId}`}
                      className="rounded-full border border-sand bg-cream px-2.5 py-0.5 text-xs text-ink-body transition-colors hover:border-sage-ring hover:text-ink"
                    >
                      {isHu ? "Dossié" : "Dossier"}
                    </Link>
                  )}
                  {isOrgManager && m.userId !== profileId && (
                    <TeamMemberRemoveButton
                      teamId={teamId}
                      userId={m.userId}
                      isHu={isHu}
                    />
                  )}
                </div>
              </div>
            ))}

          </div>
        )}

        {/* Függő meghívók KÜLÖN, alapból zárt szekcióban (UX-audit #27). */}
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
                  className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between md:gap-3"
                >
                  <div className="min-w-0 opacity-60">
                    <p className="truncate text-sm font-semibold text-ink">
                      {inv.email}
                    </p>
                    <p className="text-xs text-ink-body/60">
                      {t("teamComp.inviteSent", loc)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:flex-nowrap">
                    <StatusChip variant="warning">
                      {t("teamComp.pendingStatus", loc)}
                    </StatusChip>
                    {isOrgManager && (
                      <>
                        <PendingInviteResendButton inviteId={inv.id} isHu={isHu} />
                        <PendingInviteCancelButton inviteId={inv.id} isHu={isHu} />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {members.length === 0 && pendingInvites.length === 0 && (
          <p className="mt-4 text-sm text-ink-body">
            {t("teamComp.noMembersInvite", loc)}
          </p>
        )}

      </Card>

    </div>
  );
}
