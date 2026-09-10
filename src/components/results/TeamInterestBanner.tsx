"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { Button } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

// Csapat-érdeklődés banner — az eredmény-oldal alján. Inline expand
// (nincs kontextus-váltás): a user emailje a fiókjából megy, csak egy
// opcionális üzenetet írhat. Beküldés: FeatureInterest rekord + lead-email.

type Phase = "collapsed" | "expanded" | "success";

export function TeamInterestBanner({ alreadySent }: { alreadySent: boolean }) {
  const { locale } = useLocale();
  const [phase, setPhase] = useState<Phase>("collapsed");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/features/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "lead",
          featureKey: "team",
          message: message.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("SEND_FAILED");
      setPhase("success");
    } catch {
      setError(t("results.teamInterestError", locale));
    } finally {
      setBusy(false);
    }
  }

  if (alreadySent || phase === "success") {
    return (
      <DashboardPanel className="min-w-0 wrap-anywhere p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-state-success-bg text-state-success-fg">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8.5l3 3 7-7" />
            </svg>
          </span>
          <p className="text-sm text-ink-body">
            {phase === "success"
              ? t("results.teamInterestSuccess", locale)
              : t("results.teamInterestAlready", locale)}
          </p>
        </div>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel className="min-w-0 wrap-anywhere p-4 sm:p-6">
      <SectionEyebrow>
        {t("results.teamInterestEyebrow", locale)}
      </SectionEyebrow>
      <h3 className="mt-1 font-fraunces text-xl text-ink">
        {t("results.teamInterestTitle", locale)}
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-body">
        {t("results.teamInterestBody", locale)}
      </p>

      {phase === "collapsed" ? (
        <Button
          type="button"
          onClick={() => setPhase("expanded")}
          className="mt-4 w-full min-w-0 max-w-full whitespace-normal py-2 sm:w-auto"
        >
          {t("results.teamInterestCta", locale)}
        </Button>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-note font-medium text-ink-body">
              {t("results.teamInterestMessageLabel", locale)}
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={t("results.teamInterestMessagePlaceholder", locale)}
              className="w-full min-w-0 max-w-full rounded-lg border border-sand bg-surface-card px-3 py-2 text-base text-ink md:text-sm"
            />
          </label>
          {error && <p className="text-xs text-state-error-fg">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={submit}
              className="w-full min-w-0 max-w-full whitespace-normal py-2 sm:w-auto"
            >
              {busy
                ? t("results.teamInterestSending", locale)
                : t("results.teamInterestSend", locale)}
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => setPhase("collapsed")}
              variant="secondary"
              className="w-full min-w-0 max-w-full whitespace-normal py-2 sm:w-auto"
            >
              {t("results.teamInterestCancel", locale)}
            </Button>
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
