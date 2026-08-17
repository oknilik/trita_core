"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "@/components/auth/auth-state";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";
import { TritaWordmark } from "@/components/TritaLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Footer() {
  const { locale } = useLocale();
  const currentPath = usePathname();
  const { isSignedIn } = useAuthState();

  // Hide footer on assessment/try pages
  if (currentPath.startsWith("/try") || currentPath.startsWith("/assessment")) return null;

  const accountLinks = isSignedIn
    ? [
        { label: t("nav.profile", locale), href: "/profile/results" },
        { label: t("profile.sectionAbout", locale), href: "/profile" },
      ]
    : [
        { label: t("footer.signIn", locale), href: "/sign-in" },
        { label: t("footer.signUp", locale), href: "/sign-up" },
      ];

  const columns = [
    {
      heading: t("footer.colProduct", locale),
      links: [
        { label: t("footer.about", locale), href: "/about" },
        { label: t("footer.aboutUs", locale), href: "/rolunk" },
        ...(isPortfolioSurfaceActive("blog")
          ? [{ label: t("footer.blog", locale), href: "/blog" }]
          : []),
        { label: t("footer.pricing", locale), href: "/pricing" },
        ...(isPortfolioSurfaceActive("patternExplorer")
          ? [{ label: t("footer.patterns", locale), href: "/patterns" }]
          : []),
        { label: t("footer.pilot", locale), href: "/pilot" },
      ],
    },
    {
      heading: t("footer.colAccount", locale),
      links: accountLinks,
    },
    {
      heading: t("footer.colLegal", locale),
      links: [
        { label: t("footer.privacy", locale), href: "/privacy" },
        { label: t("footer.contact", locale), href: "/contact" },
      ],
    },
  ];

  return (
    // ── Hullám-él: FIX magasságú SVG (nem arányos clip-path!) ────────────
    // A korábbi objectBoundingBox-os kivágás a footer MAGASSÁGÁVAL skálázott:
    // mobilon (magas footer) a hullám-zóna nagyobb lett, mint az átfedés, és
    // a különbözet body-krém sávként látszott az oldal háttere és a hullám
    // között. Most a hullám fix px-magasságú SVG, a footer pontosan ennyivel
    // (-mt) húzódik az oldal saját háttere fölé — a hullám fölött MINDIG az
    // oldal valódi háttere van, minden viewporton. A varrat-mentességhez a
    // footer-háttér FÜGGŐLEGES gradiens (to-b): így az SVG tömör ink-kitöltése
    // pixelre egyezik a törzs tetejével.
    // pointer-events-none a KONTÉNEREN is, nem csak az SVG-n: a hullám a
    // megelőző oldal fölé húzódik (-mt), és az elem-szintű hit-test a
    // pointer-events-none SVG alatt magát a <footer>-t találta el — az
    // átfedett sávban az oldal gombjai (pl. az observer-kitöltő „Tovább"
    // gombja) nem kaptak kattintást. A tényleges footer-tartalom a lenti
    // dividen pointer-events-auto-val újra kattintható.
    <footer className="pointer-events-none relative -mt-10 w-full md:-mt-14">
      <svg
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none block h-10 w-full md:h-14"
      >
        {/* A kitöltés UGYANAZ a token, mint a törzs gradiensének `from-`
            stopja — így a varrat nem tud elcsúszni. Korábban `--color-ink`
            volt: az SZÖVEG-token, tehát sötét sémán VILÁGOSSÁ fordul, és a
            hullám krém sávként világított az oldal és a footer között
            (2026-08-07). */}
        <path
          d="M0,26 C240,10 480,34 720,22 C960,10 1120,30 1280,18 C1360,12 1410,20 1440,16 L1440,56 L0,56 Z"
          fill="var(--color-surface-inverse)"
        />
      </svg>

      <div className="pointer-events-auto w-full bg-gradient-to-b from-[var(--color-surface-inverse)] to-[var(--color-surface-inverse-soft)] pt-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-14">
      <div className="mx-auto w-full max-w-[1120px] px-7">
        <div className="grid grid-cols-2 gap-10 pt-4 sm:grid-cols-4 md:pt-8">

          {/* Logo + tagline */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              aria-label="trita"
              className="inline-flex text-[var(--color-text-on-inverse)]"
            >
              <TritaWordmark className="text-xl" />
            </Link>
            <p className="mt-2 max-w-[180px] text-caption leading-relaxed text-[var(--color-text-on-inverse-muted)]">
              {t("footer.tagline", locale)}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="mb-3 font-dm-sans text-micro font-semibold uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-caption text-[var(--color-text-on-inverse-muted)] underline-offset-4 transition-colors hover:text-[var(--color-accent-primary-strong)] hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[var(--color-text-on-inverse)]/10 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[12px] text-[var(--color-text-on-inverse-muted)]">{t("footer.copyright", locale)}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            <LanguageSwitcher variant="footer" />
            <ThemeToggle variant="footer" />
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}
