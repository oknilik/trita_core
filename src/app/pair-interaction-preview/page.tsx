import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerLocale } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";
import { buildPairSimulation } from "@/lib/interaction-view";
import { resolvePersonalityTypeFromScores } from "@/lib/personality-type";
import { resolveGlyphPair } from "@/lib/type-glyph";
import { facetStandardError } from "@/lib/psychometrics";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { PairInteractionView } from "@/components/results/PairInteractionView";
import type { DimScores, FacetScores } from "@/lib/interaction-engine";

// ─────────────────────────────────────────────────────────────────────
// Fejlesztői előnézet a VALÓS PÁROS nézethez (/interaction?pair=…).
//
// Miért kell: az éles pár-felület három feltételt kíván EGYSZERRE — két
// olyan felhasználót, akiknek van kész önértékelése, ÉS egy elfogadott,
// kölcsönös összehasonlítás-meghívót közöttük. Emiatt a nézet fejlesztés
// közben gyakorlatilag láthatatlan, és a rá épülő rétegeket (rés-alapú
// sorok, hat dimenziós sáv, facet-attribúció) csak teszten át lehetett
// megnézni.
//
// Ez az oldal NEM koholt szöveget renderel: a VALÓDI motort futtatja
// (`buildPairSimulation`) két fixture-profilon, tehát amit itt látsz,
// pontosan az, amit az éles felület adna ugyanezekre a pontszámokra.
//
// A `results-experience-preview` mintáját követi: csak fejlesztésben él,
// élesben 404. Az útvonal nem indexelhető.
//
// AZ ÚTVONAL NEVE SZÁMÍT: `/interaction-pair-preview` beleesett volna a
// `proxy.ts` védett `/interaction(.*)` mintájába, és bejelentkezést kért
// volna — ezért kezdődik `pair-`-rel.
// ─────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Páros nézet UX-előnézet | trita",
  robots: { index: false, follow: false },
};

// A fixture SZÁNDÉKOSAN úgy van hangolva, hogy mind a négy réteg megszólaljon:
//   · rés-alapú sorok (egyik fél sem pólusos, mégis mérhető a különbség),
//   · hat dimenziós sáv öt eltéréssel és egy egyezéssel,
//   · attribúció: a C-eltérést egyedül a Szervezettség viszi (a többi
//     alskála különbsége a mérési hibán belül marad),
//   · nüansz: az A dimenzión egyeztek, de a Megbocsátás alskála elválik.
const SELF_DIMS: DimScores = { H: 72, E: 38, X: 61, A: 56, C: 70, O: 44 };
const OTHER_DIMS: DimScores = { H: 55, E: 57, X: 40, A: 53, C: 58, O: 63 };

const SELF_FACETS: FacetScores = {
  H: { sincerity: 74, fairness: 76, greed_avoidance: 70, modesty: 68 },
  E: { fearfulness: 36, anxiety: 40, dependence: 38, sentimentality: 38 },
  X: { social_self_esteem: 64, social_boldness: 60, sociability: 62, liveliness: 58 },
  A: { forgiveness: 78, gentleness: 50, flexibility: 50, patience: 46 },
  C: { organization: 92, diligence: 60, perfectionism: 64, prudence: 64 },
  O: { aesthetic_appreciation: 42, inquisitiveness: 46, creativity: 44, unconventionality: 44 },
};

const OTHER_FACETS: FacetScores = {
  H: { sincerity: 56, fairness: 54, greed_avoidance: 55, modesty: 55 },
  E: { fearfulness: 58, anxiety: 56, dependence: 57, sentimentality: 57 },
  X: { social_self_esteem: 42, social_boldness: 38, sociability: 40, liveliness: 40 },
  A: { forgiveness: 38, gentleness: 58, flexibility: 60, patience: 56 },
  C: { organization: 52, diligence: 60, perfectionism: 60, prudence: 60 },
  O: { aesthetic_appreciation: 62, inquisitiveness: 64, creativity: 63, unconventionality: 63 },
};

function glyphFor(dims: DimScores, locale: Locale) {
  const scored = Object.entries(dims).map(([code, score]) => ({ code, score }));
  const glyph = resolveGlyphPair(scored);
  const label = resolvePersonalityTypeFromScores(scored, locale);
  return glyph && label ? { ...glyph, label } : null;
}

/**
 * Hol él az oldal: helyi fejlesztésben ÉS a Vercel preview-deployokon —
 * élesben 404.
 *
 * A `NODE_ENV !== "development"` önmagában NEM elég: a Vercel preview-build
 * is `production` NODE_ENV-vel fut, tehát a branch-preview-n is 404-et adna,
 * pedig épp ott kellene megnézni. A `VERCEL_ENV` az, ami a preview-t
 * megkülönbözteti az élestől.
 */
function isPreviewSurfaceEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview"
  );
}

export default async function InteractionPairPreviewPage() {
  if (!isPreviewSurfaceEnabled()) notFound();

  const locale = await getServerLocale();
  const lang = (locale === "en" ? "en" : "hu") as Locale;

  const self = glyphFor(SELF_DIMS, lang);
  const other = glyphFor(OTHER_DIMS, lang);
  if (!self || !other) notFound();

  // Ugyanaz a küszöb-számítás, mint az éles oldalon: a fixture rövid formájú.
  const facetMinGap = Math.round(Math.SQRT2 * facetStandardError("short"));

  const sim = buildPairSimulation(SELF_DIMS, OTHER_DIMS, lang, {
    selfFacets: SELF_FACETS,
    otherFacets: OTHER_FACETS,
    facetMinGap,
  });

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-4xl gap-8 px-4 py-10 md:gap-10"
    >
      <header>
        <p className="text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
          Fejlesztői előnézet – fixture-profilok, valódi motor
        </p>
        <h1 className="mt-1 font-fraunces text-title text-[var(--color-text-primary)]">
          Páros nézet
        </h1>
      </header>

      <PairInteractionView
        self={self}
        other={other}
        otherName="Anna"
        sim={sim}
      />
    </PlatformPageShell>
  );
}
