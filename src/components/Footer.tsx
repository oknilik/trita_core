"use client";

import Link from "next/link";
import { SignedOut } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { t } from "@/lib/i18n";

export function Footer() {
  const { locale } = useLocale();

  return (
    <footer className="relative w-full bg-gradient-to-br from-slate-800 to-indigo-900 pt-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pt-10 md:pb-14">
      <svg className="absolute inset-x-0 top-0 h-12 w-full text-white" viewBox="0 0 1200 50" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,10 C150,42 350,0 600,22 C850,44 1050,0 1200,10 L1200,0 L0,0 Z" />
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
              href="mailto:info@trita.io?subject=Trita%20kapcsolat"
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
