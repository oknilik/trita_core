"use client";

import { TeamInviteForm } from "@/components/manager/TeamInviteForm";
import { PendingInviteCancelButton } from "@/components/manager/PendingInviteCancelButton";
import { TeamMemberRemoveButton } from "@/components/manager/TeamMemberRemoveButton";

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
  return (
    <div className="flex flex-col gap-8 pt-6">
      {/* Members section */}
      <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
          {isHu ? "// tagok" : "// members"}
        </p>
        <h2 className="font-playfair text-xl text-[#1a1814] mb-0.5">
          {isHu ? "Tagok" : "Members"}{" "}
          <span className="font-sans text-sm font-normal text-[#3d3a35]/50">
            ({members.length})
          </span>
        </h2>

        {(members.length > 0 || pendingInvites.length > 0) && (
          <div className="mt-5 flex flex-col divide-y divide-[#e8e4dc]">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1a1814]">
                    {m.displayName}
                  </p>
                  {m.email && m.email !== m.displayName && (
                    <p className="truncate text-xs text-[#3d3a35]/60">
                      {m.email}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {m.hasAssessment ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {m.testType ?? (isHu ? "Kész" : "Done")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#e8e4dc] px-2.5 py-0.5 text-xs text-[#3d3a35]/60">
                      {isHu ? "Nincs teszt" : "No test"}
                    </span>
                  )}
                  <span className="text-xs text-[#3d3a35]/50">
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
                  <p className="truncate text-sm font-semibold text-[#1a1814]">
                    {inv.email}
                  </p>
                  <p className="text-xs text-[#3d3a35]/60">
                    {isHu ? "Meghívó elküldve" : "Invite sent"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    {isHu ? "Függőben" : "Pending"}
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
          <p className="mt-4 text-sm text-[#5a5650]">
            {isHu
              ? "Még nincs csapattag. Hívj meg valakit lentebb!"
              : "No team members yet. Invite someone below!"}
          </p>
        )}

        {isOrgManager && (
          <div className="border-t border-[#e8e4dc] mt-5 pt-5">
            <h3 className="mb-3 text-sm font-semibold text-[#1a1814]">
              {isHu ? "Tag hozzáadása" : "Add a member"}
            </h3>
            <p className="mb-4 text-xs text-[#3d3a35]/60">
              {isHu
                ? "Add meg a csapattag emailcímét. A felhasználónak regisztrálva kell lennie."
                : "Enter the member's email. They must already be registered on Trita."}
            </p>
            <TeamInviteForm teamId={teamId} locale={locale as "hu" | "en"} />
          </div>
        )}
      </section>

    </div>
  );
}
