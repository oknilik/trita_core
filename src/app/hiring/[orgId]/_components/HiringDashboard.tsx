"use client";

import { useState } from "react";
import Link from "next/link";
import { CandidateInviteForm } from "@/components/manager/CandidateInviteForm";
import { CandidateRevokeButton } from "@/components/manager/CandidateRevokeButton";
import { RequestCreditsButton } from "@/components/hiring/RequestCreditsButton";

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

interface CreditBalance {
  available: number;
  totalPurchased: number;
  totalUsed: number;
}

interface CreditHistoryEntry {
  id: string;
  type: string;
  amount: number;
  balance: number;
  note: string | null;
  actorId: string | null;
  createdAt: string;
}

interface HiringDashboardProps {
  orgId: string;
  orgName: string;
  teams: Team[];
  invites: SerializedInvite[];
  isHu: boolean;
  locale: string;
  planTier: string;
  creditBalance: CreditBalance | null;
  creditHistory: CreditHistoryEntry[] | null;
  canInviteNew: boolean;
  isAdmin: boolean;
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
  planTier,
  creditBalance,
  creditHistory,
  canInviteNew,
  isAdmin,
}: HiringDashboardProps) {
  const [showForm, setShowForm] = useState(false);
  const [creditQty, setCreditQty] = useState(1);
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  const creditUnitPrice = creditQty >= 10 ? 31.20 : creditQty >= 5 ? 33.15 : 39;
  const creditTotal = (creditUnitPrice * creditQty).toFixed(2);

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
        {canInviteNew ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="min-h-[44px] rounded-lg bg-[#c8410a] px-5 text-sm font-semibold text-white transition hover:bg-[#b53a09]"
          >
            {showForm
              ? isHu ? "✕ Mégse" : "✕ Cancel"
              : isHu ? "+ Jelölt meghívása" : "+ Invite candidate"}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="min-h-[44px] rounded-lg bg-[#e8e4dc] px-5 text-sm font-semibold text-[#a09a90] cursor-not-allowed"
          >
            {isHu ? "+ Jelölt meghívása" : "+ Invite candidate"}
          </button>
        )}
      </div>

      {/* Credit pool bar — credit-based tiers */}
      {creditBalance && (
        <div className="rounded-xl border border-[#e8e4dc] bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#c8410a]">
                {isHu ? "// jelölt kreditek" : "// candidate credits"}
              </p>
              <p className="mt-1 text-sm text-[#3d3a35]">
                <span className="font-playfair text-2xl text-[#1a1814]">
                  {creditBalance.available}
                </span>
                {" "}
                {isHu ? "elérhető kredit" : "credits available"}
              </p>
              <p className="text-[11px] text-[#a09a90] mt-0.5">
                {isHu
                  ? `${creditBalance.totalPurchased} vásárolt · ${creditBalance.totalUsed} felhasznált`
                  : `${creditBalance.totalPurchased} purchased · ${creditBalance.totalUsed} used`}
              </p>
            </div>

            {isAdmin ? (
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {/* Quick-select presets */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCreditQty(5)}
                    className={`min-h-[32px] rounded-lg border px-3 text-[10px] font-semibold transition ${
                      creditQty === 5
                        ? "border-[#c8410a]/40 bg-[#c8410a]/5 text-[#c8410a]"
                        : "border-[#e8e4dc] bg-white text-[#5a5650] hover:border-[#c8410a]/30 hover:text-[#c8410a]"
                    }`}
                  >
                    5× <span className="text-emerald-600">−15%</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditQty(10)}
                    className={`min-h-[32px] rounded-lg border px-3 text-[10px] font-semibold transition ${
                      creditQty === 10
                        ? "border-[#c8410a]/40 bg-[#c8410a]/5 text-[#c8410a]"
                        : "border-[#e8e4dc] bg-white text-[#5a5650] hover:border-[#c8410a]/30 hover:text-[#c8410a]"
                    }`}
                  >
                    10× <span className="text-emerald-600">−20%</span>
                  </button>
                </div>
                {/* Stepper row */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-[#e8e4dc] bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCreditQty((q) => Math.max(1, q - 1))}
                      className="min-h-[36px] w-8 text-sm text-[#5a5650] hover:text-[#c8410a] transition"
                    >
                      −
                    </button>
                    <span className="min-w-[28px] text-center font-mono text-xs font-semibold text-[#1a1814]">
                      {creditQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCreditQty((q) => q + 1)}
                      className="min-h-[36px] w-8 text-sm text-[#5a5650] hover:text-[#c8410a] transition"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-[10px] text-[#a09a90]">
                      €{creditUnitPrice.toFixed(2)}/db
                    </span>
                    <a
                      href={`/billing/checkout?plan=candidate_custom&qty=${creditQty}`}
                      className="min-h-[36px] inline-flex items-center rounded-lg bg-[#c8410a] px-3 text-[11px] font-semibold text-white transition hover:bg-[#b53a09]"
                    >
                      +{creditQty} · €{creditTotal}
                    </a>
                  </div>
                </div>
              </div>
            ) : creditBalance.available === 0 ? (
              <RequestCreditsButton orgId={orgId} isHu={isHu} />
            ) : null}
          </div>

          {creditBalance.totalPurchased > 0 && (
            <div className="mt-3 h-1.5 w-full rounded-full bg-[#e8e4dc] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#c8410a] transition-all"
                style={{
                  width: `${Math.min(100, Math.round((creditBalance.available / creditBalance.totalPurchased) * 100))}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* No-credits warning banner for managers */}
      {!canInviteNew && creditBalance !== null && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          {isHu
            ? "Nincs elérhető kredit. Kérd az admint a pool feltöltésére, vagy váltson Org csomagra a korlátlan hozzáférésért."
            : "No credits available. Ask your admin to top up, or upgrade to Org for unlimited access."}
        </div>
      )}

      {/* Inline invite form */}
      {showForm && canInviteNew && (
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

      {/* Credit history — admin only, when credits are tracked */}
      {isAdmin && creditHistory && creditHistory.length > 0 && (
        <div className="rounded-xl border border-[#e8e4dc] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#c8410a] mb-3">
            {isHu ? "// kredit napló" : "// credit log"}
          </p>
          <div className="divide-y divide-[#e8e4dc]">
            {creditHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-xs text-[#3d3a35] truncate">
                    {entry.note ?? (entry.type === "purchase"
                      ? (isHu ? "Vásárlás" : "Purchase")
                      : (isHu ? "Felhasználás" : "Usage"))}
                  </p>
                  <p className="text-[10px] text-[#a09a90]">
                    {new Date(entry.createdAt).toLocaleDateString(
                      locale === "en" ? "en-GB" : "hu-HU",
                      { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`font-mono text-xs font-semibold ${
                      entry.amount > 0 ? "text-emerald-700" : "text-[#c8410a]"
                    }`}
                  >
                    {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
                  </span>
                  <span className="font-mono text-[10px] text-[#a09a90] w-6 text-right">
                    {entry.balance}
                  </span>
                </div>
              </div>
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
          {canInviteNew && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="min-h-[44px] rounded-lg bg-[#c8410a] px-5 text-sm font-semibold text-white transition hover:bg-[#b53a09]"
            >
              {isHu ? "+ Jelölt meghívása" : "+ Invite candidate"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
