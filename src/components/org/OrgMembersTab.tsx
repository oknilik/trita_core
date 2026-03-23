"use client";

import type { SerializedMember, SerializedPendingInvite } from "@/lib/org-stats";
import { OrgInviteForm } from "./OrgInviteForm";
import { OrgRemoveMemberButton } from "./OrgRemoveMemberButton";
import { OrgPendingInviteCancelButton } from "./OrgPendingInviteCancelButton";

function roleBadgeClass(role: string) {
  if (role === "ORG_ADMIN") return "bg-sage/10 text-bronze";
  if (role === "ORG_MANAGER") return "bg-ink/10 text-ink";
  return "bg-sand text-ink-body";
}

function roleLabel(role: string, isHu: boolean) {
  if (role === "ORG_ADMIN") return "Admin";
  if (role === "ORG_MANAGER") return isHu ? "Menedzser" : "Manager";
  return isHu ? "Tag" : "Member";
}

interface OrgMembersTabProps {
  members: SerializedMember[];
  pendingInvites: SerializedPendingInvite[];
  orgId: string;
  profileId: string;
  isManager: boolean;
  isAdmin: boolean;
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
  isHu,
  locale,
  dateLocale,
}: OrgMembersTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Members list */}
      <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
          {isHu ? "// tagok" : "// members"}
        </p>
        <h2 className="mb-5 font-fraunces text-xl text-ink">
          {isHu ? "Tagok" : "Members"}{" "}
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
                  {roleLabel(m.role, isHu)}
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
                  {isHu ? "Meghívó függőben" : "Invite pending"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                  {isHu ? "Függőben" : "Pending"}
                </span>
                {isManager && (
                  <OrgPendingInviteCancelButton orgId={orgId} inviteId={inv.id} isHu={isHu} />
                )}
              </div>
            </div>
          ))}

          {members.length === 0 && pendingInvites.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-body/50">
              {isHu ? "Még nincs tag." : "No members yet."}
            </p>
          )}
        </div>
      </div>

      {/* Invite form */}
      {isManager && (
        <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
            {isHu ? "// meghívás" : "// invite"}
          </p>
          <h3 className="mb-3 text-sm font-semibold text-ink">
            {isHu ? "Tag meghívása" : "Invite a member"}
          </h3>
          <p className="mb-4 text-xs text-ink-body/60">
            {isHu
              ? "Add meg a tag emailcímét. Ha már regisztrált a Tritán, azonnal csatlakozik."
              : "Enter the member's email. If they're already on Trita, they'll join immediately."}
          </p>
          <OrgInviteForm orgId={orgId} locale={locale} canInviteManager={isAdmin} />
        </div>
      )}
    </div>
  );
}
