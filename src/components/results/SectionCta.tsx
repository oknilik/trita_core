"use client";

import Link from "next/link";

// Szekció-átvezető CTA — az eredmény-oldal aljáról visz a kiemelt modulokra
// (karrier-iránytű, munkastílus).
//
// Miért van rá szükség: ezek a modulok 2026-07-31 óta önálló oldalak. Ha csak
// a fejléc-menüből lennének elérhetők, a riportot végigolvasó felhasználó
// pont a leglogikusabb pillanatban — a végén — nem találná meg őket.
//
// Vizuális elv: a kártya hangsúlyos, de nem kiabál; a design-nyelvhez igazodik
// (token-színek, Fraunces cím, dekoratív emoji nélkül).

interface SectionCtaProps {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  /** Halvány sorszám/jel a kártya jobb szélén — vizuális horgony. */
  glyph?: string;
}

export function SectionCta({ eyebrow, title, body, cta, href, glyph }: SectionCtaProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border-[1.5px] border-[var(--color-border-soft)] bg-gradient-to-br from-[var(--color-surface-self-accent-soft)] via-white to-[var(--color-surface-subtle)] p-6 transition hover:border-[var(--color-action-primary-bg)]/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:p-7"
    >
      {glyph && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-6 select-none font-fraunces text-[110px] leading-none text-[var(--color-action-primary-bg)]/[0.07]"
        >
          {glyph}
        </span>
      )}

      <p className="text-micro font-semibold uppercase tracking-widest text-[var(--color-accent-self-deep)]">
        {eyebrow}
      </p>
      <p className="mt-2 max-w-xl font-fraunces text-[20px] leading-snug text-[var(--color-text-primary)] md:text-[24px]">
        {title}
      </p>
      <p className="mt-2 max-w-prose text-caption leading-relaxed text-[var(--color-text-secondary)]">
        {body}
      </p>
      <span className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-sage px-5 text-sm font-semibold text-white transition group-hover:bg-sage-dark">
        {cta}
      </span>
    </Link>
  );
}
