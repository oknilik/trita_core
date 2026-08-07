"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";

interface Props {
  inviteId: string;
  isHu: boolean;
}

export function PendingInviteResendButton({ inviteId, isHu }: Props) {
  const locale: Locale = isHu ? "hu" : "en";
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleResend() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch(`/api/team/pending-invite/${inviteId}/resend`, { method: "POST" });
      setState(res.ok ? "sent" : "error");
      if (res.ok) {
        window.setTimeout(() => setState("idle"), 3000);
      }
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <span className="text-xs font-semibold text-state-success-fg">
        {t("manager.pendingInviteResend.sent", locale)}
      </span>
    );
  }

  if (state === "error") {
    return (
      <button
        type="button"
        onClick={handleResend}
        className="text-xs font-semibold text-state-error-fg hover:text-state-error-fg"
      >
        {t("manager.pendingInviteResend.errorRetry", locale)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={state === "loading"}
      className="min-h-[36px] inline-flex items-center rounded-lg border border-sand bg-surface-card px-3 text-xs font-semibold text-ink-body transition hover:border-sage/30 hover:text-[var(--color-accent-primary-strong)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {state === "loading"
        ? t("manager.pendingInviteResend.sending", locale)
        : t("manager.pendingInviteResend.resend", locale)}
    </button>
  );
}
