"use client";

import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { TeamInviteForm } from "@/components/manager/TeamInviteForm";
import { PendingInviteCancelButton } from "@/components/manager/PendingInviteCancelButton";
import { TeamMemberRemoveButton } from "@/components/manager/TeamMemberRemoveButton";
import { TeamMemberRoleEditor } from "@/components/team/TeamMemberRoleEditor";

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
  isHu,
  locale,
  dateLocale,
}: TeamMembersTabProps) {
  const loc: Locale = isHu ? "hu" : "en";
  return (
    <div className="flex flex-col gap-8 pt-6">
      {/* Members section */}
      <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-1">
          {t("teamComp.membersTabEyebrow", loc)}
        </p>
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
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {m.testType ?? t("teamComp.doneTest", loc)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs text-ink-body/60">
                      {t("teamComp.noTest", loc)}
                    </span>
                  )}
                  <span className="text-xs text-ink-body/50">
                    {new Date(m.joinedAt).toLocaleDateString(dateLocale)}
                  </span>
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
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    {t("teamComp.pendingStatus", loc)}
                  </span>
                  {isOrgManager && (
                    <PendingInviteCancelButton inviteId={inv.id} isHu={isHu} />
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
            <p className="mb-4 text-xs text-ink-body/60">
              {t("teamComp.addMemberDesc", loc)}
            </p>
            <TeamInviteForm teamId={teamId} locale={locale as "hu" | "en"} />
          </div>
        )}
      </section>

    </div>
  );
}
