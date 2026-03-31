"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
import { t } from "@/lib/i18n";
import type { SerializedSentInvitation, SerializedReceivedInvitation } from "@/components/profile/ProfileTabs";

interface InvitationsTabProps {
  sentInvitations: SerializedSentInvitation[];
  receivedInvitations: SerializedReceivedInvitation[];
  isPlus: boolean;
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

function LockedInvitations() {
  const { locale } = useLocale();

  return (
    <div className="rounded-2xl border-[1.5px] border-[#ddd5c8] bg-[#f2ede6] p-8 text-center">
      <span className="mb-2.5 inline-block text-[32px] opacity-20">🔒</span>
      <h3 className="mb-1.5 font-fraunces text-[18px] text-[#1a1a2e]">
        {t("invitations.lockedTitle", locale)}
      </h3>
      <p className="mx-auto mb-4 max-w-[380px] text-[13px] leading-relaxed text-[#8a8a9a]">
        {t("invitations.lockedSub", locale)}
      </p>
      <button
        type="button"
        className="min-h-[44px] rounded-[10px] bg-[#c17f4a] px-6 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
      >
        {t("invitations.lockedCta", locale)}
      </button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function InvitationsTab({
  sentInvitations,
  receivedInvitations,
  isPlus,
}: InvitationsTabProps) {
  const { locale } = useLocale();
  const { showToast } = useToast();

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
        setCreateError(loc !== `error.${code}` ? loc : t("invitations.errorGeneric", locale));
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
      setCreateError(t("invitations.errorGeneric", locale));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (token: string) => {
    const link = `${window.location.origin}/observe/${token}`;
    const ok = await copyText(link);
    if (!ok) { showToast(t("invitations.copyFailed", locale), "error"); return; }
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
      showToast(t("invitations.deleteFailed", locale), "error");
    } finally {
      setDeletingId(null);
    }
  };

  // A) LOCKED
  if (!isPlus) {
    return <LockedInvitations />;
  }

  const active = invitations.filter((i) => i.status !== "CANCELED");
  const completed = active.filter((i) => i.status === "COMPLETED");
  const pending = active.filter((i) => i.status === "PENDING");
  const canCreate = active.length < 5;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "hu" ? "hu-HU" : "en-GB", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#3d6b5e" }} />
          <span className="text-[10px] uppercase tracking-widest text-[#8a8a9a]">
            {t("invitations.eyebrow", locale)}
          </span>
        </div>
        <h2 className="font-fraunces text-[22px] tracking-tight text-[#1a1a2e]">
          {t("invitations.title", locale)}
        </h2>
        <p className="mt-1 max-w-[480px] text-[13px] leading-relaxed text-[#8a8a9a]">
          {t("invitations.sub", locale)}
        </p>
      </div>

      {/* 2. Stat cells */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border-[1.5px] border-[#ddd5c8] bg-white p-3.5 text-center">
          <p className="font-fraunces text-2xl" style={{ color: completed.length > 0 ? "#3d6b5e" : "#1a1a2e" }}>
            {completed.length}
          </p>
          <p className="text-[10px] text-[#8a8a9a]">{t("invitations.statReceived", locale)}</p>
        </div>
        <div className="rounded-xl border-[1.5px] border-[#ddd5c8] bg-white p-3.5 text-center">
          <p className="font-fraunces text-2xl" style={{ color: pending.length > 0 ? "#c17f4a" : "#1a1a2e" }}>
            {pending.length}
          </p>
          <p className="text-[10px] text-[#8a8a9a]">{t("invitations.statPending", locale)}</p>
        </div>
        <div className="rounded-xl border-[1.5px] border-[#ddd5c8] bg-white p-3.5 text-center">
          <p className="font-fraunces text-2xl text-[#1a1a2e]">{active.length}/5</p>
          <p className="text-[10px] text-[#8a8a9a]">{t("invitations.statSent", locale)}</p>
        </div>
      </div>

      {/* 3. Info banner */}
      <div className="flex items-start gap-2.5 rounded-xl border-[1.5px] border-[#3d6b5e]/15 bg-[#e8f2f0] p-3.5 px-4">
        <span className="shrink-0 text-sm" style={{ color: "#3d6b5e" }}>
          {completed.length >= 2 ? "✓" : "ℹ"}
        </span>
        <p className="text-xs leading-relaxed" style={{ color: "#1e3d34" }}>
          {completed.length >= 2
            ? `${completed.length} ${t("invitations.infoReady", locale)}`
            : t("invitations.infoNeeded", locale)}
        </p>
      </div>

      {/* 4. Create form */}
      <div className="rounded-xl border-[1.5px] border-[#ddd5c8] bg-white p-[18px] px-5">
        <p className="mb-3 text-[13px] font-semibold text-[#1a1a2e]">
          + {t("invitations.formTitle", locale)}
        </p>

        {canCreate ? (
          <>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder={t("invitations.formPlaceholder", locale)}
                className="min-h-[44px] flex-1 rounded-[10px] border-[1.5px] border-[#ddd5c8] bg-[#f7f4ef] px-3.5 py-2.5 text-[13px] text-[#1a1a2e] placeholder:text-[#8a8a9a] transition focus:border-[#3d6b5e] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="min-h-[44px] shrink-0 rounded-[10px] bg-[#3d6b5e] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#2d5a4e] disabled:opacity-50"
              >
                {isCreating ? "..." : t("invitations.formSubmit", locale)}
              </button>
            </div>
            {createError && (
              <p className="mt-2 text-xs text-[#c17f4a]">{createError}</p>
            )}
            <div className="mt-2.5 flex flex-col gap-1">
              <span className="text-[11px] text-[#8a8a9a]">
                🔗 {t("invitations.formHintLink", locale)}
              </span>
              <span className="text-[11px] text-[#8a8a9a]">
                📧 {t("invitations.formHintEmail", locale)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#8a8a9a]">
            {t("invitations.limitReached", locale)}
          </p>
        )}
      </div>

      {/* 5. Invitation list or empty state */}
      {active.length === 0 ? (
        <div className="rounded-xl border-[1.5px] border-dashed border-[#ddd5c8] bg-[#f2ede6] p-9 text-center">
          <span className="mb-2 inline-block text-[28px] opacity-25" style={{ color: "#8a8a9a" }}>👥</span>
          <p className="text-sm font-medium text-[#4a4a5e]">
            {t("invitations.emptyTitle", locale)}
          </p>
          <p className="text-xs text-[#8a8a9a]">
            {t("invitations.emptySub", locale)}
          </p>
          <p className="mx-auto mt-2 max-w-[420px] text-[11px] leading-relaxed text-[#7a6f63]">
            {locale === "hu"
              ? "A következő lépésed: indíts observer kört, majd kapcsolódj csapathoz, hogy a személyes insightból közös csapatkép legyen."
              : "Your next step: start an observer round, then connect to a team to turn self insight into a shared team picture."}
          </p>
          <div className="mt-3">
            <Link
              href="/onboarding?intent=team"
              className="inline-flex min-h-[40px] items-center rounded-[10px] border border-[#dcccb5] bg-white px-4 text-[11px] font-semibold text-[#7d5a40] transition hover:bg-[#fff7ec]"
            >
              {locale === "hu" ? "Csapat út megnyitása" : "Open team path"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Completed group */}
          {completed.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a9a]">
                {`${t("invitations.groupReceived", locale)} (${completed.length})`}
              </p>
              {completed.map((inv) => (
                <div key={inv.id} className="mb-2 flex items-center gap-3 rounded-xl border-[1.5px] border-[#ddd5c8] bg-white px-4 py-3.5 transition-all hover:border-[#3d6b5e]/30 hover:shadow-sm">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm" style={{ backgroundColor: "#e8f2f0", color: "#3d6b5e" }}>✓</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#1a1a2e]">
                      {inv.observerEmail ?? t("invitations.linkInvite", locale)}
                    </p>
                    <p className="text-[11px] text-[#8a8a9a]">
                      {t("invitations.receivedLabel", locale)}: {formatDate(inv.completedAt ?? inv.createdAt)}
                      {" · "}{inv.observerEmail ? t("invitations.emailInvite", locale) : t("invitations.linkInvite", locale)}
                    </p>
                  </div>
                  <span className="rounded px-2 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: "#e8f2f0", color: "#1e3d34" }}>
                    {t("invitations.statusCompleted", locale)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pending group */}
          {pending.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a9a]">
                {`${t("invitations.groupPending", locale)} (${pending.length})`}
              </p>
              {pending.map((inv) => (
                <div key={inv.id} className="mb-2 flex items-center gap-3 rounded-xl border-[1.5px] border-[#ddd5c8] bg-white px-4 py-3.5 transition-all hover:border-[#c17f4a]/30 hover:shadow-sm">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm" style={{ backgroundColor: inv.observerEmail ? "#fdf5ee" : "#f2ede6", color: inv.observerEmail ? "#c17f4a" : "#8a8a9a" }}>
                    {inv.observerEmail ? "⏳" : "🔗"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#1a1a2e]">
                      {inv.observerEmail ?? t("invitations.linkInvite", locale)}
                    </p>
                    <p className="text-[11px] text-[#8a8a9a]">
                      {t("invitations.sentLabel", locale)}: {formatDate(inv.createdAt)}
                      {" · "}{inv.observerEmail ? t("invitations.emailInvite", locale) : t("invitations.linkInvite", locale)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded px-2 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: "#fdf5ee", color: "#8a5530" }}>
                      {t("invitations.statusPending", locale)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(inv.token)}
                      className="min-h-[32px] rounded-lg border border-[#ddd5c8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#8a8a9a] transition hover:bg-[#f2ede6]"
                    >
                      {copiedToken === inv.token ? t("invitations.copied", locale) : t("invitations.linkButton", locale)}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(inv.id)}
                      disabled={deletingId === inv.id}
                      className="min-h-[32px] rounded-lg border border-[#ddd5c8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#8a8a9a] transition hover:bg-[#f2ede6] disabled:opacity-50"
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
        <div className="border-t border-[#ddd5c8] pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a9a]">
            {t("invitations.receivedSection", locale)}
          </p>
          {receivedInvitations.map((inv) => {
            const name = inv.inviterUsername ?? t("invitations.anonymous", locale);
            const isPending = inv.status === "PENDING";
            const isExpired = new Date(inv.expiresAt) < new Date();
            const isDone = inv.status === "COMPLETED";

            return (
              <div key={inv.id} className="mb-2 flex items-center gap-3 rounded-xl border-[1.5px] border-[#ddd5c8] bg-white px-4 py-3.5">
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
                      ? t("invitations.statusCompleted", locale)
                      : inv.status === "CANCELED"
                        ? t("invitations.statusCanceled", locale)
                        : isExpired
                          ? t("invitations.statusExpired", locale)
                          : t("invitations.statusPendingLower", locale)}
                  </p>
                </div>
                {isPending && !isExpired && (
                  <Link href={`/observe/${inv.token}`} className="min-h-[44px] shrink-0 rounded-[10px] bg-[#3d6b5e] px-4 py-2 text-[11px] font-semibold text-white">
                    {t("invitations.fillIn", locale)}
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
