"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

export function Footer() {
  const { locale } = useLocale();
  const currentPath = usePathname();
  const { isSignedIn } = useAuth();

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
        { label: t("footer.blog", locale), href: "/blog" },
        { label: t("footer.pricing", locale), href: "/pricing" },
        { label: t("footer.founding", locale), href: "/founding" },
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
    <footer
      className="relative -mt-16 w-full bg-gradient-to-br from-ink via-[#2a2722] to-ink-body pt-20 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-14"
      style={{ clipPath: "url(#footer-wave)" }}
    >
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <clipPath id="footer-wave" clipPathUnits="objectBoundingBox">
            <path d="M0,0.1 C0.25,0.04 0.5,0.12 0.75,0.06 C0.9,0.03 0.97,0.08 1,0.06 L1,1 L0,1 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="mx-auto w-full max-w-[1120px] px-7">
        <div className="grid grid-cols-2 gap-10 pt-4 sm:grid-cols-4 md:pt-8">

          {/* Logo + tagline */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              aria-label="trita"
              className="font-fraunces inline-flex items-baseline text-xl font-black tracking-[-0.03em] text-cream"
            >
              <span style={{ color: "#5a8f7f" }}>t</span>{"rit"}
              <span style={{ color: "#c17f4a" }}>a</span>
            </Link>
            <p className="mt-2 max-w-[180px] text-[13px] leading-relaxed text-cream/70">
              {t("footer.tagline", locale)}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="mb-3 font-dm-sans text-[10px] font-semibold uppercase tracking-widest text-cream/30">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-cream/60 underline-offset-4 transition-colors hover:text-bronze hover:underline"
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
          <p className="text-[12px] text-cream/60">{t("footer.copyright", locale)}</p>
        </div>
      </div>
    </footer>
  );
}
