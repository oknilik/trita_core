"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { UserMenu } from "@/components/UserMenu";
import { MobileDrawer } from "@/components/MobileDrawer";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

export function NavBar() {
  const { locale } = useLocale();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const linkClass = (href: string) =>
    `min-h-[44px] flex items-center hover:text-indigo-600 ${
      pathname === href ? "text-indigo-600" : ""
    }`;

  return (
    <header className="relative z-40 w-full bg-white pb-2">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/trita-logo.svg" alt="trita" className="h-[90px] w-auto" />
        </Link>
        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-4 text-sm font-semibold text-gray-600">
          <SignedOut>
            <LocaleSwitcher />
            <Link href="/sign-in" className={linkClass("/sign-in")}>
              {t("actions.signInCta", locale)}
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              {t("actions.signUpCta", locale)}
            </Link>
          </SignedOut>
          <SignedIn>
            <UserMenu />
          </SignedIn>
        </nav>

        {/* Mobile: signed out → auth buttons only (no hamburger, no locale switcher) */}
        <SignedOut>
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              href="/sign-in"
              className="min-h-[44px] flex items-center text-sm font-semibold text-gray-600 hover:text-indigo-600"
            >
              {t("actions.signInCta", locale)}
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              {t("actions.signUpCta", locale)}
            </Link>
          </div>
        </SignedOut>

        {/* Mobile: signed in → hamburger menu */}
        <SignedIn>
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("nav.menu", locale)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="h-6 w-6"
              >
                <path d="M3 5 C6 3.8, 10 6.2, 13 5 C15 4.2, 16.5 4.8, 17 5" />
                <path d="M3 10 C6 11.2, 10 8.8, 13 10 C15 10.8, 16.5 9.5, 17 10" />
                <path d="M3 15 C6 13.8, 10 16.2, 13 15 C15 14.2, 16.5 14.8, 17 15" />
              </svg>
            </button>
          </div>
        </SignedIn>

        <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
      <svg className="absolute inset-x-0 -bottom-5 h-7 w-full text-white" viewBox="0 0 1200 50" preserveAspectRatio="none" fill="currentColor">
        <path d="M0,0 L0,10 C150,42 350,0 600,22 C850,44 1050,0 1200,10 L1200,0 Z" />
      </svg>
    </header>
  );
}
