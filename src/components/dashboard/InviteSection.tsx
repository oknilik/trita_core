"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf, type Locale } from "@/lib/i18n";

interface Invitation {
  id: string;
  token: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  observerEmail?: string | null;
  relationship?: string | null;
}

interface InviteSectionProps {
  initialInvitations: Invitation[];
}

function getRelationshipColor(relationship?: string | null): string {
  if (!relationship) return "";
  const rel = relationship.toUpperCase();
  if (rel === "FRIEND") return "bg-blue-50 text-blue-600 border-blue-200";
  if (rel === "COLLEAGUE") return "bg-purple-50 text-purple-600 border-purple-200";
  if (rel === "FAMILY") return "bg-pink-50 text-pink-600 border-pink-200";
  if (rel === "PARTNER") return "bg-rose-50 text-rose-600 border-rose-200";
  return "bg-gray-50 text-gray-600 border-gray-200"; // OTHER
}

function getRelationshipLabel(relationship: string, locale: Locale): string {
  const rel = relationship.toUpperCase();
  if (rel === "FRIEND") return t("observer.relationFriend", locale);
  if (rel === "COLLEAGUE") return t("observer.relationColleague", locale);
  if (rel === "FAMILY") return t("observer.relationFamily", locale);
  if (rel === "PARTNER") return t("observer.relationPartner", locale);
  if (rel === "OTHER") return t("observer.relationOther", locale);
  return relationship;
}

async function copyTextWithFallback(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
}

export function InviteSection({ initialInvitations }: InviteSectionProps) {
  const { showToast } = useToast();
  const { locale } = useLocale();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [isCreating, setIsCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const emitInviteProgressUpdate = (nextInvitations: Invitation[]) => {
    const active = nextInvitations.filter((i) => i.status !== "CANCELED");
    const pendingCount = active.filter((i) => i.status === "PENDING").length;
    window.dispatchEvent(
      new CustomEvent("dashboard:invites-updated", {
        detail: {
          hasInvites: active.length > 0,
          pendingInvites: pendingCount,
        },
      })
    );
  };

  useEffect(() => {
    emitInviteProgressUpdate(invitations);
  }, [invitations]);

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setCreateError(null);
    const hasEmail = email.trim().length > 0;

    try {
      const response = await fetch("/api/observer/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: hasEmail ? JSON.stringify({ email: email.trim() }) : JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        const code = data.error ?? "";
        const localized = t(`error.${code}`, locale);
        setCreateError(localized !== `error.${code}` ? localized : t("invite.createFailed", locale));
        return;
      }

      const newInvitation: Invitation = {
        id: data.id,
        token: data.token,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        completedAt: null,
        observerEmail: hasEmail ? email.trim() : null,
      };
      setInvitations((prev) => [newInvitation, ...prev]);

      if (hasEmail && !data.emailSent) {
        showToast(t("error.EMAIL_SEND_FAILED", locale), "info");
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
      setEmail("");
    } catch (error) {
      console.error("[InviteSection] Unexpected error:", error);
      setCreateError(t("invite.createFailed", locale));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (token: string) => {
    const link = `${window.location.origin}/observe/${token}`;
    const copied = await copyTextWithFallback(link);
    if (!copied) {
      showToast(t("invite.copyFailed", locale), "error");
      return;
    }
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Filter out canceled invitations from display
  const activeInvitations = invitations.filter((i) => i.status !== "CANCELED");
  const pending = activeInvitations.filter((i) => i.status === "PENDING");
  const completed = activeInvitations.filter((i) => i.status === "COMPLETED");
  const canceledCount = invitations.filter((i) => i.status === "CANCELED").length;
  const activeCount = activeInvitations.length;
  const canCreate = activeCount < 5;

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/observer/invite/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch {
      showToast(t("invite.deleteFailed", locale), "error");
    }
  };

  return (
    <section className="rounded-2xl border border-gray-100/50 bg-white p-8 md:p-12 shadow-lg">
      {/* Modern header with decorative bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {t("invite.title", locale)}
        </h2>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        {t("invite.body", locale)}
      </p>

      {/* Stat badges */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 px-5 py-3 border border-emerald-100/50">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            {t("invite.completed", locale) || "Befejezett"}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {completed.length}
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 px-5 py-3 border border-amber-100/50">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
            {t("invite.pending", locale) || "Függőben"}
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {pending.length}
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 px-5 py-3 border border-indigo-100/50">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            {t("invite.limit", locale) || "Limit"}
          </p>
          <p className="mt-1 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {activeCount}/5
          </p>
        </div>
      </div>

      {/* Unified invitation creation */}
      <div className="rounded-2xl border border-indigo-100/50 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 p-6 glass-effect">
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <p className="text-sm font-semibold text-gray-900">
            {t("invite.createNew", locale) || "Új meghívó létrehozása"}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="email"
            value={email}
            onChange={(event) => { setEmail(event.target.value); setCreateError(null); }}
            placeholder={t("invite.emailPlaceholder", locale) || "Email cím (opcionális)"}
            className={`min-h-[48px] flex-1 rounded-lg border bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-all ${createError ? "border-amber-400 focus:border-amber-400 focus:ring-amber-100" : "border-indigo-100 focus:border-indigo-300 focus:ring-indigo-100"}`}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !canCreate || showSuccess}
            className="group min-h-[48px] rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {showSuccess ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {t("invite.created", locale) || "Létrehozva"}
              </span>
            ) : isCreating ? (
              t("invite.creating", locale) || "Létrehozás..."
            ) : (
              t("invite.create", locale) || "Létrehozás"
            )}
          </button>
        </div>

        {createError && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <svg className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs font-medium text-amber-800 leading-relaxed">{createError}</p>
          </div>
        )}

        <div className="mt-3 flex items-start gap-2">
          <svg className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-gray-600 leading-relaxed">
            {t("invite.helpText", locale)}
          </p>
        </div>

        <p className="mt-2 text-xs text-gray-600">
          {t("invite.privacyNote", locale)}
        </p>

        {completed.length < 2 && (
          <p className="mt-2 text-xs font-medium text-indigo-700">
            {tf("invite.compareHint", locale, { count: completed.length })}
          </p>
        )}
      </div>

      {/* Invitations list or empty state */}
      {activeInvitations.length > 0 ? (
        <div className="mt-8 flex flex-col gap-3">
          {activeInvitations.map((inv) => (
            <div
              key={inv.id}
              className="group rounded-lg border border-gray-100/50 bg-gradient-to-br from-white to-gray-50/30 px-5 py-4 shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      inv.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : inv.status === "CANCELED"
                          ? "bg-gray-100 text-gray-500 border border-gray-200"
                          : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        inv.status === "COMPLETED"
                          ? "bg-emerald-500"
                          : inv.status === "CANCELED"
                            ? "bg-gray-400"
                            : "bg-amber-400"
                      }`}
                    />
                    {inv.status === "COMPLETED"
                      ? t("common.statusCompleted", locale)
                      : inv.status === "CANCELED"
                        ? t("common.statusCanceled", locale)
                        : t("common.statusPending", locale)}
                  </span>

                  {/* Email address - only for pending invitations */}
                  {inv.status === "PENDING" && inv.observerEmail && (
                    <span className="text-sm text-gray-600 truncate">
                      {inv.observerEmail}
                    </span>
                  )}
                </div>

                {/* Right side: Relationship badge for completed, action buttons for pending */}
                <div className="flex items-center gap-2 shrink-0">
                  {inv.status === "COMPLETED" && inv.relationship ? (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${getRelationshipColor(inv.relationship)}`}>
                      {getRelationshipLabel(inv.relationship, locale)}
                    </span>
                  ) : inv.status === "PENDING" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopy(inv.token)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          copiedToken === inv.token
                            ? "text-emerald-600 bg-emerald-50"
                            : "text-indigo-600 hover:bg-indigo-50"
                        }`}
                      >
                        {copiedToken === inv.token ? (
                          <>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-semibold">{t("actions.copied", locale)}</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="hidden md:inline">{t("actions.copyLink", locale)}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(inv.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden md:inline">{t("actions.delete", locale)}</span>
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          <p className="mt-4 text-xs text-gray-400 text-center">
            {tf("invite.stats", locale, { completed: completed.length, pending: pending.length, canceled: canceledCount })}
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-600">
            {t("invite.noInvitations", locale) || "Még nincs meghívásod"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {t("invite.createPrompt", locale) || "Hozz létre egyet a fenti űrlappal"}
          </p>
        </div>
      )}
    </section>
  );
}
