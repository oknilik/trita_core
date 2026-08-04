"use client";

import Link from "next/link";

// Szekció-átvezető CTA — az eredmény-oldal aljáról visz a kiemelt modulokra
// (karrier-iránytű, interakció-szimuláció).
//
// Miért van rá szükség: ezek a modulok 2026-07-31 óta önálló oldalak. Ha csak
// a fejléc-menüből lennének elérhetők, a riportot végigolvasó felhasználó
// pont a leglogikusabb pillanatban — a végén — nem találná meg őket.
//
// Vizuális elv: a kártya HORDOZZA, mit fog mutatni az oldal. A motívum nem
// dísz, hanem előkép: az iránytűnél tájoló, a dinamikánál két összeérő kör.
// Dekoratív emojit nem használunk, a rajz token-színekből épül.

export type SectionCtaMotif = "compass" | "pair";

interface SectionCtaProps {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  motif: SectionCtaMotif;
}

export function SectionCta({ eyebrow, title, body, cta, href, motif }: SectionCtaProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border-[1.5px] border-[var(--color-border-soft)] bg-[var(--color-text-primary)] p-6 transition duration-300 hover:border-[var(--color-action-primary-bg)]/50 hover:shadow-[0_10px_30px_rgba(0,0,0,0.14)] md:p-8"
    >
      {/* Motívum: a kártya jobb oldalán, a szövegtől elhúzva. Mobilon
          halványabb, hogy a szöveg maradjon az elsődleges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 opacity-[0.13] transition-transform duration-500 group-hover:scale-105 md:-right-2 md:opacity-20"
      >
        {motif === "compass" ? <CompassMotif /> : <PairMotif />}
      </div>

      <div className="relative max-w-xl">
        <p className="text-micro font-semibold uppercase tracking-widest text-[var(--color-accent-primary-soft)]">
          {eyebrow}
        </p>
        <p className="mt-2 font-fraunces text-[22px] leading-snug text-white md:text-[27px]">
          {title}
        </p>
        <p className="mt-2.5 text-caption leading-relaxed text-white/[0.62]">{body}</p>
        <span className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-action-primary-bg)] px-5 text-sm font-semibold text-[var(--color-action-primary-fg)] transition group-hover:bg-[var(--color-action-primary-bg-hover)]">
          {cta}
          <span
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

/** Tájoló: koncentrikus körök + irányt mutató tű — a karrier-iránytű előképe. */
function CompassMotif() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-[190px] w-[190px] md:h-[230px] md:w-[230px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      style={{ color: "var(--color-accent-primary-soft)" }}
    >
      <circle cx="100" cy="100" r="86" />
      <circle cx="100" cy="100" r="62" strokeDasharray="3 7" />
      <circle cx="100" cy="100" r="34" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="100"
          y1="14"
          x2="100"
          y2="26"
          transform={`rotate(${deg} 100 100)`}
        />
      ))}
      <path d="M100 46 L118 118 L100 106 L82 118 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Két összeérő kör: a metszet a közös működés — a dinamika-oldal előképe. */
function PairMotif() {
  return (
    <svg
      viewBox="0 0 240 200"
      className="h-[190px] w-[220px] md:h-[230px] md:w-[265px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      style={{ color: "var(--color-accent-primary-soft)" }}
    >
      <circle cx="88" cy="100" r="66" />
      <circle cx="152" cy="100" r="66" />
      <circle cx="88" cy="100" r="42" strokeDasharray="3 7" />
      <circle cx="152" cy="100" r="42" strokeDasharray="3 7" />
      {/* A metszet kiemelve — ez az, amiről az oldal szól. */}
      <path
        d="M120 46 A66 66 0 0 1 120 154 A66 66 0 0 1 120 46 Z"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="none"
      />
    </svg>
  );
}
