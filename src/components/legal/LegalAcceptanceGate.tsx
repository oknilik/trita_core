"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { t, type Locale } from "@/lib/i18n/public";
import type { PendingLegalAcceptance } from "@/lib/legal/acceptance.server";

export function LegalAcceptanceGate({
  pending,
  locale,
}: {
  pending: PendingLegalAcceptance | null;
  locale: Locale;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!pending) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [pending]);

  if (!pending) return null;
  const campaignId = pending.campaignId;

  async function accept() {
    if (!checked || busy) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/legal/acceptance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      if (!response.ok) throw new Error("ACCEPTANCE_FAILED");
      router.refresh();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-ink/70 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-acceptance-title"
        className="my-auto w-full max-w-2xl rounded-2xl border border-sand bg-surface-card p-6 shadow-2xl sm:p-8"
      >
        <SectionEyebrow>{locale === "hu" ? "fontos" : "important"}</SectionEyebrow>
        <h1 id="legal-acceptance-title" className="mt-3 font-fraunces text-2xl text-ink sm:text-3xl">
          {t("legalAcceptance.title", locale)}
        </h1>
        <p className="mt-3 text-body leading-relaxed text-ink-body">
          {t("legalAcceptance.intro", locale)}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DocumentLink
            href="/legal/platform-terms"
            title={t("legalAcceptance.platformTerms", locale)}
            version={pending.platformTermsVersion}
            versionLabel={t("legalAcceptance.version", locale)}
          />
          <DocumentLink
            href="/privacy"
            title={t("legalAcceptance.privacyNotice", locale)}
            version={pending.privacyNoticeVersion}
            versionLabel={t("legalAcceptance.version", locale)}
          />
        </div>

        <label className="mt-6 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-sand bg-cream p-4 text-sm leading-relaxed text-ink-body">
          <input
            autoFocus
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-sage"
          />
          <span>{t("legalAcceptance.checkbox", locale)}</span>
        </label>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-state-error-fg">
            {t("legalAcceptance.error", locale)}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button loading={busy} disabled={!checked || busy} onClick={() => void accept()}>
            {t("legalAcceptance.submit", locale)}
          </Button>
        </div>
      </section>
    </div>
  );
}

function DocumentLink({
  href,
  title,
  version,
  versionLabel,
}: {
  href: string;
  title: string;
  version: string;
  versionLabel: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl border border-sand bg-cream p-4 transition hover:border-sage/50"
    >
      <span className="block font-semibold text-ink">{title}</span>
      <span className="mt-1 block text-micro text-muted">{versionLabel}: {version}</span>
    </Link>
  );
}
