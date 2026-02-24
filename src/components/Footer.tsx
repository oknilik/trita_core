"use client";

import Link from "next/link";
import { SignedOut } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { t } from "@/lib/i18n";

export function Footer() {
  const { locale } = useLocale();
  const contactSubject = encodeURIComponent(t("landing.contactSubject", locale));

  return (
    <footer
      className="relative -mt-16 w-full bg-gradient-to-br from-slate-800 to-indigo-900 pt-20 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-14"
      style={{ clipPath: "url(#footer-wave)" }}
    >
      {/* Clip-path definition — objectBoundingBox so the wave adapts to any footer height */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <clipPath id="footer-wave" clipPathUnits="objectBoundingBox">
            <path d="M0,0.22 C0.18,0.06 0.36,0.3 0.62,0.15 C0.82,0.04 0.95,0.26 1,0.18 L1,1 L0,1 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="mx-auto w-full max-w-5xl px-4">
        <div className="flex flex-col items-center gap-6 pt-4 md:flex-row md:items-start md:justify-between md:pt-8">
          <div className="text-center md:text-left">
            <p className="text-sm text-indigo-200/90">
              © 2026{" "}
              <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text font-bold text-transparent">
                trita
              </span>{" "}
              {t("landing.footer", locale)}
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm md:justify-end">
            <Link href="/privacy" className="text-indigo-200 underline-offset-4 transition-colors hover:text-white hover:underline">
              {t("landing.privacyLink", locale)}
            </Link>
            <Link href="/research" className="text-indigo-200 underline-offset-4 transition-colors hover:text-white hover:underline">
              {t("landing.researchLink", locale)}
            </Link>
            <a
              href={`mailto:info@trita.io?subject=${contactSubject}`}
              className="text-indigo-200 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {t("landing.contactLink", locale)}
            </a>
          </nav>
        </div>

        <SignedOut>
          <div className="mt-6 flex justify-center border-t border-white/10 pt-4 md:hidden">
            <LocaleSwitcher />
          </div>
        </SignedOut>
      </div>
    </footer>
  );
}
