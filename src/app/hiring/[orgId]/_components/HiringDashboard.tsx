"use client";

import { useState } from "react";
import Link from "next/link";
import { CandidateInviteForm } from "@/components/manager/CandidateInviteForm";
import { CandidateRevokeButton } from "@/components/manager/CandidateRevokeButton";

interface Team {
  id: string;
  name: string;
}

interface SerializedInvite {
  id: string;
  email: string | null;
  name: string | null;
  position: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  teamId: string | null;
  teamName: string | null;
  hasResult: boolean;
  draftAnsweredCount: number;
  totalQuestions: number;
}

interface HiringDashboardProps {
  orgId: string;
  orgName: string;
  teams: Team[];
  invites: SerializedInvite[];
  isHu: boolean;
  locale: string;
}

function statusLabel(status: string, isExpired: boolean, isHu: boolean): string {
  if (isExpired) return isHu ? "Lejárt" : "Expired";
  switch (status) {
    case "COMPLETED": return isHu ? "✓ kész" : "✓ done";
    case "CANCELED": return isHu ? "Visszavonva" : "Revoked";
    default: return isHu ? "Folyamatban" : "In progress";
  }
}

function statusClass(status: string, isExpired: boolean): string {
  if (isExpired || status === "EXPIRED") return "bg-[#e8e4dc] text-[#3d3a35]/60";
  if (status === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (status === "CANCELED") return "bg-rose-50 text-rose-600";
  return "bg-amber-50 text-amber-700";
}

function CandidateRow({
  invite,
  orgId,
  isHu,
  dateLocale,
}: {
  invite: SerializedInvite;
  orgId: string;
  isHu: boolean;
  dateLocale: string;
}) {
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent">("idle");

  const isExpired =
    invite.status === "PENDING" && new Date(invite.expiresAt) < new Date();

  const displayName =
    invite.name ?? invite.email ?? (isHu ? "Névtelen jelölt" : "Unnamed candidate");
  const initial = displayName[0]?.toUpperCase() ?? "?";

  async function handleResend() {
    setResendState("loading");
    try {
      const res = await fetch(`/api/manager/candidates/${invite.id}/resend`, { method: "POST" });
      setResendState(res.ok ? "sent" : "idle");
    } catch {
      setResendState("idle");
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e8e4dc] bg-white px-4 py-3">
      {/* Avatar */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#f0ede6] text-[11px] font-bold text-[#5a5650]">
        {initial}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#1a1814]">
          {displayName}
        </p>
        <p className="truncate text-[11px] text-[#a09a90]">
          {invite.position && `${invite.position} · `}
          {invite.teamName ?? (isHu ? "Nincs csapat" : "No team")}
          {" · "}
          {new Date(invite.createdAt).toLocaleDateString(dateLocale)}
        </p>
        {invite.status === "PENDING" && !isExpired && invite.draftAnsweredCount > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#f0ede6]">
              <div
                className="h-full rounded-full bg-[#c8410a]/60"
                style={{
                  width: `${Math.min(100, Math.round((invite.draftAnsweredCount / invite.totalQuestions) * 100))}%`,
                }}
              />
            </div>
            <span className="shrink-0 font-mono text-[9px] text-[#a09a90]">
              {invite.draftAnsweredCount}/{invite.totalQuestions}
            </span>
          </div>
        )}
      </div>

      {/* Status badge */}
      <span
        className={[
          "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
          statusClass(invite.status, isExpired),
        ].join(" ")}
      >
        {statusLabel(invite.status, isExpired, isHu)}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {invite.status === "COMPLETED" && invite.hasResult && (
          <Link
            href={`/hiring/${orgId}/candidates/${invite.id}`}
            className="min-h-[36px] inline-flex items-center rounded-lg border border-[#e8e4dc] bg-white px-3 text-[11px] font-semibold text-[#3d3a35] transition hover:border-[#c8410a]/30 hover:text-[#c8410a]"
          >
            {isHu ? "Eredmény →" : "Results →"}
          </Link>
        )}
        {invite.status === "PENDING" && !isExpired && !!invite.email && (
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resendState !== "idle"}
            className={`min-h-[36px] inline-flex items-center rounded-lg border px-3 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              resendState === "sent"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-[#e8e4dc] bg-white text-[#5a5650] hover:border-[#c8410a]/30 hover:text-[#c8410a]"
            }`}
          >
            {resendState === "loading"
              ? "…"
              : resendState === "sent"
              ? (isHu ? "✓ Elküldve" : "✓ Sent")
              : (isHu ? "Újraküldés" : "Resend")}
          </button>
        )}
        {invite.status === "PENDING" && !isExpired && (
          <CandidateRevokeButton inviteId={invite.id} isHu={isHu} />
        )}
      </div>
    </div>
  );
}

export function HiringDashboard({
  orgId,
  orgName,
  teams,
  invites,
  isHu,
  locale,
}: HiringDashboardProps) {
  const [showForm, setShowForm] = useState(false);
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  const pending = invites.filter(
    (i) => i.status === "PENDING" && new Date(i.expiresAt) >= new Date()
  );
  const completed = invites.filter((i) => i.status === "COMPLETED");
  const expired = invites.filter(
    (i) =>
      i.status === "EXPIRED" ||
      (i.status === "PENDING" && new Date(i.expiresAt) < new Date())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
            {isHu ? `// felvétel · ${orgName}` : `// hiring · ${orgName}`}
          </p>
          <h1 className="mt-1 font-playfair text-3xl text-[#1a1814] md:text-4xl">
            trita Hiring
          </h1>
          <p className="mt-1 text-xs text-[#a09a90]">
            {invites.length} {isHu ? "jelölt összesen" : "candidates total"}
            {" · "}
            {completed.length} {isHu ? "befejezett" : "completed"}
            {" · "}
            {pending.length} {isHu ? "folyamatban" : "in progress"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="min-h-[44px] rounded-lg bg-[#c8410a] px-5 text-sm font-semibold text-white transition hover:bg-[#b53a09]"
        >
          {showForm
            ? isHu ? "✕ Mégse" : "✕ Cancel"
            : isHu ? "+ Jelölt meghívása" : "+ Invite candidate"}
        </button>
      </div>

      {/* Inline invite form */}
      {showForm && (
        <div className="overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-sm">
          <div className="border-b border-[#e8e4dc] px-6 py-4">
            <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
              {isHu ? "// új jelölt meghívása" : "// invite new candidate"}
            </p>
          </div>
          <div className="p-6">
            <CandidateInviteForm
              locale={locale}
              teams={teams}
            />
          </div>
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-[#e8e4dc] bg-white shadow-sm">
        {[
          { label: isHu ? "Folyamatban" : "In progress", value: pending.length, color: "#c8410a" },
          { label: isHu ? "Befejezett" : "Completed", value: completed.length, color: "#10B981" },
          { label: isHu ? "Lejárt" : "Expired", value: expired.length, color: "#a09a90" },
        ].map((s, i) => (
          <div
            key={s.label}
            className={[
              "relative flex flex-col gap-1 px-5 py-4",
              i < 2 ? "border-r border-[#e8e4dc]" : "",
            ].join(" ")}
          >
            <div
              className="absolute left-0 right-0 top-0 h-[3px]"
              style={{ background: s.color }}
            />
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#a09a90]">
              {s.label}
            </p>
            <p className="text-[22px] font-bold text-[#1a1814]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending candidates */}
      {pending.length > 0 && (
        <div>
          <p className="mb-3 font-mono text-[9px] uppercase tracking-widest text-[#a09a90]">
            {isHu ? `// folyamatban · ${pending.length} jelölt` : `// in progress · ${pending.length}`}
          </p>
          <div className="flex flex-col gap-2">
            {pending.map((inv) => (
              <CandidateRow
                key={inv.id}
                invite={inv}
                orgId={orgId}
                isHu={isHu}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed candidates */}
      {completed.length > 0 && (
        <div>
          <p className="mb-3 font-mono text-[9px] uppercase tracking-widest text-[#a09a90]">
            {isHu ? `// befejezett · ${completed.length} jelölt` : `// completed · ${completed.length}`}
          </p>
          <div className="flex flex-col gap-2">
            {completed.map((inv) => (
              <CandidateRow
                key={inv.id}
                invite={inv}
                orgId={orgId}
                isHu={isHu}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {invites.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8e4dc] bg-white py-16 text-center">
          <p className="mb-1 text-sm font-semibold text-[#1a1814]">
            {isHu ? "Még nincs jelölt" : "No candidates yet"}
          </p>
          <p className="mb-4 text-xs text-[#a09a90]">
            {isHu
              ? "Hívj meg jelölteket HEXACO felmérésre az alábbi gombbal"
              : "Invite candidates to a HEXACO assessment"}
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="min-h-[44px] rounded-lg bg-[#c8410a] px-5 text-sm font-semibold text-white transition hover:bg-[#b53a09]"
          >
            {isHu ? "+ Jelölt meghívása" : "+ Invite candidate"}
          </button>
        </div>
      )}
    </div>
  );
}
