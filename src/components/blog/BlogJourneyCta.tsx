"use client";

import Link from "next/link";
import { useAuthState } from "@/components/auth/auth-state";
import { t, type Locale } from "@/lib/i18n/public";

type BlogJourneyCtaProps = {
  locale: Locale;
  variant: "banner" | "sidebar";
};

export function BlogJourneyCta({ locale, variant }: BlogJourneyCtaProps) {
  const { isSignedIn } = useAuthState();
  const href = isSignedIn ? "/dashboard" : "/try";
  const content = isSignedIn
    ? {
        eyebrow: t("blog.returnEyebrow", locale),
        title: t("blog.returnTitle", locale),
        sub: t("blog.returnSub", locale),
        cta: t("blog.returnCta", locale),
      }
    : {
        eyebrow: t("blog.tryEyebrow", locale),
        title: t("blog.tryTitle", locale),
        sub: t("blog.trySub", locale),
        cta: t("blog.tryCta", locale),
      };

  if (variant === "sidebar") {
    return (
      <div className="rounded-xl border border-[var(--color-surface-self-border)] bg-[var(--color-surface-self-accent-soft)] px-5 py-4">
        <p className="mb-1 text-caption font-semibold text-[var(--color-accent-self-deep)]">
          {content.title}
        </p>
        <p className="mb-3 text-micro leading-relaxed text-[var(--color-text-secondary)]">
          {content.sub}
        </p>
        <Link
          href={href}
          className="inline-block rounded-lg bg-[var(--color-action-primary-bg)] px-4 py-2 text-caption font-semibold text-[var(--color-action-primary-fg)] transition-colors hover:bg-[var(--color-action-primary-bg-hover)]"
        >
          {content.cta}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-5 rounded-2xl border border-[var(--color-surface-self-border)] bg-[var(--color-surface-self-accent-soft)] p-7 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
      <div className="flex-1 text-center sm:text-left">
        <p className="mb-1.5 text-caption font-semibold text-[var(--color-accent-self-deep)]">
          {content.eyebrow}
        </p>
        <h3 className="mb-1.5 font-fraunces text-xl leading-snug text-ink">
          {content.title}
        </h3>
        <p className="text-caption leading-relaxed text-ink-body">
          {content.sub}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-[44px] shrink-0 items-center rounded-[10px] bg-[var(--color-action-primary-bg)] px-7 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
      >
        {content.cta}
      </Link>
    </div>
  );
}
