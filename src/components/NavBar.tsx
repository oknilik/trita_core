"use client";

import { useEffect, useState, Suspense } from "react";
import { ModeSwitcher } from "@/components/landing/ModeSwitcher";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { UserMenu } from "@/components/UserMenu";
import { MobileDrawer } from "@/components/MobileDrawer";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

function NavCTAInner() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "self";
  const isTeam = mode === "team";
  return (
    <Link
      href="/sign-up"
      className={[
        "inline-flex min-h-[44px] items-center rounded-lg px-5 text-sm font-semibold text-white transition-colors",
        isTeam ? "bg-[#3d6b5e] hover:bg-[#2d5a4e]" : "bg-[#c17f4a] hover:bg-[#9a6538]",
      ].join(" ")}
    >
      {isTeam ? "Csapat →" : "Kipróbálom →"}
    </Link>
  );
}

function NavCTA() {
  return (
    <Suspense
      fallback={
        <Link
          href="/sign-up"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-[#c17f4a] px-5 text-sm font-semibold text-white"
        >
          Kipróbálom →
        </Link>
      }
    >
      <NavCTAInner />
    </Suspense>
  );
}

function MobileNavCTAInner() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "self";
  const isTeam = mode === "team";
  return (
    <Link
      href="/sign-up"
      className={[
        "inline-flex min-h-[44px] items-center rounded-lg px-4 text-sm font-semibold text-white transition-colors",
        isTeam ? "bg-[#3d6b5e] hover:bg-[#2d5a4e]" : "bg-[#c17f4a] hover:bg-[#9a6538]",
      ].join(" ")}
    >
      {isTeam ? "Csapat" : "Kipróbálom"}
    </Link>
  );
}

export function NavBar() {
  const { locale } = useLocale();
  const { isSignedIn } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isSignedIn) setDrawerOpen(false);
  }, [isSignedIn]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[rgba(250,249,246,0.95)] backdrop-blur-[12px]">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-3 sm:px-10 lg:px-16">
        {/* Logo */}
        <Link
          href="/"
          aria-label="trita"
          className="font-fraunces inline-flex items-baseline text-2xl font-black tracking-[-0.03em] text-ink"
        >
          <span style={{ color: "#3d6b5e" }}>t</span>{"rit"}
          <span className="text-bronze">a</span>
        </Link>

        {/* Right: nav links + CTA — elrejtve görgetéskor */}
        <nav
          className={[
            "hidden items-center gap-6 sm:flex transition-all duration-300",
            scrolled ? "opacity-0 pointer-events-none" : "opacity-100",
          ].join(" ")}
        >
          <SignedOut>
            <Link href="/blog" className="text-sm font-medium text-ink-body/60 transition-colors hover:text-ink-body">
              Blog
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-ink-body/60 transition-colors hover:text-ink-body">
              Árazás
            </Link>
            <div className="h-4 w-px bg-ink-body/15" />
            <Link href="/sign-in" className="text-sm font-medium text-ink-body transition-colors hover:text-bronze">
              Bejelentkezés
            </Link>
            <NavCTA />
          </SignedOut>
          <SignedIn>
            <UserMenu />
          </SignedIn>
        </nav>

        {/* Mobile right — elrejtve görgetéskor */}
        <SignedOut>
          <div
            className={[
              "flex items-center sm:hidden transition-all duration-300",
              scrolled ? "opacity-0 pointer-events-none" : "opacity-100",
            ].join(" ")}
          >
            <Suspense
              fallback={
                <Link href="/sign-up" className="inline-flex min-h-[44px] items-center rounded-lg bg-[#c17f4a] px-4 text-sm font-semibold text-white">
                  Kipróbálom
                </Link>
              }
            >
              <MobileNavCTAInner />
            </Suspense>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center gap-2 sm:hidden">
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

      {/* Switcher sor — mindig látható */}
      <SignedOut>
        <div className="flex justify-center pb-3 pt-1">
          <ModeSwitcher />
        </div>
      </SignedOut>
    </header>
  );
}
