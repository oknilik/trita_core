"use client";

import { useEffect, useState } from "react";
import { isConsultingLed } from "@/lib/operating-mode";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "@/components/auth/auth-state";
import { UserMenu } from "@/components/UserMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileMenuShell, MobileMenuRow, MobileMenuSectionLabel } from "@/components/layout/mobile-menu";
import { t } from "@/lib/i18n/public";
import { useLocale } from "@/components/LocaleProvider";
import type { JourneyExperienceHints } from "@/lib/journey/types";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";
import { useSiteMode } from "@/components/landing/site-mode";

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
      className={[
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-caption transition-all",
        // Aktív állapot: accent-primary-STRONG a bronzon — a világosabb
        // accent-primary a surface-subtle chipen csak 2.82:1 (13px szöveg,
        // AA-bukó); a strong 5.27:1, ugyanabból a bronz-családból.
        active
          ? "bg-[var(--color-surface-subtle)] font-semibold text-[var(--color-accent-primary-strong)]"
          : "font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-canvas)] hover:text-[var(--color-text-primary)]",
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
  /**
   * Látszik-e a séma-választó. Alapból NEM: ezt a navot a marketing-fa is
   * használja, ahol a sötét mód szándékosan nincs hatókörben — ott egy
   * kapcsoló, ami láthatóan nem csinál semmit, hibának tűnne.
   * Az (app) zóna kijelentkezett ága (`/try`, `/observe/[token]`,
   * `/join/[token]`, `/share/[token]`) viszont `.theme-scope`-on belül van,
   * ezért ott bekapcsoljuk.
   */
  showThemeToggle?: boolean;
}

export function NavBar({
  signedInHomeHref = "/profile/results",
  signedInExperienceHints = null,
  showThemeToggle = false,
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
  const publicCtaHref = isTeamLanding ? "/contact" : "/try";
  const publicCtaLabel = isTeamLanding
    ? t("nav.ctaTeam", locale)
    : hasDraft
      ? t("landing.selfCtaContinueShort", locale)
      : t("nav.ctaSelf", locale);

  // A megosztott profil nem marketing-belépőoldal, hanem egy személyes
  // artefaktum. Itt a teljes navigáció elvinné a figyelmet a tartalomról;
  // csak a márka, a nyelv és az egyetlen releváns sajátprofil-CTA marad.
  if (currentPath.startsWith("/share/")) {
    return (
      <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-surface-header)]/95 backdrop-blur-[12px]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4 md:px-5">
          <Link
            href="/"
            aria-label="trita"
            className="font-fraunces text-lg font-black tracking-[-0.03em] text-[var(--color-text-primary)]"
          >
            <span className="text-[var(--color-action-primary-bg)]">t</span>rit<span className="text-[var(--color-accent-primary)]">a</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/try"
              className="rounded-lg bg-[var(--color-bronze-dark)] px-3.5 py-2 text-[12px] font-semibold text-[var(--color-text-on-accent-deep)] transition-all hover:brightness-[1.06] sm:px-4"
            >
              {t("nav.ctaSharedOwnProfile", locale)}
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const publicLinks = [
    { id: "home", href: "/", label: t("nav.publicHome", locale) },
    { id: "blog", href: "/blog", label: t("nav.blog", locale) },
    { id: "pricing", href: "/pricing", label: t("nav.pricing", locale) },
  ];

  const authLinks = [
    // Bejelentkezve a link az appba (journey handoff) visz — a címke is
    // ezt mondja, ne 'Főoldal'-t (design-akciólista #18).
    { id: "dashboard", href: signedInHomeHref, label: t("nav.dashboard", locale) },
    { id: "blog", href: "/blog", label: t("nav.blog", locale) },
    { id: "pricing", href: "/pricing", label: t("nav.pricing", locale) },
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
      <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-surface-header)]/95 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-[12px]">
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
          <nav className="hidden items-center gap-1 lg:flex">
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
          <div className="flex items-center gap-2">
            {!isSignedIn && (
              <>
                {/* Sign in — desktop only */}
                {/* Másodlagos gomb a bronz CTA mellé. A korábbi „fehér kártya
                    homok kerettel" gyakorlatilag láthatatlan volt: a
                    kártya-felület a fejlécsávon 1,05:1, a homok keret 1,24:1
                    — a gomb beleolvadt a sávba. Zsálya kontúr (5,8:1) + mély
                    zsálya felirat (11,3:1): egyértelműen gomb, és a kitöltött
                    bronz elsődlegessel világos párt alkot. */}
                <Link
                  href="/sign-in"
                  className="hidden rounded-lg border border-[var(--color-action-primary-bg)] bg-transparent px-4 py-[7px] text-caption font-medium text-[var(--color-accent-self-deep)] transition-all hover:bg-[var(--color-surface-self-accent-soft)] lg:inline-flex"
                >
                  {t("nav.signIn", locale)}
                </Link>
                {/* CTA — always visible.
                    Háttér: bronze-dark, NEM a világosabb accent-primary —
                    fehér szöveggel az utóbbi csak 3.28:1 (12–13px normál
                    szöveg → AA-bukó, Lighthouse color-contrast). A
                    bronze-dark 4.89:1, és a bronz-család része (ugyanez a
                    CtaSection hover-színe), így az identitás megmarad. */}
                <Link
                  href={publicCtaHref}
                  className="rounded-lg bg-[var(--color-bronze-dark)] px-4 py-[7px] text-[12px] font-semibold text-[var(--color-text-on-accent-deep)] transition-all hover:brightness-[1.06] lg:px-5 lg:py-2 lg:text-caption"
                >
                  {publicCtaLabel}
                </Link>
              </>
            )}

            {isSignedIn && <UserMenu />}

            {/* Separator + Language — always visible */}
            <div className="hidden h-5 w-px bg-[var(--color-border-default)] lg:block" />
            <LanguageSwitcher />
            {showThemeToggle ? (
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
            ) : null}

            {/* Hamburger — mobile */}
            <button
              type="button"
              onClick={() => {
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
              className="shrink-0 rounded-md border border-[var(--color-border-soft)] bg-surface-card px-3 py-1.5 text-[11px] font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
            >
              {signedInHint.ctaLabel}
            </Link>
          </div>
        </div>
      ) : null}

      {/* ═══ MOBIL MENÜ — közös kártya-panel (menü-konvergencia): ugyanaz a
          váz, mint a belépett NavHeaderUI menüje. ═══ */}
      <MobileMenuShell open={drawerOpen} onClose={() => setDrawerOpen(false)}>
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
                className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-surface-card text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
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
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-surface-card text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)]"
              >
                {t("nav.signIn", locale)}
              </Link>
              <Link
                href={publicCtaHref}
                onClick={() => setDrawerOpen(false)}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-[var(--color-bronze-dark)] text-[14px] font-semibold text-[var(--color-text-on-accent-deep)] transition-all hover:brightness-[1.06]"
              >
                {publicCtaLabel}
              </Link>
            </div>
          ) : null}

          <MobileMenuSectionLabel>
            {locale === "hu" ? "Nyelv" : "Language"}
          </MobileMenuSectionLabel>
          <div className="px-3 pb-1">
            <LanguageSwitcher variant="pills" />
          </div>

          {showThemeToggle ? (
            <>
              <MobileMenuSectionLabel>{t("theme.label", locale)}</MobileMenuSectionLabel>
              <div className="px-3 pb-1">
                <ThemeToggle />
              </div>
            </>
          ) : null}

        </div>
      </MobileMenuShell>

    </>
  );
}
