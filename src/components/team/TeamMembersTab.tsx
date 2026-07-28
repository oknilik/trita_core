"use client";

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
  teamName: string;
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
  teamName,
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
  return (
    <div className="flex flex-col gap-8 pt-6">
      {/* Members section */}
      <Card as="section" spacing="lg" className="md:p-8">
        <SectionEyebrow className="mb-1">
          {t("teamComp.membersTabEyebrow", loc)}
        </SectionEyebrow>
        <h2 className="font-fraunces text-xl text-ink mb-0.5">
          {t("teamComp.membersTabTitle", loc)}{" "}
          <span className="font-sans text-sm font-normal text-ink-body/50">
            ({members.length})
          </span>
        </h2>

        {(members.length > 0 || pendingInvites.length > 0) && (
          <div className="mt-5 flex flex-col divide-y divide-sand">
            {members.map((m) => (
              <div
                key={m.id}
                className={`flex items-center justify-between gap-3 py-3 ${!m.hasAssessment ? "opacity-60" : ""}`}
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
                <div className="flex shrink-0 items-center gap-2">
                  <TeamMemberRoleEditor
                    teamId={teamId}
                    userId={m.userId}
                    currentRole={m.role}
                    isSelf={m.userId === profileId}
                    canEdit={isOrgManager}
                    locale={locale}
                  />
                  {m.hasAssessment ? (
                    <StatusChip variant="success">
                      {m.testType ?? t("teamComp.doneTest", loc)}
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

            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 opacity-60">
                  <p className="truncate text-sm font-semibold text-ink">
                    {inv.email}
                  </p>
                  <p className="text-xs text-ink-body/60">
                    {t("teamComp.inviteSent", loc)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
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
        )}

        {members.length === 0 && pendingInvites.length === 0 && (
          <p className="mt-4 text-sm text-ink-body">
            {t("teamComp.noMembersInvite", loc)}
          </p>
        )}

        {isOrgManager && (
          <div className="border-t border-sand mt-5 pt-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">
              {t("teamComp.addMember", loc)}
            </h3>

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

            {/* Admin-út: e-mailes meghívó — org-tagságot is keletkeztet,
                ezért csak admin-paritás (teamInviteEmail capability). */}
            {canEmailInvite && (
              <div className="mt-5 border-t border-dashed border-sand pt-5">
                <p className="mb-3 text-xs text-ink-body/60">
                  {isHu
                    ? "Vagy hívj meg új tagot e-maillel — ő a szervezetnek is tagja lesz. (Csak admin jogosultsággal.)"
                    : "Or invite a new member by email — they also join the organization. (Admin permission only.)"}
                </p>
                <TeamInviteForm teamId={teamId} locale={locale as "hu" | "en"} />
              </div>
            )}
          </div>
        )}
      </Card>

    </div>
  );
}
