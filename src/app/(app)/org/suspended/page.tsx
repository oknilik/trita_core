import type { Metadata } from "next";
import Link from "next/link";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: `${t("org.suspended.title", locale)} | trita`,
    robots: { index: false },
  };
}

// Az INACTIVE org tagjait az auth-réteg ide tereli (auth.ts). A linkek
// szándékosan NEM org-kontextusú oldalra mutatnak: a korábbi „Szervezetek"
// gomb a /org-ra vitt, ami az aktív (inaktív) org miatt visszairányított ide —
// hurok volt. A /profile/results és a /contact org-kontextus nélkül is él.
export default async function OrgSuspendedPage() {
  const locale = await getServerLocale();

  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center px-4">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-state-warning-bg">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-state-warning-fg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
        </div>

        <SectionEyebrow className="mb-3">
          {t("org.suspended.eyebrow", locale)}
        </SectionEyebrow>
        <h1 className="font-fraunces text-2xl text-ink mb-3">
          {t("org.suspended.title", locale)}
        </h1>
        <p className="text-sm text-ink-body/70 mb-2">
          {t("org.suspended.body1", locale)}
        </p>
        <p className="text-sm text-ink-body/70 mb-8">
          {t("org.suspended.body2", locale)}
        </p>

        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/profile/results"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-6 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
          >
            {t("org.suspended.ctaResults", locale)}
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-sand px-6 text-sm font-semibold text-ink-body transition hover:bg-surface-card"
          >
            {t("org.suspended.ctaContact", locale)}
          </Link>
        </div>
      </div>
    </div>
  );
}
