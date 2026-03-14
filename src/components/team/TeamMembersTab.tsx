"use client";

import { TeamInviteForm } from "@/components/manager/TeamInviteForm";
import { CandidateInviteForm } from "@/components/manager/CandidateInviteForm";
import { CandidateRevokeButton } from "@/components/manager/CandidateRevokeButton";
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

interface SerializedCandidateInvite {
  id: string;
  name: string | null;
  email: string | null;
  position: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  hasResult: boolean;
}

interface TeamMembersTabProps {
  members: SerializedMemberRow[];
  pendingInvites: SerializedPendingInvite[];
  candidateInvites: SerializedCandidateInvite[];
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
  candidateInvites,
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

      {/* Candidates section */}
      {isOrgManager && (
        <section className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a] mb-1">
            {isHu ? "// jelöltek" : "// candidates"}
          </p>
          <h2 className="font-playfair text-xl text-[#1a1814] mb-0.5">
            {isHu ? "Jelöltek" : "Candidates"}{" "}
            <span className="font-sans text-sm font-normal text-[#3d3a35]/50">
              ({candidateInvites.length})
            </span>
          </h2>

          {candidateInvites.length > 0 && (
            <div className="mt-5 flex flex-col divide-y divide-[#e8e4dc]">
              {candidateInvites.map((c) => {
                const isExpired =
                  c.status !== "COMPLETED" &&
                  c.status !== "CANCELED" &&
                  new Date(c.expiresAt) < new Date();
                const displayStatus = isExpired ? "EXPIRED" : c.status;

                const statusClass =
                  displayStatus === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700"
                    : displayStatus === "EXPIRED"
                    ? "bg-[#e8e4dc] text-[#3d3a35]/60"
                    : displayStatus === "CANCELED"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-amber-50 text-amber-700";

                const statusText =
                  displayStatus === "COMPLETED"
                    ? isHu
                      ? "Kész"
                      : "Completed"
                    : displayStatus === "EXPIRED"
                    ? isHu
                      ? "Lejárt"
                      : "Expired"
                    : displayStatus === "CANCELED"
                    ? isHu
                      ? "Visszavonva"
                      : "Revoked"
                    : isHu
                    ? "Függőben"
                    : "Pending";

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1a1814]">
                        {c.name ??
                          c.email ??
                          (isHu ? "Névtelen jelölt" : "Anonymous candidate")}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {c.position && (
                          <span className="text-xs text-[#3d3a35]/60">
                            {c.position}
                          </span>
                        )}
                        <span className="text-xs text-[#3d3a35]/50">
                          {new Date(c.createdAt).toLocaleDateString(dateLocale)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
                      >
                        {statusText}
                      </span>
                      {c.status === "COMPLETED" && c.hasResult && (
                        <a
                          href={`/manager/candidates/${c.id}`}
                          className="min-h-[36px] inline-flex items-center rounded-lg border border-[#e8e4dc] bg-white px-3 text-xs font-semibold text-[#c8410a] transition hover:border-[#c8410a]/30 hover:bg-[#faf9f6]"
                        >
                          {isHu ? "Eredmény" : "Results"}
                        </a>
                      )}
                      {c.status === "PENDING" && !isExpired && (
                        <CandidateRevokeButton inviteId={c.id} isHu={isHu} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            className={
              candidateInvites.length > 0
                ? "border-t border-[#e8e4dc] mt-5 pt-5"
                : "mt-5"
            }
          >
            <h3 className="mb-3 text-sm font-semibold text-[#1a1814]">
              {isHu ? "Jelölt meghívása" : "Invite a candidate"}
            </h3>
            <p className="mb-4 text-xs text-[#3d3a35]/60">
              {isHu
                ? "Értékelési linket kap a jelölt. Regisztráció nélkül kitölthető."
                : "The candidate receives an assessment link. No registration required."}
            </p>
            <CandidateInviteForm
              locale={locale}
              teams={[{ id: teamId, name: teamName }]}
              preselectedTeamId={teamId}
            />
          </div>
        </section>
      )}
    </div>
  );
}
