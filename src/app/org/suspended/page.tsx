import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Szervezet inaktív | Trita",
  robots: { index: false },
};

export default function OrgSuspendedPage() {
  return (
    <div className="min-h-dvh bg-cream flex items-center justify-center px-4">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-amber-600"
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

        <p className="font-mono text-xs uppercase tracking-widest text-bronze mb-3">
          // inaktív
        </p>
        <h1 className="font-fraunces text-2xl text-ink mb-3">
          Szervezet inaktív
        </h1>
        <p className="text-sm text-ink-body/70 mb-2">
          A szervezet, amelyhez tartozol, jelenleg inaktív.
        </p>
        <p className="text-sm text-ink-body/70 mb-8">
          Ha úgy gondolod, ez hiba, keresd a szervezet adminisztrátorát.
        </p>

        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/profile/results"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-6 text-sm font-semibold text-white transition hover:bg-sage-dark"
          >
            Vissza az irányítópulthoz
          </Link>
          <Link
            href="/org"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-sand px-6 text-sm font-semibold text-ink-body transition hover:bg-white"
          >
            Szervezetek
          </Link>
        </div>
      </div>
    </div>
  );
}
