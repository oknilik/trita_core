"use client";

import { useEffect, useState, Suspense } from "react";
import { ModeSwitcher } from "@/components/landing/ModeSwitcher";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { UserMenu } from "@/components/UserMenu";
import { MobileDrawer } from "@/components/MobileDrawer";
import { t, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

function GlobeButton() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-globe-menu]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" data-globe-menu>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("locale.label", locale)}
        aria-expanded={open}
        className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 transition"
        style={{ color: "#4a4a5e" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
        <span className="text-[11px] font-semibold uppercase tracking-wide">{locale.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] overflow-hidden rounded-xl border border-[#e8e0d3] bg-[#faf9f6] py-1 shadow-[0_8px_24px_rgba(26,26,46,0.10)]">
          {SUPPORTED_LOCALES.map((loc) => {
            const isActive = loc === locale;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => { setLocale(loc as Locale); setOpen(false); }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors"
                style={{
                  color: isActive ? "#c17f4a" : "#4a4a5e",
                  background: isActive ? "rgba(193,127,74,0.06)" : "transparent",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span>{t(`locale.${loc}` as const, locale)}</span>
                {isActive && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 shrink-0" style={{ color: "#c17f4a" }}>
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavCTAInner() {
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const mode = searchParams.get("mode") ?? "self";
  const isTeam = mode === "team";
  return (
    <Link
      href={isTeam ? "/sign-up?type=team" : "/sign-up"}
      className={[
        "inline-flex min-h-[44px] items-center rounded-lg px-5 text-sm font-semibold text-white transition-colors",
        isTeam ? "bg-[#3d6b5e] hover:bg-[#2d5a4e]" : "bg-[#c17f4a] hover:bg-[#9a6538]",
      ].join(" ")}
    >
      {isTeam ? t("nav.ctaTeam", locale) : t("nav.ctaSelf", locale)}
    </Link>
  );
}

function NavCTA() {
  const { locale } = useLocale();
  return (
    <Suspense
      fallback={
        <Link
          href="/sign-up"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-[#c17f4a] px-5 text-sm font-semibold text-white"
        >
          {t("nav.ctaSelf", locale)}
        </Link>
      }
    >
      <NavCTAInner />
    </Suspense>
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
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16">

        {/* Row 1: logo + right side (always) */}
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link
            href="/"
            aria-label="trita"
            className="font-fraunces inline-flex items-baseline text-2xl font-black tracking-[-0.03em] text-ink"
          >
            <span style={{ color: "#3d6b5e" }}>t</span>{"rit"}
            <span className="text-bronze">a</span>
          </Link>

          {/* Desktop center: switcher (only lg+, inside row 1) */}
          <SignedOut>
            <div className="hidden flex-1 items-center justify-center lg:flex">
              <ModeSwitcher />
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex-1" />
          </SignedIn>

          {/* Right side */}
          <div className="flex items-center gap-1">
          {/* Desktop nav — only lg+, fades on scroll */}
          <nav
            className={[
              "hidden items-center gap-6 lg:flex transition-all duration-300",
              scrolled ? "opacity-0 pointer-events-none" : "opacity-100",
            ].join(" ")}
          >
            <SignedOut>
              <Link href="/blog" className="text-sm font-medium text-ink-body/60 transition-colors hover:text-ink-body">
                {t("nav.blog", locale)}
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-ink-body/60 transition-colors hover:text-ink-body">
                {t("nav.pricing", locale)}
              </Link>
              <div className="h-4 w-px bg-ink-body/15" />
              <Link href="/sign-in" className="text-sm font-medium text-ink-body transition-colors hover:text-bronze">
                {t("nav.signIn", locale)}
              </Link>
              <NavCTA />
            </SignedOut>
            <SignedIn>
              <UserMenu />
            </SignedIn>
          </nav>

          {/* Globe — always visible, no auth gate to avoid hydration layout shift */}
          <GlobeButton />

          {/* Hamburger — SignedIn, mobile only */}
          <SignedIn>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("nav.menu", locale)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-sand bg-white text-ink-body transition hover:bg-[#f5efe6] hover:text-ink lg:hidden"
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
          </SignedIn>
        </div>{/* end right side */}
        </div>{/* end row 1 */}

        {/* Row 2: switcher — mobile only, SignedOut */}
        <SignedOut>
          <div className="flex justify-center pb-2 lg:hidden">
            <ModeSwitcher />
          </div>
        </SignedOut>

        <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>

    </header>
  );
}
