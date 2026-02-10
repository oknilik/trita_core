"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";

interface Invitation {
  id: string;
  token: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  observerEmail?: string | null;
}

interface InviteSectionProps {
  initialInvitations: Invitation[];
}

export function InviteSection({ initialInvitations }: InviteSectionProps) {
  const { showToast } = useToast();
  const { locale } = useLocale();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [isCreating, setIsCreating] = useState(false);
  const [email, setEmail] = useState("");

  const handleCreate = async (mode: "link" | "email") => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/observer/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:
          mode === "email" && email.trim()
            ? JSON.stringify({ email: email.trim() })
            : JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        const code = data.error ?? "";
        const localized = t(`error.${code}`, locale);
        throw new Error(localized !== `error.${code}` ? localized : t("invite.createFailed", locale));
      }

      const newInvitation: Invitation = {
        id: data.id,
        token: data.token,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        completedAt: null,
        observerEmail: mode === "email" ? email.trim() : null,
      };
      setInvitations((prev) => [newInvitation, ...prev]);

      if (mode === "email" && !data.emailSent) {
        showToast(t("error.EMAIL_SEND_FAILED", locale), "info");
      } else if (mode === "link") {
        showToast(t("invite.createLinkSuccess", locale), "success");
      } else {
        showToast(t("invite.createEmailSuccess", locale), "success");
      }
      if (mode === "email") setEmail("");
    } catch (error) {
      console.error(error);
      showToast(t("invite.createFailed", locale), "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (token: string) => {
    const link = `${window.location.origin}/observe/${token}`;
    await navigator.clipboard.writeText(link);
    showToast(t("invite.copied", locale), "success");
  };

  const pending = invitations.filter((i) => i.status === "PENDING");
  const completed = invitations.filter((i) => i.status === "COMPLETED");
  const canceled = invitations.filter((i) => i.status === "CANCELED");
  const activeCount = invitations.filter((i) => i.status !== "CANCELED").length;
  const canCreate = activeCount < 5;

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/observer/invite/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === id ? { ...inv, status: "CANCELED" } : inv
        )
      );
      showToast(t("invite.deleteSuccess", locale), "success");
    } catch {
      showToast(t("invite.deleteFailed", locale), "error");
    }
  };

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {t("invite.title", locale)}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t("invite.body", locale)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleCreate("link")}
          disabled={isCreating || !canCreate}
          className="min-h-[44px] shrink-0 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isCreating ? t("actions.generate", locale) : t("actions.newInviteLink", locale)}
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-700">
          {t("invite.byEmailTitle", locale)}
        </p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("invite.byEmailPlaceholder", locale)}
            className="min-h-[44px] flex-1 rounded-lg border border-gray-100 bg-white px-3 text-sm text-gray-900 focus:border-indigo-300 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleCreate("email")}
            disabled={isCreating || !email.trim() || !canCreate}
            className="min-h-[44px] rounded-lg border border-indigo-600 bg-transparent px-5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
          >
            {t("actions.emailInvite", locale)}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {t("invite.activeLimit", locale)}
        </p>
      </div>


      {invitations.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    inv.status === "COMPLETED"
                      ? "bg-emerald-500"
                      : inv.status === "CANCELED"
                        ? "bg-gray-300"
                        : "bg-amber-400"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {inv.status === "COMPLETED"
                    ? t("common.statusCompleted", locale)
                    : inv.status === "CANCELED"
                      ? t("common.statusCanceled", locale)
                      : t("common.statusPending", locale)}
                </span>
                <span className="text-xs text-gray-400">
                  {inv.observerEmail ?? t("common.anonymous", locale)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {inv.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => handleCopy(inv.token)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {t("actions.copyLink", locale)}
                  </button>
                )}
                {inv.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(inv.id)}
                    className="text-sm font-medium text-rose-600 hover:text-rose-700"
                  >
                    {t("actions.delete", locale)}
                  </button>
                )}
              </div>
            </div>
          ))}
          <p className="mt-2 text-xs text-gray-400">
            {tf("invite.stats", locale, {
              completed: completed.length,
              pending: pending.length,
              canceled: canceled.length,
            })}
          </p>
        </div>
      )}
    </section>
  );
}
