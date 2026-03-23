"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { UserMenu } from "@/components/UserMenu";
import { MobileDrawer } from "@/components/MobileDrawer";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

export function NavBar() {
  const { locale } = useLocale();
  const { isSignedIn } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isSignedIn) setDrawerOpen(false);
  }, [isSignedIn]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sand bg-[rgba(250,249,246,0.95)] backdrop-blur-[12px]">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-4 lg:px-16">
        <Link
          href="/"
          aria-label="trita"
          className="font-fraunces inline-flex items-baseline text-2xl font-black tracking-[-0.03em] text-ink"
        >
          {"trit"}
          <span className="text-bronze">a</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <SignedOut>
            <Link href="/#how-it-works" className="text-sm font-medium text-ink-body transition-colors hover:text-bronze">
              Hogyan működik
            </Link>
            <Link href="/founding" className="text-sm font-medium text-ink-body transition-colors hover:text-bronze">
              Alapító program
            </Link>
            <Link href="/blog" className="text-sm font-medium text-ink-body transition-colors hover:text-bronze">
              Blog
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-ink-body transition-colors hover:text-bronze">
              Árazás
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-ink-body transition-colors hover:text-bronze"
            >
              Bejelentkezés
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-white transition-colors hover:bg-sage-dark"
            >
              Kipróbálom ingyen
            </Link>
          </SignedOut>
          <SignedIn>
            <UserMenu />
          </SignedIn>
        </nav>

        <SignedOut>
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              href="/sign-in"
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-ink-body hover:text-bronze"
            >
              Bejelentkezés
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex min-h-[44px] items-center rounded-lg bg-sage px-4 text-sm font-semibold text-white transition-colors hover:bg-sage-dark"
            >
              Kipróbálom
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("nav.menu", locale)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-sand bg-white text-ink-body transition hover:bg-[#f5efe6] hover:text-ink"
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
    </header>
  );
}
