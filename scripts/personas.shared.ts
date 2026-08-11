/**
 * personas.shared.ts — a persona-definíciók egyetlen forrása.
 *
 * A seed-personas.ts (DB + Clerk seed) és a generate-persona-reports.ts
 * (PDF-dosszié) egyaránt innen dolgozik, hogy a felhúzott userek és a
 * generált riportok GARANTÁLTAN ugyanazokból a pontszámokból épüljenek.
 */

import { resolvePersonalityTypeFromScores } from "../src/lib/personality-type";
import { TENSION_PAIRS } from "../src/lib/profile-engine";
import { HEXACO_DIMENSION_FACETS, rankDimensionScores } from "../src/lib/hexaco";

export const DIMS = ["H", "E", "X", "A", "C", "O"] as const;
export type DimCode = (typeof DIMS)[number];

// A facet-sorrend a KANONIKUS térképből (tritan.ts HEXACO_DIMENSION_FACETS)
// származik — a korábbi helyi másolat a C facetjeit felcserélt sorrendben
// (prudence↔perfectionism) deklarálta, így a buildFacets index-alapú
// offsetjei más facetre estek, mint az éles felület sorrendje.
// A kiegészítő altruizmus-skála (`I`) 2026-08-11 óta nincs a rövid formában,
// így élő kitöltésből nem áll elő — a personák sem gyártanak rá pontszámot.
// (A persona-PDF altruizmus-blokkja emiatt kimarad, ahogy egy mai valódi
// kitöltésnél is; a generátor `undefined`-re fel van készítve.)
export const HEXACO_FACETS: Record<string, string[]> = Object.fromEntries(
  Object.entries(HEXACO_DIMENSION_FACETS).map(([dim, codes]) => [dim, [...codes]]),
);

export type PersonaKind = "archetype" | "tension";

export type Persona = {
  slug: string;
  label: string;
  email: string;
  dimensions: Record<string, number>;
  kind: PersonaKind;
  /** Csak a tension-personáknál: a célzott feszültség-pár contentKey-e. */
  tensionKey?: string;
};

/**
 * Determinisztikus pontszám-recept az archetípus-personáknak: domináns 86,
 * másodlagos 68 (mindkettő "high" a 65-ös pólus-küszöb felett), a maradék
 * négy dimenzió fix sorrendben 52/48/44/30 — van medium és low sáv is.
 *
 * A rések SZÁNDÉKOSAN ≥ DIFF_MIN_GAP: 86−68=18 és 68−52=16 — a korábbi
 * 86/74 recept 12 pontos top-rése a bizonytalanság-kapun fennakadt, így mind
 * a 30 archetípus-fixture főnév-only címkét kapott (a melléknévi színezet,
 * amit a fixture demonstrálna, sosem jelent meg).
 */
function buildArchetypeDimensions(primary: DimCode, secondary: DimCode): Record<string, number> {
  const rest = DIMS.filter((d) => d !== primary && d !== secondary);
  const restValues = [52, 48, 44, 30];
  const dimensions: Record<string, number> = { [primary]: 86, [secondary]: 68 };
  rest.forEach((dim, i) => {
    dimensions[dim] = restValues[i];
  });
  return dimensions;
}

/** Facetek determinisztikusan a dimenzió-érték körül (±7 sávban). */
export function buildFacets(dimensions: Record<string, number>): Record<string, Record<string, number>> {
  const offsets = [-6, -2, 3, 7];
  const facets: Record<string, Record<string, number>> = {};
  for (const [dim, facetList] of Object.entries(HEXACO_FACETS)) {
    const base = dimensions[dim] ?? 50;
    facets[dim] = {};
    facetList.forEach((facet, i) => {
      facets[dim][facet] = Math.max(0, Math.min(100, base + offsets[i % offsets.length]));
    });
  }
  return facets;
}

// A címke a KAPUZOTT feloldón át (resolvePersonalityTypeFromScores) — a
// korábbi resolvePersonalityTypeLabel-hívás megkerülte a bizonytalanság-
// kaput, így a tension-personák (top-rés 4 pont) teljes „melléknév+főnév"
// címkét kaptak, amit az éles felület sosem adna nekik.
function labelFromDimensions(dimensions: Record<string, number>): string {
  const entries = DIMS.map((d) => ({ code: d, score: dimensions[d] }));
  const ranked = rankDimensionScores(entries);
  return (
    resolvePersonalityTypeFromScores(entries, "hu") ??
    `${ranked[0].code}/${ranked[1].code}`
  );
}

/** 30 archetípus-persona: a top-2 dimenzió rendezett párja (6×5). */
export function buildArchetypePersonas(): Persona[] {
  const personas: Persona[] = [];
  for (const primary of DIMS) {
    for (const secondary of DIMS) {
      if (primary === secondary) continue;
      const slug = `${primary.toLowerCase()}-${secondary.toLowerCase()}`;
      const dimensions = buildArchetypeDimensions(primary, secondary);
      personas.push({
        slug,
        label: labelFromDimensions(dimensions),
        // A +clerk_test forma Clerk dev instance-on teszt-email: nem küld
        // valódi levelet, a 424242 kódot mindig elfogadja.
        email: `persona-${slug}+clerk_test@trita.io`,
        dimensions,
        kind: "archetype",
      });
    }
  }
  return personas;
}

/**
 * 18 tension-persona: minden profile-engine feszültség-párhoz egy user,
 * akinél PONTOSAN a célzott pár aktív. Recept: a pár két dimenziója
 * high=82/78 ill. low=24/28, minden más dimenzió medium (55/52/48/45) —
 * medium dimenzió párfeltételt nem teljesít, így más pár nem aktiválódhat.
 */
export function buildTensionPersonas(): Persona[] {
  return TENSION_PAIRS.map((def) => {
    const slug = `pair-${def.contentKey.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}`;
    const dimensions: Record<string, number> = {
      [def.dimA]: def.levelA === "high" ? 82 : 24,
      [def.dimB]: def.levelB === "high" ? 78 : 28,
    };
    const rest = DIMS.filter((d) => d !== def.dimA && d !== def.dimB);
    const restValues = [55, 52, 48, 45];
    rest.forEach((dim, i) => {
      dimensions[dim] = restValues[i];
    });
    return {
      slug,
      label: labelFromDimensions(dimensions),
      email: `persona-${slug}+clerk_test@trita.io`,
      dimensions,
      kind: "tension" as const,
      tensionKey: def.contentKey,
    };
  });
}

/** Mind a 48 persona (30 archetípus + 18 feszültség-pár). */
export function buildAllPersonas(): Persona[] {
  return [...buildArchetypePersonas(), ...buildTensionPersonas()];
}
