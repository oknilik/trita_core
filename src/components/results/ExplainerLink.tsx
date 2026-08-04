"use client";

import Link from "next/link";

// Magyarázó-link: kilépő az értelmező oldalra (pl. Holland-kód), amikor a
// felhasználó szembejön egy fogalommal, amit nem feltétlenül ismer.
//
// Miért külön komponens: a korábbi megoldás egy aláhúzott szó volt egy
// szövegdoboz közepén — észre sem lehetett venni. Ez a sáv látható, de nem
// tolakodó: nem CTA-gomb (nem oda akarjuk terelni a felhasználót), hanem
// felkínált mellékút.
//
// Új lapon nyílik: a karrier-folyamat félbehagyása drága, a wizard állapota
// pedig a kliensben él.

interface ExplainerLinkProps {
  /** Amit a felhasználó épp lát, és magyarázatra szorulhat. */
  label: string;
  /** Mit kap, ha rákattint. */
  hint: string;
  href: string;
  className?: string;
}

export function ExplainerLink({ label, hint, href, className }: ExplainerLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener"
      className={`group flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border-soft)] bg-white px-4 py-3 transition hover:border-[var(--color-action-primary-bg)]/40 hover:bg-[var(--color-surface-self-accent-soft)] ${className ?? ""}`}
    >
      <span className="min-w-0">
        <span className="block text-caption font-semibold text-[var(--color-text-primary)]">
          {label}
        </span>
        <span className="mt-0.5 block text-micro text-[var(--color-text-muted)]">{hint}</span>
      </span>
      <span
        aria-hidden
        className="shrink-0 text-[var(--color-action-primary-bg)] transition-transform duration-200 group-hover:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}
