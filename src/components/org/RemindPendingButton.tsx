"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface RemindPendingButtonProps {
  orgId: string;
  isHu: boolean;
}

export function RemindPendingButton({ orgId, isHu }: RemindPendingButtonProps) {
  const loc: Locale = isHu ? "hu" : "en";
  const [state, setState] = useState<"idle" | "loading" | "sent">("idle");

  async function handleRemind() {
    setState("loading");
    try {
      await fetch(`/api/org/${orgId}/remind`, { method: "POST" });
      setState("sent");
    } catch {
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l3 3 5-5" />
        </svg>
        {t("org.actions.reminderSent", loc)}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={state === "loading"}
      onClick={handleRemind}
      className="min-h-[36px] rounded-lg border border-sand bg-white px-4 text-[12px] font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze disabled:cursor-not-allowed disabled:opacity-50"
    >
      {state === "loading"
        ? t("org.actions.reminderSending", loc)
        : t("org.actions.reminderButton", loc)}
    </button>
  );
}
