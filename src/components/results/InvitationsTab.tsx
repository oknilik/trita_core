"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { t, type Locale } from "@/lib/i18n";
import type { SerializedSentInvitation, SerializedReceivedInvitation } from "@/components/profile/ProfileTabs";

interface InvitationsTabProps {
  sentInvitations: SerializedSentInvitation[];
  receivedInvitations: SerializedReceivedInvitation[];
  isPlus: boolean;
  isReflect: boolean;
}

// ─── Clipboard helper ────────────────────────────────────────────────────────

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fallback */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

// ─── Locked ──────────────────────────────────────────────────────────────────

function LockedInvitations({ hasSelfPlus }: { hasSelfPlus: boolean }) {
  const { locale } = useLocale();
  const isHu = locale === "hu";
  const price = hasSelfPlus ? "€7" : "€12";

  return (
    <div className="rounded-2xl border-[1.5px] border-[#e8e0d3] bg-[#f2ede6] p-8 text-center">
      <span className="mb-2.5 inline-block text-[32px] opacity-20">🔒</span>
      <h3 className="mb-1.5 font-fraunces text-[18px] text-[#1a1a2e]">
        {isHu ? "Visszajelzési meghívók" : "Feedback invitations"}
      </h3>
      <p className="mx-auto mb-4 max-w-[380px] text-[13px] leading-relaxed text-[#8a8a9a]">
        {isHu
          ? "Kérd meg kollégáidat, barátaidat vagy családtagjaidat, hogy értékeljenek téged — és nézd meg, hogyan viszonyul az önképed mások visszajelzéséhez."
          : "Ask your colleagues, friends, or family to rate you — and see how your self-image compares to others' feedback."}
      </p>
      <button
        type="button"
        className="min-h-[44px] rounded-[10px] bg-[#c17f4a] px-6 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
      >
        {isHu ? `Self Reflect feloldás → ${price}` : `Unlock Self Reflect → ${price}`}
      </button>
      {!hasSelfPlus && (
        <p className="mt-2 text-[11px] text-[#8a8a9a]">
          {isHu ? "Tartalmazza a Self Plus tartalmakat is" : "Includes Self Plus content"}
        </p>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function InvitationsTab({
  sentInvitations,
  receivedInvitations,
  isPlus,
  isReflect,
}: InvitationsTabProps) {
  const { locale } = useLocale();
  const { showToast } = useToast();
  const isHu = locale === "hu";

  // A) LOCKED
  if (!isReflect) {
    return <LockedInvitations hasSelfPlus={isPlus} />;
  }

  // ─── State & logic (create / copy / delete) ────────────────────────────────
  const [invitations, setInvitations] = useState(sentInvitations);
  const [email, setEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const active = invitations.filter((i) => i.status !== "CANCELED");
    const pendingCount = active.filter((i) => i.status === "PENDING").length;
    window.dispatchEvent(
      new CustomEvent("dashboard:invites-updated", {
        detail: { hasInvites: active.length > 0, pendingInvites: pendingCount },
      }),
    );
  }, [invitations]);

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    const hasEmail = email.trim().length > 0;
    try {
      const res = await fetch("/api/observer/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: hasEmail ? JSON.stringify({ email: email.trim() }) : JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        const code = data.error ?? "";
        const loc = t(`error.${code}`, locale);
        setCreateError(loc !== `error.${code}` ? loc : (isHu ? "Hiba történt" : "An error occurred"));
        return;
      }
      setInvitations((prev) => [{
        id: data.id, token: data.token, status: "PENDING",
        createdAt: new Date().toISOString(), completedAt: null,
        observerEmail: hasEmail ? email.trim() : null, relationship: null,
      }, ...prev]);
      if (hasEmail && !data.emailSent) {
        showToast(t("error.EMAIL_SEND_FAILED", locale), "info");
      }
      setEmail("");
    } catch {
      setCreateError(isHu ? "Hiba történt" : "An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (token: string) => {
    const link = `${window.location.origin}/observe/${token}`;
    const ok = await copyText(link);
    if (!ok) { showToast(isHu ? "Másolás sikertelen" : "Copy failed", "error"); return; }
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/observer/invite/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch {
      showToast(isHu ? "Törlés sikertelen" : "Delete failed", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const active = invitations.filter((i) => i.status !== "CANCELED");
  const completed = active.filter((i) => i.status === "COMPLETED");
  const pending = active.filter((i) => i.status === "PENDING");
  const canCreate = active.length < 5;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isHu ? "hu-HU" : "en-GB", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#3d6b5e" }} />
          <span className="text-[10px] uppercase tracking-widest text-[#8a8a9a]">
            {isHu ? "Visszajelzési meghívók" : "Feedback invitations"}
          </span>
        </div>
        <h2 className="font-fraunces text-[22px] tracking-tight text-[#1a1a2e]">
          {isHu ? "Kérd ki mások véleményét" : "Get others' perspective"}
        </h2>
        <p className="mt-1 max-w-[480px] text-[13px] leading-relaxed text-[#8a8a9a]">
          {isHu
            ? "Hívd meg kollégáidat, barátaidat vagy családtagjaidat egy rövid értékelésre. A visszajelzések név nélkül jelennek meg."
            : "Invite your colleagues, friends, or family to a short assessment. Feedback is shown anonymously."}
        </p>
      </div>

      {/* 2. Stat cells */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border-[1.5px] border-[#e8e0d3] bg-white p-3.5 text-center">
          <p className="font-fraunces text-2xl" style={{ color: completed.length > 0 ? "#3d6b5e" : "#1a1a2e" }}>
            {completed.length}
          </p>
          <p className="text-[10px] text-[#8a8a9a]">{isHu ? "beérkezett" : "received"}</p>
        </div>
        <div className="rounded-xl border-[1.5px] border-[#e8e0d3] bg-white p-3.5 text-center">
          <p className="font-fraunces text-2xl" style={{ color: pending.length > 0 ? "#c17f4a" : "#1a1a2e" }}>
            {pending.length}
          </p>
          <p className="text-[10px] text-[#8a8a9a]">{isHu ? "függőben" : "pending"}</p>
        </div>
        <div className="rounded-xl border-[1.5px] border-[#e8e0d3] bg-white p-3.5 text-center">
          <p className="font-fraunces text-2xl text-[#1a1a2e]">{active.length}/5</p>
          <p className="text-[10px] text-[#8a8a9a]">{isHu ? "meghívó elküldve" : "invitations sent"}</p>
        </div>
      </div>

      {/* 3. Info banner */}
      <div className="flex items-start gap-2.5 rounded-xl border-[1.5px] border-[#3d6b5e]/15 bg-[#e8f2f0] p-3.5 px-4">
        <span className="shrink-0 text-sm" style={{ color: "#3d6b5e" }}>
          {completed.length >= 2 ? "✓" : "ℹ"}
        </span>
        <p className="text-xs leading-relaxed" style={{ color: "#1e3d34" }}>
          {completed.length >= 2
            ? (isHu
                ? `${completed.length} visszajelzés beérkezett — az összehasonlítás elérhető az Összehasonlítás tabon.`
                : `${completed.length} responses received — comparison available on the Compare tab.`)
            : (isHu
                ? "Az összehasonlításhoz legalább 2 visszajelzés kell. A visszajelzések név nélkül jelennek meg — csak összesített átlagokat mutatunk."
                : "You need at least 2 responses for comparison. Feedback is anonymous — we only show aggregated averages.")}
        </p>
      </div>

      {/* 4. Create form */}
      <div className="rounded-[14px] border-[1.5px] border-[#e8e0d3] bg-white p-[18px] px-5">
        <p className="mb-3 text-[13px] font-semibold text-[#1a1a2e]">
          + {isHu ? "Új meghívó létrehozása" : "Create new invitation"}
        </p>

        {canCreate ? (
          <>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder={isHu ? "Email cím (opcionális)" : "Email address (optional)"}
                className="min-h-[44px] flex-1 rounded-[10px] border-[1.5px] border-[#e8e0d3] bg-[#f7f4ef] px-3.5 py-2.5 text-[13px] text-[#1a1a2e] placeholder:text-[#8a8a9a] transition focus:border-[#3d6b5e] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="min-h-[44px] shrink-0 rounded-[10px] bg-[#3d6b5e] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#2d5a4e] disabled:opacity-50"
              >
                {isCreating ? "..." : (isHu ? "Létrehozás" : "Create")}
              </button>
            </div>
            {createError && (
              <p className="mt-2 text-xs text-[#c17f4a]">{createError}</p>
            )}
            <div className="mt-2.5 flex flex-col gap-1">
              <span className="text-[11px] text-[#8a8a9a]">
                🔗 {isHu ? "Egy link — egy kitöltő. Email nélkül te osztod meg a linket." : "One link — one respondent. Without email you share the link yourself."}
              </span>
              <span className="text-[11px] text-[#8a8a9a]">
                📧 {isHu ? "Email cím megadásával mi küldjük ki a meghívót." : "With an email we'll send the invitation."}
              </span>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#8a8a9a]">
            {isHu ? "Elérted az 5 meghívó limitet." : "You've reached the 5 invitation limit."}
          </p>
        )}
      </div>

      {/* 5. Invitation list or empty state */}
      {active.length === 0 ? (
        <div className="rounded-[14px] border-[1.5px] border-dashed border-[#e8e0d3] bg-[#f2ede6] p-9 text-center">
          <span className="mb-2 inline-block text-[28px] opacity-25" style={{ color: "#8a8a9a" }}>👥</span>
          <p className="text-sm font-medium text-[#4a4a5e]">
            {isHu ? "Még nincs meghívód" : "No invitations yet"}
          </p>
          <p className="text-xs text-[#8a8a9a]">
            {isHu ? "Hozz létre egyet a fenti űrlappal" : "Create one with the form above"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Completed group */}
          {completed.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a9a]">
                {isHu ? `Beérkezett (${completed.length})` : `Received (${completed.length})`}
              </p>
              {completed.map((inv) => (
                <div key={inv.id} className="mb-2 flex items-center gap-3 rounded-xl border-[1.5px] border-[#e8e0d3] bg-white px-4 py-3.5 transition-all hover:border-[#3d6b5e]/30 hover:shadow-sm">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm" style={{ backgroundColor: "#e8f2f0", color: "#3d6b5e" }}>✓</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#1a1a2e]">
                      {inv.observerEmail ?? (isHu ? "Link meghívó" : "Link invitation")}
                    </p>
                    <p className="text-[11px] text-[#8a8a9a]">
                      {isHu ? "Beérkezett" : "Received"}: {formatDate(inv.completedAt ?? inv.createdAt)}
                      {" · "}{inv.observerEmail ? (isHu ? "Email meghívó" : "Email invitation") : (isHu ? "Link meghívó" : "Link invitation")}
                    </p>
                  </div>
                  <span className="rounded px-2 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: "#e8f2f0", color: "#1e3d34" }}>
                    {isHu ? "Kitöltve" : "Completed"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pending group */}
          {pending.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a9a]">
                {isHu ? `Függőben (${pending.length})` : `Pending (${pending.length})`}
              </p>
              {pending.map((inv) => (
                <div key={inv.id} className="mb-2 flex items-center gap-3 rounded-xl border-[1.5px] border-[#e8e0d3] bg-white px-4 py-3.5 transition-all hover:border-[#c17f4a]/30 hover:shadow-sm">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm" style={{ backgroundColor: inv.observerEmail ? "#fdf5ee" : "#f2ede6", color: inv.observerEmail ? "#c17f4a" : "#8a8a9a" }}>
                    {inv.observerEmail ? "⏳" : "🔗"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#1a1a2e]">
                      {inv.observerEmail ?? (isHu ? "Link meghívó" : "Link invitation")}
                    </p>
                    <p className="text-[11px] text-[#8a8a9a]">
                      {isHu ? "Elküldve" : "Sent"}: {formatDate(inv.createdAt)}
                      {" · "}{inv.observerEmail ? (isHu ? "Email meghívó" : "Email invitation") : (isHu ? "Link meghívó" : "Link invitation")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded px-2 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: "#fdf5ee", color: "#8a5530" }}>
                      {isHu ? "Várakozik" : "Waiting"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(inv.token)}
                      className="min-h-[32px] rounded-lg border border-[#e8e0d3] bg-white px-2.5 py-1 text-[11px] font-medium text-[#8a8a9a] transition hover:bg-[#f2ede6]"
                    >
                      {copiedToken === inv.token ? (isHu ? "Másolva!" : "Copied!") : (isHu ? "Link" : "Link")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(inv.id)}
                      disabled={deletingId === inv.id}
                      className="min-h-[32px] rounded-lg border border-[#e8e0d3] bg-white px-2.5 py-1 text-[11px] font-medium text-[#8a8a9a] transition hover:bg-[#f2ede6] disabled:opacity-50"
                    >
                      {deletingId === inv.id ? "..." : "✕"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Received invitations (where others invited this user) */}
      {receivedInvitations.length > 0 && (
        <div className="border-t border-[#e8e0d3] pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a9a]">
            {isHu ? "Beérkező meghívók" : "Received invitations"}
          </p>
          {receivedInvitations.map((inv) => {
            const name = inv.inviterUsername ?? (isHu ? "Névtelen" : "Anonymous");
            const isPending = inv.status === "PENDING";
            const isExpired = new Date(inv.expiresAt) < new Date();
            const isDone = inv.status === "COMPLETED";

            return (
              <div key={inv.id} className="mb-2 flex items-center gap-3 rounded-xl border-[1.5px] border-[#e8e0d3] bg-white px-4 py-3.5">
                <div
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm"
                  style={{ backgroundColor: isDone ? "#e8f2f0" : "#f2ede6", color: isDone ? "#3d6b5e" : "#8a8a9a" }}
                >
                  {isDone ? "✓" : "📩"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#1a1a2e]">{name}</p>
                  <p className="text-[11px] text-[#8a8a9a]">
                    {isDone
                      ? (isHu ? "Kitöltve" : "Completed")
                      : inv.status === "CANCELED"
                        ? (isHu ? "Visszavonva" : "Canceled")
                        : isExpired
                          ? (isHu ? "Lejárt" : "Expired")
                          : (isHu ? "Függőben" : "Pending")}
                  </p>
                </div>
                {isPending && !isExpired && (
                  <Link href={`/observe/${inv.token}`} className="min-h-[44px] shrink-0 rounded-[10px] bg-[#3d6b5e] px-4 py-2 text-[11px] font-semibold text-white">
                    {isHu ? "Kitöltöm →" : "Fill in →"}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
