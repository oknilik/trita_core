"use client";

import { useState } from "react";

interface Props {
  inviteId: string;
  isHu: boolean;
}

export function PendingInviteResendButton({ inviteId, isHu }: Props) {
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
      <span className="text-xs font-semibold text-emerald-600">
        {isHu ? "Elküldve ✓" : "Sent ✓"}
      </span>
    );
  }

  if (state === "error") {
    return (
      <button
        type="button"
        onClick={handleResend}
        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
      >
        {isHu ? "Hiba – újra?" : "Error – retry?"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={state === "loading"}
      className="min-h-[36px] inline-flex items-center rounded-lg border border-[#e8e4dc] bg-white px-3 text-xs font-semibold text-[#3d3a35] transition hover:border-[#c8410a]/30 hover:text-[#c8410a] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {state === "loading"
        ? (isHu ? "Küldés…" : "Sending…")
        : (isHu ? "Újraküld" : "Resend")}
    </button>
  );
}
