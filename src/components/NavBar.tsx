"use client";

import { useEffect, useState } from "react";
import { isConsultingLed } from "@/lib/operating-mode";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "@/components/auth/auth-state";
import { UserMenu } from "@/components/UserMenu";
import { TritaWordmark } from "@/components/TritaLogo";
import { MobileMenuShell, MobileMenuRow } from "@/components/layout/mobile-menu";
import { t } from "@/lib/i18n/public";
import { useLocale } from "@/components/LocaleProvider";
import type { JourneyExperienceHints } from "@/lib/journey/types";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";
import { useSiteMode } from "@/components/landing/site-mode";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

// ─── Active link helper ───────────────────────────────────────────────────────

function isLinkActive(pathname: string, href: string): boolean {
  const normalizedHref = href.split("?")[0] ?? href;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(normalizedHref);
}

// ─── Link-ikonok (menü-konvergencia: az app-nav ikonos nyelvét követik) ──────

function HomeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 7L8 2l5.5 5" />
      <path d="M4 6.5V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.5" />
    </svg>
  );
}

function BlogIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
      <path d="M5 5.5h6M5 8h6M5 10.5h3.5" />
    </svg>
  );
}

function CollabIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1.5 14a4.5 4.5 0 0 1 9 0" />
      <circle cx="11.5" cy="6" r="2" />
      <path d="M11.5 10.5a3.5 3.5 0 0 1 3 3.5" />
    </svg>
  );
}

function GridIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1" y="1" width="6" height="6" rx="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
    </svg>
  );
}

const LINK_ICONS: Record<string, (p: { className?: string }) => React.ReactNode> = {
  home: HomeIcon,
  dashboard: GridIcon,
  blog: BlogIcon,
  pricing: CollabIcon,
};

// ─── Nav link — az app-nav (NavHeaderUI) aktív/inaktív stílusával ────────────

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex min-h-9 items-center gap-1.5 rounded-[10px] px-3 text-caption transition-[color,background-color,box-shadow]",
        FOCUS_RING_CLASS,
        active
          ? "bg-[var(--color-surface-inverse)] font-semibold text-[var(--color-text-on-inverse)] shadow-[0_3px_10px_rgba(26,26,46,0.14)]"
          : "font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-card)] hover:text-[var(--color-text-primary)]",
      ].join(" ")}
    >
      {icon}
      {label}
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
  // Az auth-állapot a nav-context-ből jön (Clerk kliens-hook nélkül): a
  // marketing zónában egy könnyű lekérés, az app zónában a szerver-érték
  // adja — így a marketing-fa nem szállít clerk-js bundle-t.
  const { isSignedIn } = useAuthState();
  const currentPath = usePathname();
  const siteMode = useSiteMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // UX-A18: localStorage-t nem olvasunk render közben (hydration mismatch:
  // a szerver "Kipróbálom"-ot, a kliens "Folytatom"-ot adott) — a landing
  // komponensek useEffect-mintáját követjük.
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasDraft(hasAssessmentDraftInStorage("TRITAN"));
  }, []);

  // Hide on assessment/try pages (they have their own minimal nav)
  if (currentPath.startsWith("/try") || currentPath.startsWith("/assessment")) return null;

  const isTeamLanding = currentPath === "/" && siteMode === "team";
  const publicCtaHref = isTeamLanding ? "/pilot" : "/try";
  const publicCtaLabel = isTeamLanding
    ? t("nav.ctaTeam", locale)
    : hasDraft
      ? t("landing.selfCtaContinueShort", locale)
      : t("nav.ctaSelf", locale);

  // A megosztott profil nem marketing-belépőoldal, hanem egy személyes
  // artefaktum. Itt a teljes navigáció elvinné a figyelmet a tartalomról;
  // csak a márka és az egyetlen releváns sajátprofil-CTA marad. A nyelv a
  // footerben érhető el: az angol támogatás szándékosan csendes.
  if (currentPath.startsWith("/share/")) {
    return (
      <header className="sticky top-0 z-40 bg-transparent">
        <div className="mx-auto mt-2 flex h-14 w-[calc(100%-1.5rem)] max-w-4xl items-center justify-between gap-3 rounded-[19px] border border-[var(--color-border-default)] bg-[var(--color-surface-header)]/95 px-4 shadow-[0_10px_28px_rgba(26,26,46,0.10)] backdrop-blur-[14px] md:mt-3 md:px-5">
          <Link
            href="/"
            aria-label="trita"
            className={`rounded-md text-[var(--color-text-primary)] ${FOCUS_RING_CLASS}`}
          >
            <TritaWordmark className="text-lg" />
          </Link>
          <div className="flex items-center">
            <Link
              href="/try"
              className={`inline-flex min-h-10 items-center rounded-[13px] bg-[var(--color-bronze-dark)] px-4 text-xs font-semibold text-[var(--color-text-on-accent-deep)] shadow-[0_5px_14px_rgba(139,82,48,0.18)] transition-all hover:brightness-[1.06] ${FOCUS_RING_CLASS}`}
            >
              <span>{t("nav.ctaSharedOwnProfile", locale)}</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const publicLinks = [
    { id: "home", href: "/", label: t("nav.publicHome", locale) },
    ...(isPortfolioSurfaceActive("blog")
      ? [{ id: "blog", href: "/blog", label: t("nav.blog", locale) }]
      : []),
    { id: "pricing", href: "/how-we-work", label: t("nav.pricing", locale) },
  ];

  const authLinks = [
    // Bejelentkezve a link az appba (journey handoff) visz — a címke is
    // ezt mondja, ne 'Főoldal'-t (design-akciólista #18).
    { id: "dashboard", href: signedInHomeHref, label: t("nav.dashboard", locale) },
    ...(isPortfolioSurfaceActive("blog")
      ? [{ id: "blog", href: "/blog", label: t("nav.blog", locale) }]
      : []),
    { id: "pricing", href: "/how-we-work", label: t("nav.pricing", locale) },
  ];

  const links = isSignedIn ? authLinks : publicLinks;
  const shouldShowSignedInHint = Boolean(
    isSignedIn &&
      signedInExperienceHints &&
      (signedInExperienceHints.showOrgExpansionPrompt ||
        (signedInExperienceHints.showTeamCreationBanner && !isConsultingLed()) ||
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
      : signedInExperienceHints.showTeamCreationBanner && !isConsultingLed()
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
      <header
        data-testid="public-nav-header"
        data-compact="false"
        className="sticky top-0 z-40 bg-transparent"
      >
        <div
          className="mx-auto mt-2 grid h-14 w-[calc(100%-1.5rem)] max-w-[1180px] grid-cols-[auto_1fr_auto] items-center rounded-[19px] border border-[var(--color-border-default)] bg-[var(--color-surface-header)]/95 px-3 shadow-[0_10px_28px_rgba(26,26,46,0.10)] backdrop-blur-[14px] sm:px-4 lg:mt-3 lg:h-[68px] lg:grid-cols-[1fr_auto_1fr] lg:rounded-[22px] lg:px-5"
        >

          {/* ═══ LOGO ═══ */}
          <Link
            href={isSignedIn ? signedInHomeHref : "/"}
            aria-label="trita"
            className={`pointer-events-auto justify-self-start rounded-md text-[var(--color-text-primary)] ${FOCUS_RING_CLASS}`}
          >
            <TritaWordmark className="text-heading tracking-[-0.04em]" />
          </Link>

          {/* ═══ CENTER LINKS — desktop only ═══ */}
          <nav
            aria-label={t("nav.menu", locale)}
            className="pointer-events-auto hidden items-center gap-1 rounded-[15px] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] p-1 shadow-[0_1px_2px_rgba(26,26,46,0.04)] lg:flex lg:justify-self-center"
          >
            {links.map((link) => {
              const Icon = LINK_ICONS[link.id] ?? HomeIcon;
              return (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={<Icon className="h-3.5 w-3.5" />}
                  active={isLinkActive(currentPath, link.href)}
                />
              );
            })}
          </nav>

          {/* ═══ RIGHT SIDE ═══ */}
          <div className="pointer-events-auto flex items-center gap-2 justify-self-end">
            {!isSignedIn && (
              <>
                {/* Csendes másodlagos belépő: a tiszta felirat nem versenyez
                    a fő CTA-val, és nem igényel magyarázó ikont. */}
                <Link
                  href="/sign-in"
                  className={`hidden min-h-10 items-center rounded-[11px] px-3 text-caption font-medium text-[var(--color-accent-self-deep)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-action-primary-bg-hover)] lg:inline-flex ${FOCUS_RING_CLASS}`}
                >
                  <span>{t("nav.signIn", locale)}</span>
                </Link>
                <Link
                  href={publicCtaHref}
                  aria-label={publicCtaLabel}
                  className={`inline-flex min-h-10 items-center rounded-[13px] bg-[var(--color-bronze-dark)] px-4 text-xs font-semibold text-[var(--color-text-on-accent-deep)] shadow-[0_5px_14px_rgba(139,82,48,0.18)] transition-[filter,transform] hover:-translate-y-px hover:brightness-[1.06] lg:px-5 lg:text-caption ${FOCUS_RING_CLASS}`}
                >
                  <span>{publicCtaLabel}</span>
                </Link>
              </>
            )}

            {isSignedIn && <UserMenu />}

            {/* Hamburger — mobile */}
            <button
              type="button"
              onClick={() => {
                setDrawerOpen((v) => !v);
              }}
              aria-label={t("nav.menu", locale)}
              aria-expanded={drawerOpen}
              className={`pointer-events-auto flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border-default)] lg:hidden ${FOCUS_RING_CLASS}`}
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
        <div className="bg-[var(--color-surface-canvas)]">
          <div className="mx-auto flex w-[calc(100%-1.5rem)] max-w-[1180px] items-start justify-between gap-3 border-b border-[var(--color-border-default)] px-5 py-2.5 lg:px-8">
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{signedInHint.body}</p>
            <Link
              href={signedInHint.ctaHref}
              className={`shrink-0 rounded-md border border-[var(--color-border-soft)] bg-surface-card px-3 py-1.5 text-note font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
            >
              {signedInHint.ctaLabel}
            </Link>
          </div>
        </div>
      ) : null}

      {/* ═══ MOBIL MENÜ — közös kártya-panel (menü-konvergencia): ugyanaz a
          váz, mint a belépett NavHeaderUI menüje. ═══ */}
      <MobileMenuShell
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        label={t("nav.menu", locale)}
      >
        <div className="p-3">
          <div className="flex flex-col gap-0.5">
            {links.map((link) => {
              const Icon = LINK_ICONS[link.id] ?? HomeIcon;
              return (
                <MobileMenuRow
                  key={link.href}
                  href={link.href}
                  icon={<Icon className="h-4 w-4" />}
                  title={link.label}
                  onClick={() => setDrawerOpen(false)}
                />
              );
            })}
          </div>

          {isSignedIn ? (
            <div className="mt-3 border-t border-[var(--color-border-soft)] pt-3">
              {/* Kijelentkezés — a „Belépés" gombbal azonos stílusban és
                  pozícióban. A /sign-out route-on fut (ott van ClerkProvider). */}
              <Link
                href="/sign-out"
                onClick={() => setDrawerOpen(false)}
                className={`flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-surface-card text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
              >
                {t("nav.signOut", locale)}
              </Link>
            </div>
          ) : null}

          {!isSignedIn ? (
            <div className="mt-3 flex gap-2 border-t border-[var(--color-border-soft)] pt-3">
              <Link
                href="/sign-in"
                onClick={() => setDrawerOpen(false)}
                className={`flex min-h-[44px] flex-1 items-center justify-center rounded-lg px-2 text-sm font-medium text-[var(--color-accent-self-deep)] transition-colors hover:bg-[var(--color-surface-subtle)] ${FOCUS_RING_CLASS}`}
              >
                <span>{t("nav.signIn", locale)}</span>
              </Link>
              <Link
                href={publicCtaHref}
                aria-label={publicCtaLabel}
                onClick={() => setDrawerOpen(false)}
                className={`flex min-h-[44px] flex-1 items-center justify-center rounded-[13px] bg-[var(--color-bronze-dark)] px-3 text-caption font-semibold text-[var(--color-text-on-accent-deep)] transition-all hover:brightness-[1.06] ${FOCUS_RING_CLASS}`}
              >
                <span>{publicCtaLabel}</span>
              </Link>
            </div>
          ) : null}

        </div>
      </MobileMenuShell>

    </>
  );
}
