"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t, tf } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

interface CompareConsentClientProps {
  token: string;
  inviterName: string;
}

/**
 * Consent-lépés: mit lát a másik fél, és explicit elfogadás. Az accept után
 * a páros nézetre visz — a meghívó ugyanazt a párt a saját oldalán éri el.
 */
export function CompareConsentClient({ token, inviterName }: CompareConsentClientProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/interaction/invite/${token}/accept`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.id) {
        setError(t("results.compareError", locale));
        return;
      }
      router.replace(`/interaction?pair=${data.id}`);
    } catch {
      setError(t("results.compareError", locale));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-sand bg-white p-8 md:p-10">
      <SectionEyebrow tone="muted">
        {t("results.compareConsentTitle", locale)}
      </SectionEyebrow>
      <h1 className="mt-2 font-fraunces text-[26px] leading-tight tracking-tight text-ink">
        {tf("results.compareConsentBody", locale, { name: inviterName })}
      </h1>
      <p className="mt-4 rounded-xl border border-sand bg-cream/60 p-4 text-caption leading-relaxed text-ink-body">
        {t("results.compareConsentWhat", locale)}
      </p>

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          type="button"
          onClick={handleAccept}
          disabled={busy}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[var(--color-accent-primary)] px-5 text-caption font-bold text-white transition-all hover:-translate-y-px hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("results.compareConsentAccept", locale)}
        </button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-sand bg-white px-5 text-caption font-medium text-ink-body transition-colors hover:bg-cream"
        >
          {t("results.compareConsentDecline", locale)}
        </Link>
      </div>
    </div>
  );
}
