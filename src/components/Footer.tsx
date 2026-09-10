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
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

export function Footer({ variant = "marketing" }: { variant?: "marketing" | "app" }) {
  const { locale } = useLocale();
  const currentPath = usePathname();
  const { isSignedIn } = useAuthState();

  // Hide the global footer in focused assessment flows.
  if (
    currentPath.startsWith("/try") ||
    currentPath.startsWith("/assessment") ||
    currentPath.startsWith("/observe")
  ) return null;

  if (variant === "app") {
    const links = [
      { label: t("nav.profile", locale), href: "/profile/results" },
      { label: t("profile.sectionAbout", locale), href: "/profile" },
      { label: t("footer.contact", locale), href: "/contact" },
      { label: t("footer.legalDocuments", locale), href: "/legal" },
      { label: t("footer.privacy", locale), href: "/privacy" },
    ];
    return (
      <footer data-app-footer className="mt-10 border-t border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] px-5 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3">
          <Link href="/dashboard" aria-label="trita" className="inline-flex min-h-11 items-center text-ink"><TritaWordmark className="text-heading" /></Link>
          <nav aria-label={t("footer.appNavigation", locale)} className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {links.map((link) => <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center text-caption text-[var(--color-text-secondary)] underline-offset-4 hover:underline">{link.label}</Link>)}
          </nav>
          <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto"><LanguageSwitcher variant="pills" /><ThemeToggle variant="compact" popoverSide="top" className="ml-auto" /></div>
          <p className="w-full text-note text-[var(--color-text-muted)]">{t("footer.copyright", locale)}</p>
        </div>
      </footer>
    );
  }

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
      heading: t("footer.colExplore", locale),
      links: [
        { label: t("footer.home", locale), href: "/" },
        { label: t("footer.teams", locale), href: "/team-dynamics" },
        ...(isPortfolioSurfaceActive("blog")
          ? [{ label: t("footer.blog", locale), href: "/blog" }]
          : []),
        { label: t("footer.pricing", locale), href: "/pricing" },
      ],
    },
    {
      heading: t("footer.colAbout", locale),
      links: [
        { label: t("footer.about", locale), href: "/about" },
        { label: t("footer.pilot", locale), href: "/pilot" },
        ...(isPortfolioSurfaceActive("patternExplorer")
          ? [{ label: t("footer.patterns", locale), href: "/patterns" }]
          : []),
        // A Kapcsolat a cégről szóló oszlopban (2026-09-08): korábban a
        // Jogi oszlop alján bújt meg, ahol senki nem keresi.
        { label: t("footer.contact", locale), href: "/contact" },
      ],
    },
    {
      heading: t("footer.colAccount", locale),
      links: accountLinks,
    },
    {
      heading: t("footer.colLegal", locale),
      links: [
        { label: t("footer.legalDocuments", locale), href: "/legal" },
        { label: t("footer.privacy", locale), href: "/privacy" },
      ],
    },
  ];

  return (
    // A footer saját, route-független védősávot kap. Korábban -mt-10/-mt-14
    // negatív margóval az oldal fölé húztuk a hullámot, ezért minden egyes
    // route-nak külön legalább 56 px alsó paddinget kellett biztosítania.
    // Amelyik oldal ezt elmulasztotta (pl. a korábbi /how-we-work), annak az utolsó
    // kártyájába belecsúszott a footer. A hullám most normál dokumentum-
    // folyamban él, előtte pedig a közös vászonból képzett fix védősáv van:
    // így sem viewport-, sem oldaltartalom-függő átfedés nem lehetséges.
    <footer
      data-site-footer
      className="relative w-full bg-[var(--color-surface-canvas)] pt-8 md:pt-10"
    >
      <svg
        data-footer-wave
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

      {/* Az 1 px-es átfedés ugyanazzal a kezdőszínnel fedi az SVG és a
          gradiens közti szubpixel-varratot. Ez akadályozza meg a korábban
          egyes zoomszinteken/sémákban felvillanó világos hajszálvonalat. */}
      <div
        data-footer-surface
        className="relative -mt-px w-full bg-gradient-to-b from-[var(--color-surface-inverse)] to-[var(--color-surface-inverse-soft)] pt-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-14"
      >
      <div className="mx-auto w-full max-w-[1120px] px-7">
        <div className="grid grid-cols-2 gap-10 pt-4 sm:grid-cols-3 md:pt-8 lg:grid-cols-5">

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

        {/* Feliratkozás — halkan, a link-oszlopok alatt, de NEM ott, ahol az
            oldal már kínál saját űrlapot: a /blog lista és a cikkoldalak végén
            dedikált feliratkozó-panel van, a /newsletter oldalak pedig maguk a
            feliratkozás-visszajelzők — ott a második doboz csak duplikáció.
            Az `onInverse` azért kötelező, mert a lábléc MINDKÉT színsémán
            sötét. */}
        {isPortfolioSurfaceActive("blog") &&
        !currentPath.startsWith("/newsletter") &&
        !currentPath.startsWith("/blog") ? (
          <div className="mt-10 border-t border-[var(--color-text-on-inverse)]/10 pt-6">
            <NewsletterForm source="footer" variant="inline" onInverse className="max-w-[420px]" />
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-4 border-t border-[var(--color-text-on-inverse)]/10 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs text-[var(--color-text-on-inverse-muted)]">{t("footer.copyright", locale)}</p>
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
