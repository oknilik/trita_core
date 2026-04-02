"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, useAuth, useClerk } from "@clerk/nextjs";
import { UserMenu } from "@/components/UserMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import type { JourneyExperienceHints } from "@/lib/journey/types";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";

// ─── Active link helper ───────────────────────────────────────────────────────

function isLinkActive(pathname: string, href: string): boolean {
  const normalizedHref = href.split("?")[0] ?? href;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(normalizedHref);
}

// ─── Nav link ─────────────────────────────────────────────────────────────────

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "relative py-4 text-[13px] transition-colors",
        active ? "font-medium text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
      ].join(" ")}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--color-action-primary-bg)]" />
      )}
    </Link>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────

interface NavBarProps {
  signedInHomeHref?: string;
  signedInExperienceHints?: JourneyExperienceHints | null;
}

export function NavBar({
  signedInHomeHref = "/profile/results",
  signedInExperienceHints = null,
}: NavBarProps) {
  const { locale } = useLocale();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const currentPath = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasDraft] = useState(() => hasAssessmentDraftInStorage("HEXACO"));

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
    { href: signedInHomeHref, label: t("nav.home", locale) },
    { href: "/blog", label: t("nav.blog", locale) },
    { href: "/pricing", label: t("nav.pricing", locale) },
  ];

  const links = isSignedIn ? authLinks : publicLinks;
  const shouldShowSignedInHint = Boolean(
    isSignedIn &&
      signedInExperienceHints &&
      (signedInExperienceHints.showOrgExpansionPrompt ||
        signedInExperienceHints.showTeamCreationBanner ||
        signedInExperienceHints.showAssessmentContinuation),
  );

  const signedInHint = !signedInExperienceHints
    ? null
    : signedInExperienceHints.showOrgExpansionPrompt
      ? {
          body: locale === "hu"
            ? "Új szervezeti meghívásod érkezett. Csatlakozz, ha szeretnéd kiterjeszteni a saját insightodat csapat- és org-szintre."
            : "You have a new organization invite. Join to extend your self insights to team and org levels.",
          ctaLabel: locale === "hu" ? "Meghívás megnyitása" : "Open invite",
          ctaHref: signedInHomeHref,
        }
      : signedInExperienceHints.showTeamCreationBanner
        ? {
            body: locale === "hu"
              ? "Team fókuszt választottál. Hozd létre az első csapatodat, és építs közös képet a self eredményekből."
              : "You selected a team-focused path. Create your first team to build shared insights from self results.",
            ctaLabel: locale === "hu" ? "Csapat létrehozása" : "Create a team",
            ctaHref: "/onboarding?intent=team",
          }
        : signedInExperienceHints.showAssessmentContinuation
          ? {
              body: locale === "hu"
                ? "Félbehagytad a self assessmentet. Folytasd onnan, ahol abbahagytad."
                : "Your self assessment is in progress. Continue where you left off.",
              ctaLabel: locale === "hu" ? "Assessment folytatása" : "Continue assessment",
              ctaHref: "/assessment",
            }
          : null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[rgba(250,249,246,0.95)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 lg:px-8">

          {/* ═══ LOGO ═══ */}
          <Link
            href={isSignedIn ? signedInHomeHref : "/"}
            aria-label="trita"
            className="font-fraunces text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]"
          >
            <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
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
                className="hidden rounded-lg border border-[var(--color-border-default)] bg-white px-4 py-[7px] text-[13px] text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] lg:inline-flex"
              >
                {t("nav.signIn", locale)}
              </Link>
              {/* CTA — always visible */}
              <Link
                href="/try"
                className="rounded-lg bg-[var(--color-accent-primary)] px-4 py-[7px] text-[12px] font-semibold text-white transition-all hover:brightness-[1.06] lg:px-5 lg:py-2 lg:text-[13px]"
              >
                {hasDraft ? t("landing.selfCtaContinueShort", locale) : t("nav.ctaSelf", locale)}
              </Link>
            </SignedOut>

            <SignedIn>
              <UserMenu />
            </SignedIn>

            {/* Separator + Language — always visible */}
            <div className="hidden h-5 w-px bg-[var(--color-border-default)] lg:block" />
            <LanguageSwitcher />

            {/* Hamburger — mobile */}
            <button
              type="button"
              onClick={() => {
                if (!isSignedIn) {
                  setDrawerOpen(false);
                  return;
                }
                setDrawerOpen((v) => !v);
              }}
              aria-label={t("nav.menu", locale)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--color-text-muted)] lg:hidden"
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

      {shouldShowSignedInHint && signedInHint ? (
        <div className="border-b border-[var(--color-border-default)] bg-[var(--color-surface-canvas)]">
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 px-5 py-2.5 lg:px-8">
            <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">{signedInHint.body}</p>
            <Link
              href={signedInHint.ctaHref}
              className="shrink-0 rounded-md border border-[var(--color-border-soft)] bg-white px-3 py-1.5 text-[11px] font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
            >
              {signedInHint.ctaLabel}
            </Link>
          </div>
        </div>
      ) : null}

      {/* ═══ MOBILE MENU — full screen ═══ */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden"
          style={{ animation: "fade-in 150ms ease-out" }}
        >
          {/* Top bar — matches main navbar exactly */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border-default)] bg-[rgba(250,249,246,0.95)] px-5">
            <Link
              href={isSignedIn ? signedInHomeHref : "/"}
              onClick={() => setDrawerOpen(false)}
              className="font-fraunces text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]"
            >
              <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
            </Link>
            <div className="flex items-center gap-3">
              <SignedOut>
                <Link
                  href="/try"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg bg-[var(--color-accent-primary)] px-4 py-[7px] text-[12px] font-semibold text-white"
                >
                  {hasDraft ? t("landing.selfCtaContinueShort", locale) : t("nav.ctaSelf", locale)}
                </Link>
              </SignedOut>
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center text-lg text-[var(--color-text-muted)]"
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
                    ? "text-[var(--color-action-primary-bg)]"
                    : "text-[var(--color-text-secondary)]",
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
                  className="flex flex-1 items-center justify-center rounded-xl border border-[var(--color-border-default)] bg-white py-3.5 text-[14px] font-medium text-[var(--color-text-secondary)]"
                >
                  {t("nav.signIn", locale)}
                </Link>
                <Link
                  href="/try"
                  onClick={() => setDrawerOpen(false)}
                  className="flex flex-1 items-center justify-center rounded-xl bg-[var(--color-accent-primary)] py-3.5 text-[14px] font-semibold text-white"
                >
                  {hasDraft ? t("landing.selfCtaContinueShort", locale) : t("nav.ctaSelf", locale)}
                </Link>
              </div>
            </SignedOut>
            <SignedIn>
              <button
                type="button"
                onClick={() => { signOut(); setDrawerOpen(false); }}
                className="w-full rounded-xl border border-[var(--color-border-default)] py-3.5 text-center text-[14px] text-[var(--color-text-muted)]"
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
