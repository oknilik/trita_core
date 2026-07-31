"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "@/components/auth/auth-state";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

export function Footer() {
  const { locale } = useLocale();
  const currentPath = usePathname();
  const { isSignedIn } = useAuthState();

  // Hide footer on assessment/try pages
  if (currentPath.startsWith("/try") || currentPath.startsWith("/assessment")) return null;

  // Mérőoldalon (fake door) minimál lábléc: a hét linkes teljes footer hét
  // kiszökési út — a mérés alatt ez rontja a válaszadási arányt, tehát az
  // adatot rontja. Jogi linkek + copyright marad.
  if (currentPath.startsWith("/career")) {
    return (
      <footer className="border-t border-sand bg-cream px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-caption text-ink-warm md:flex-row md:justify-between">
          <span>© {new Date().getFullYear()} trita</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">
              {t("footer.privacy", locale)}
            </Link>
            <Link href="/contact" className="hover:text-ink">
              {t("footer.contact", locale)}
            </Link>
          </span>
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
      heading: t("footer.colProduct", locale),
      links: [
        { label: t("footer.blog", locale), href: "/blog" },
        { label: t("footer.pricing", locale), href: "/pricing" },
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
    <footer className="relative -mt-10 w-full md:-mt-14">
      {/* pointer-events-none: a hullám a megelőző oldal fölé húzódik (-mt),
          az átlátszó zónája nem foghatja el az alatta lévő gombok kattintását. */}
      <svg
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none block h-10 w-full md:h-14"
      >
        <path
          d="M0,26 C240,10 480,34 720,22 C960,10 1120,30 1280,18 C1360,12 1410,20 1440,16 L1440,56 L0,56 Z"
          fill="#1a1a2e"
        />
      </svg>

      <div className="w-full bg-gradient-to-b from-ink to-ink-body pt-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-14">
      <div className="mx-auto w-full max-w-[1120px] px-7">
        <div className="grid grid-cols-2 gap-10 pt-4 sm:grid-cols-4 md:pt-8">

          {/* Logo + tagline */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              aria-label="trita"
              className="font-fraunces inline-flex items-baseline text-xl font-black tracking-[-0.03em] text-cream"
            >
              <span style={{ color: "var(--color-accent-self)" }}>t</span>{"rit"}
              <span style={{ color: "var(--color-accent-primary)" }}>a</span>
            </Link>
            <p className="mt-2 max-w-[180px] text-caption leading-relaxed text-cream/70">
              {t("footer.tagline", locale)}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="mb-3 font-dm-sans text-micro font-semibold uppercase tracking-widest text-cream/55">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-caption text-cream/75 underline-offset-4 transition-colors hover:text-bronze hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        <div className="mt-10 border-t border-cream/10 pt-5">
          <p className="text-[12px] text-cream/70">{t("footer.copyright", locale)}</p>
        </div>
      </div>
      </div>
    </footer>
  );
}
