"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { Button } from "@/components/ui/primitives/Button";

export function NewsletterActionCard({
  action,
  token,
}: {
  action: "confirm" | "unsubscribe";
  token: string;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(
        `/api/newsletter/${action}?token=${encodeURIComponent(token)}`,
        { method: "POST" },
      );
      const data = (await response.json()) as { ok?: boolean; state?: string };
      if (!response.ok && response.status >= 500) throw new Error("newsletter_action_failed");
      const target = action === "confirm" ? "confirmed" : "unsubscribed";
      router.replace(`/newsletter/${target}?state=${encodeURIComponent(data.state ?? (data.ok ? "ok" : "invalid"))}`);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const prefix = action === "confirm" ? "confirmAction" : "unsubscribeAction";
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-cream px-4 py-16 md:py-24">
      <div className="w-full max-w-md rounded-2xl border border-sand bg-surface-card p-8 md:p-10">
        <SectionEyebrow tone="muted">{t("newsletter.eyebrow", locale)}</SectionEyebrow>
        <h1 className="mt-2 font-fraunces text-title leading-tight tracking-tight text-ink">
          {t(`newsletter.${prefix}Title`, locale)}
        </h1>
        <p className="mt-3 text-caption leading-relaxed text-ink-body">
          {t(`newsletter.${prefix}Body`, locale)}
        </p>
        <Button
          className="mt-6"
          loading={busy}
          disabled={busy || !token}
          onClick={() => void submit()}
        >
          {t(`newsletter.${prefix}Cta`, locale)}
        </Button>
        {error ? (
          <p role="alert" className="mt-4 text-caption text-state-error-fg">
            {t("newsletter.errorGeneric", locale)}
          </p>
        ) : null}
      </div>
    </main>
  );
}
