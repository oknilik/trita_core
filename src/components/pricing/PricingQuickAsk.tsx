"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";

/**
 * Villámkérdés-űrlap az Együttműködés oldalon — a /contact API-ra küld
 * (topic: "pricing"), de oldalelhagyás nélkül: a cél, hogy a kérdezésnek
 * nulla súrlódása legyen.
 */
export function PricingQuickAsk({ locale }: { locale: Locale }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const messageTooShort = message.trim().length > 0 && message.trim().length < 20;
  const canSend =
    name.trim().length >= 2 &&
    /.+@.+\..+/.test(email.trim()) &&
    message.trim().length >= 20 &&
    state !== "sending";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic: "pricing",
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <div className="text-center">
        <div className="text-4xl leading-none">🙌</div>
        <h2 className="mt-4 font-fraunces text-2xl text-white lg:text-3xl">
          {t("pricing.quickAskSuccessTitle", locale)}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/[0.55]">
          {t("pricing.quickAskSuccessBody", locale)}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-center font-mono text-[11px] uppercase tracking-widest text-[var(--color-accent-primary-soft)]">
        {"// "}{t("pricing.quickAskEyebrow", locale)}
      </p>
      <h2 className="mt-2 text-center font-fraunces text-2xl text-white lg:text-3xl">
        {t("pricing.quickAskTitle", locale)}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-white/[0.55]">
        {t("pricing.quickAskBody", locale)}
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("pricing.quickAskName", locale)}
            className="min-h-[46px] rounded-lg border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/40 focus:bg-white/15"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("pricing.quickAskEmail", locale)}
            className="min-h-[46px] rounded-lg border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/40 focus:bg-white/15"
          />
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder={t("pricing.quickAskPlaceholder", locale)}
          className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/40 outline-none transition focus:border-white/40 focus:bg-white/15"
        />
        {messageTooShort && (
          <p className="text-xs text-white/50">{t("pricing.quickAskMinHint", locale)}</p>
        )}
        {state === "error" && (
          <p className="text-xs text-rose-300">{t("pricing.quickAskError", locale)}</p>
        )}
        <button
          type="submit"
          disabled={!canSend}
          className={`min-h-[48px] rounded-[10px] px-8 text-sm font-semibold transition-all ${
            canSend
              ? "bg-[var(--color-accent-primary)] text-white hover:-translate-y-px hover:brightness-[1.06]"
              : "cursor-not-allowed bg-white/15 text-white/40"
          }`}
        >
          {state === "sending"
            ? t("pricing.quickAskSending", locale)
            : t("pricing.quickAskSend", locale)}
        </button>
        <p className="text-center text-[11px] text-white/[0.35]">
          {t("pricing.ctaTrust", locale)}
        </p>
      </form>
    </div>
  );
}
