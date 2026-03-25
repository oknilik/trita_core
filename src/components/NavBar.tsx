"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { SignedIn, SignedOut, useAuth, useClerk } from "@clerk/nextjs";
import { UserMenu } from "@/components/UserMenu";
import { t, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

// ─── Language switcher ────────────────────────────────────────────────────────

function LanguageSwitcher({ variant = "dropdown" }: { variant?: "dropdown" | "pills" }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-lang-menu]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Pill toggle variant (for mobile menu)
  if (variant === "pills") {
    return (
      <div className="flex gap-2">
        {SUPPORTED_LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc as Locale)}
            className={[
              "rounded-full px-4 py-1.5 text-[12px] font-medium transition-all",
              loc === locale
                ? "bg-[#3d6b5e] text-white"
                : "bg-[#f2ede6] text-[#8a8a9a] hover:bg-[#e8e0d3]",
            ].join(" ")}
          >
            {t(`locale.${loc}` as const, locale)}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant (for desktop navbar)
  return (
    <div className="relative" data-lang-menu>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("locale.label", locale)}
        aria-expanded={open}
        className={[
          "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-[#8a8a9a] transition-all",
          "hover:bg-[#f2ede6] hover:text-[#4a4a5e]",
          open ? "bg-[#f2ede6] text-[#4a4a5e]" : "",
        ].join(" ")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="font-semibold uppercase tracking-wide">{locale.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-[#e8e0d3] bg-white py-1 shadow-lg shadow-black/[0.04]">
          {SUPPORTED_LOCALES.map((loc) => {
            const isActive = loc === locale;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => { setLocale(loc as Locale); setOpen(false); }}
                className={[
                  "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[13px] transition-colors",
                  isActive
                    ? "bg-[#e8f2f0] font-medium text-[#3d6b5e]"
                    : "text-[#4a4a5e] hover:bg-[#f2ede6]",
                ].join(" ")}
              >
                <span>{t(`locale.${loc}` as const, locale)}</span>
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#3d6b5e]">
                    <polyline points="20 6 9 17 4 12" />
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

// ─── Active link helper ───────────────────────────────────────────────────────

function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

// ─── Nav link ─────────────────────────────────────────────────────────────────

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "relative py-4 text-[13px] transition-colors",
        active ? "font-medium text-[#1a1a2e]" : "text-[#8a8a9a] hover:text-[#4a4a5e]",
      ].join(" ")}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#3d6b5e]" />
      )}
    </Link>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────

export function NavBar() {
  const { locale, setLocale } = useLocale();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const currentPath = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (!isSignedIn) setDrawerOpen(false);
  }, [isSignedIn]);

  // Detect localStorage draft for guest CTA text
  useEffect(() => {
    try {
      const saved = localStorage.getItem("trita_draft_HEXACO");
      if (saved) {
        const parsed = JSON.parse(saved);
        const answers = parsed?.answers ?? parsed;
        if (answers && Object.keys(answers).length > 0) setHasDraft(true);
      }
    } catch { /* ignore */ }
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // Hide on assessment/try pages (they have their own minimal nav)
  if (currentPath.startsWith("/try") || currentPath.startsWith("/assessment")) return null;

  const publicLinks = [
    { href: "/", label: t("nav.home", locale) },
    { href: "/blog", label: t("nav.blog", locale) },
    { href: "/pricing", label: t("nav.pricing", locale) },
  ];

  const authLinks = [
    { href: "/profile/results", label: t("nav.profile", locale) },
    { href: "/blog", label: t("nav.blog", locale) },
    { href: "/pricing", label: t("nav.pricing", locale) },
  ];

  const links = isSignedIn ? authLinks : publicLinks;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#e8e0d3] bg-[rgba(250,249,246,0.95)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 lg:px-8">

          {/* ═══ LOGO ═══ */}
          <Link
            href={isSignedIn ? "/profile/results" : "/"}
            aria-label="trita"
            className="font-fraunces text-lg font-black tracking-[-0.03em] text-[#1a1a2e]"
          >
            <span className="text-[#3d6b5e]">t</span>rit<span className="text-[#c17f4a]">a</span>
          </Link>

          {/* ═══ CENTER LINKS — desktop only ═══ */}
          <nav className="hidden items-center gap-6 lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={isLinkActive(currentPath, link.href)}
              />
            ))}
          </nav>

          {/* ═══ RIGHT SIDE ═══ */}
          <div className="flex items-center gap-2">
            <SignedOut>
              {/* Sign in — desktop only */}
              <Link
                href="/sign-in"
                className="hidden rounded-lg border border-[#e8e0d3] bg-white px-4 py-[7px] text-[13px] text-[#4a4a5e] transition-all hover:border-[#8a8a9a] hover:bg-[#f2ede6] lg:inline-flex"
              >
                {t("nav.signIn", locale)}
              </Link>
              {/* CTA — always visible */}
              <Link
                href="/try"
                className="rounded-lg bg-[#c17f4a] px-4 py-[7px] text-[12px] font-semibold text-white transition-all hover:brightness-[1.06] lg:px-5 lg:py-2 lg:text-[13px]"
              >
                {hasDraft ? t("landing.selfCtaContinueShort", locale) : t("nav.ctaSelf", locale)}
              </Link>
            </SignedOut>

            <SignedIn>
              <UserMenu />
            </SignedIn>

            {/* Separator + Language — always visible */}
            <div className="hidden h-5 w-px bg-[#e8e0d3] lg:block" />
            <LanguageSwitcher />

            {/* Hamburger — mobile */}
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label={t("nav.menu", locale)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#8a8a9a] lg:hidden"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-5 w-5">
                {drawerOpen ? (
                  <><path d="M4 4l12 12" /><path d="M16 4L4 16" /></>
                ) : (
                  <><path d="M3 5h14" /><path d="M3 10h14" /><path d="M3 15h14" /></>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MOBILE MENU — full screen ═══ */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden"
          style={{ animation: "fade-in 150ms ease-out" }}
        >
          {/* Top bar — matches main navbar exactly */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e8e0d3] bg-[rgba(250,249,246,0.95)] px-5">
            <Link
              href={isSignedIn ? "/profile/results" : "/"}
              onClick={() => setDrawerOpen(false)}
              className="font-fraunces text-lg font-black tracking-[-0.03em] text-[#1a1a2e]"
            >
              <span className="text-[#3d6b5e]">t</span>rit<span className="text-[#c17f4a]">a</span>
            </Link>
            <div className="flex items-center gap-3">
              <SignedOut>
                <Link
                  href="/try"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg bg-[#c17f4a] px-4 py-[7px] text-[12px] font-semibold text-white"
                >
                  {hasDraft ? t("landing.selfCtaContinueShort", locale) : t("nav.ctaSelf", locale)}
                </Link>
              </SignedOut>
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center text-lg text-[#8a8a9a]"
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-5 w-5">
                  <path d="M4 4l12 12" /><path d="M16 4L4 16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Center links */}
          <div className="flex flex-1 flex-col items-center justify-center gap-1 px-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                className={[
                  "py-5 text-center font-fraunces text-xl transition-colors",
                  isLinkActive(currentPath, link.href)
                    ? "text-[#3d6b5e]"
                    : "text-[#4a4a5e]",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}

          </div>

          {/* Bottom buttons */}
          <div className="shrink-0 px-5 pb-8 pt-4">
            <SignedOut>
              <div className="flex gap-3">
                <Link
                  href="/sign-in"
                  onClick={() => setDrawerOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-xl border border-[#e8e0d3] bg-white py-3.5 text-[14px] font-medium text-[#4a4a5e]"
                >
                  {t("nav.signIn", locale)}
                </Link>
                <Link
                  href="/try"
                  onClick={() => setDrawerOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-xl bg-[#c17f4a] py-3.5 text-[14px] font-semibold text-white"
                >
                  {hasDraft ? t("landing.selfCtaContinueShort", locale) : t("nav.ctaSelf", locale)}
                </Link>
              </div>
            </SignedOut>
            <SignedIn>
              <button
                type="button"
                onClick={() => { signOut(); setDrawerOpen(false); }}
                className="w-full rounded-xl border border-[#e8e0d3] py-3.5 text-center text-[14px] text-[#8a8a9a]"
              >
                {t("nav.signOut", locale)}
              </button>
            </SignedIn>
          </div>
        </div>
      )}

    </>
  );
}
