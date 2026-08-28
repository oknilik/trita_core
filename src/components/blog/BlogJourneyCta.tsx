"use client";

import Link from "next/link";
import { useAuthState } from "@/components/auth/auth-state";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
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
      <div className="rounded-[20px] border border-[var(--color-surface-self-border)] bg-[var(--color-surface-self-accent-soft)] px-5 py-5 shadow-[0_12px_30px_rgba(26,26,46,0.035)]">
        <p className="mb-1 text-caption font-semibold text-[var(--color-accent-self-deep)]">
          {content.title}
        </p>
        <p className="mb-3 text-micro leading-relaxed text-[var(--color-text-secondary)]">
          {content.sub}
        </p>
        <Link
          href={href}
          className={getButtonClassName({ size: "sm", className: "mt-0.5" })}
        >
          {content.cta}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col items-center gap-5 rounded-[24px] border border-[var(--color-surface-self-border)] bg-[var(--color-surface-self-accent-soft)] p-7 shadow-[0_16px_40px_rgba(26,26,46,0.045)] sm:flex-row sm:items-center sm:gap-6 sm:p-8">
      <div className="flex-1 text-center sm:text-left">
        <SectionEyebrow as="div" className="mb-2">
          {content.eyebrow}
        </SectionEyebrow>
        <h3 className="mb-1.5 font-fraunces text-xl leading-snug text-ink">
          {content.title}
        </h3>
        <p className="text-caption leading-relaxed text-ink-body">
          {content.sub}
        </p>
      </div>
      <Link
        href={href}
        className={getButtonClassName({ size: "lg", className: "shrink-0" })}
      >
        {content.cta}
      </Link>
    </div>
  );
}
