"use client";

import Link from "next/link";
import { SignedOut } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { t } from "@/lib/i18n";

export function Footer() {
  const { locale } = useLocale();

  return (
    <footer
      className="relative -mt-16 w-full bg-gradient-to-br from-[#1a1814] via-[#2a2722] to-[#3d3a35] pt-20 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-14"
      style={{ clipPath: "url(#footer-wave)" }}
    >
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
            <p className="text-sm text-[#faf9f6]/85">
              © 2026 trita
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm md:justify-end">
            <Link href="/privacy" className="text-[#faf9f6]/75 underline-offset-4 transition-colors hover:text-[#c8410a] hover:underline">
              {t("landing.privacyLink", locale)}
            </Link>
            <Link
              href="/contact"
              className="text-[#faf9f6]/75 underline-offset-4 transition-colors hover:text-[#c8410a] hover:underline"
            >
              {t("landing.contactLink", locale)}
            </Link>
          </nav>
        </div>

        <SignedOut>
          <div className="mt-6 flex justify-center border-t border-[#faf9f6]/10 pt-4 md:hidden">
            <LocaleSwitcher />
          </div>
        </SignedOut>
      </div>
    </footer>
  );
}
