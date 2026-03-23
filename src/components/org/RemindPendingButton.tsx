"use client";

import { useState } from "react";

interface RemindPendingButtonProps {
  orgId: string;
  isHu: boolean;
}

export function RemindPendingButton({ orgId, isHu }: RemindPendingButtonProps) {
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
        {isHu ? "Emlékeztető elküldve" : "Reminders sent"}
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
        ? isHu ? "Küldés..." : "Sending..."
        : isHu ? "Emlékeztető küldése" : "Send reminders"}
    </button>
  );
}
