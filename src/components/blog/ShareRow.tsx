"use client";

import { useState } from "react";
import { SuccessCheck } from "@/components/ui/primitives/SuccessCheck";

// Megosztás-sor a cikk fejlécében: link-másolás (SuccessCheck
// visszajelzéssel), LinkedIn és email. B2B olvasónál a LinkedIn-share a
// legerősebb terjedési csatorna — ezért van elöl.
export function ShareRow({
  title,
  labels,
}: {
  title: string;
  labels: { copyLink: string; copied: string; share: string };
}) {
  const [copied, setCopied] = useState(false);

  const pageUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard nélkül (régi böngésző) csendben nem csinálunk semmit
    }
  };

  const onLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl())}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=560");
  };

  const btn =
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-sand bg-white px-2 text-caption text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-surface-self-border)] hover:text-[var(--color-accent-self-deep)]";

  return (
    <div className="flex items-center gap-2" aria-label={labels.share}>
      <button type="button" onClick={onCopy} className={btn} title={labels.copyLink}>
        {copied ? (
          <>
            <SuccessCheck />
            <span className="text-micro">{labels.copied}</span>
          </>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
      <button type="button" onClick={onLinkedIn} className={btn} title="LinkedIn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
        </svg>
      </button>
      <a
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
        className={btn}
        title="Email"
        onClick={(e) => {
          // A body-t kattintáskor frissítjük, hogy SSR-kor ne legyen üres URL
          e.currentTarget.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(pageUrl())}`;
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 6L2 7" />
        </svg>
      </a>
    </div>
  );
}
