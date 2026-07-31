import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { HERO_VARIANTS } from "@/components/career/fakedoor/hero-variants";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";

// Hero-variánsok egymás alatt — DÖNTÉSI segédlet, nem termékfelület.
//
// Fejlesztői oldal: éles környezetben nem létezik. Ha megszületett a
// döntés, ez az oldal és a `hero-variants.tsx` törlendő — nem hagyunk öt
// félkész herót a kódban.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hero-variánsok | trita",
  robots: { index: false, follow: false },
};

// Rögzített minta-profil: minden variáns UGYANAZT mutatja, hogy tényleg a
// forma legyen összehasonlítható. (Nyitottság alapforma + Lelkiismeretesség
// motívum — ugyanaz a pár, ami a fejlesztői fiókban is látszik.)
const SAMPLE_GLYPH = {
  primaryCode: "OPEN",
  secondaryCode: "THOR",
  intensity: 4,
  label: "Módszeres újító",
};

export default async function HeroPreviewPage({
  searchParams,
}: {
  // `?v=B` — egyetlen variáns, tiszta képernyőn. Így lehet őket egyesével
  // végignézni (és képernyőképet csinálni róluk) görgetés nélkül.
  searchParams: Promise<{ v?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const [locale, params] = await Promise.all([getServerLocale(), searchParams]);
  const only = params.v?.toUpperCase();
  const variants = only
    ? HERO_VARIANTS.filter((variant) => variant.id === only)
    : HERO_VARIANTS;

  return (
    <PlatformPageShell surface="self" contentClassName="max-w-3xl gap-10 px-4 py-10">
      <header>
        <p className="font-mono text-micro uppercase tracking-widest text-bronze">
          {"// fejlesztői előnézet"}
        </p>
        <h1 className="mt-1 font-fraunces text-2xl text-ink">
          Karrier hero — variánsok
        </h1>
        <p className="mt-2 max-w-prose text-caption leading-relaxed text-ink-body">
          Mindegyik ugyanazt a tartalmat viszi, csak a forma más. Az oldal éles
          környezetben nem létezik.
        </p>
      </header>

      {variants.map(({ id, name, note, Component }) => (
        <section key={id}>
          <div className="mb-3 border-l-2 border-bronze pl-3">
            <p className="font-fraunces text-[19px] text-ink">
              {id} — {name}
            </p>
            <p className="mt-0.5 max-w-prose text-caption text-ink-body">{note}</p>
          </div>
          <Component
            locale={locale}
            glyph={SAMPLE_GLYPH}
            patternLabel="A te mintázatod: Módszeres újító. Ebből indulna."
          />
        </section>
      ))}
    </PlatformPageShell>
  );
}
