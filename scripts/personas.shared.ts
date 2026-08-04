/**
 * personas.shared.ts — a persona-definíciók egyetlen forrása.
 *
 * A seed-personas.ts (DB + Clerk seed) és a generate-persona-reports.ts
 * (PDF-dosszié) egyaránt innen dolgozik, hogy a felhúzott userek és a
 * generált riportok GARANTÁLTAN ugyanazokból a pontszámokból épüljenek.
 */

import { resolvePersonalityTypeLabel } from "../src/lib/personality-type";
import { TENSION_PAIRS } from "../src/lib/profile-engine";

export const DIMS = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"] as const;
export type DimCode = (typeof DIMS)[number];

export const TRITAN_FACETS: Record<string, string[]> = {
  INTE: ["sincerity", "fairness", "greed_avoidance", "modesty"],
  RESO: ["fearfulness", "anxiety", "dependence", "sentimentality"],
  TEMP: ["social_self_esteem", "social_boldness", "sociability", "liveliness"],
  ADAP: ["forgiveness", "gentleness", "flexibility", "patience"],
  THOR: ["organization", "diligence", "prudence", "perfectionism"],
  OPEN: ["aesthetic_appreciation", "inquisitiveness", "creativity", "unconventionality"],
  I: ["altruism"],
};

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
 * másodlagos 74 (mindkettő "high"), a maradék négy dimenzió fix sorrendben
 * 55/50/45/30 — így van medium és low sáv is, és a top-2 sorrend egyértelmű.
 */
function buildArchetypeDimensions(primary: DimCode, secondary: DimCode): Record<string, number> {
  const rest = DIMS.filter((d) => d !== primary && d !== secondary);
  const restValues = [55, 50, 45, 30];
  const dimensions: Record<string, number> = { [primary]: 86, [secondary]: 74 };
  rest.forEach((dim, i) => {
    dimensions[dim] = restValues[i];
  });
  dimensions.I = 50;
  return dimensions;
}

/** Facetek determinisztikusan a dimenzió-érték körül (±7 sávban). */
export function buildFacets(dimensions: Record<string, number>): Record<string, Record<string, number>> {
  const offsets = [-6, -2, 3, 7];
  const facets: Record<string, Record<string, number>> = {};
  for (const [dim, facetList] of Object.entries(TRITAN_FACETS)) {
    const base = dimensions[dim] ?? 50;
    facets[dim] = {};
    facetList.forEach((facet, i) => {
      facets[dim][facet] = Math.max(0, Math.min(100, base + offsets[i % offsets.length]));
    });
  }
  return facets;
}

function labelFromDimensions(dimensions: Record<string, number>): string {
  const sorted = DIMS.map((d) => ({ code: d, score: dimensions[d] })).sort((a, b) => b.score - a.score);
  return (
    resolvePersonalityTypeLabel(sorted[0].code, sorted[1].code, "hu") ??
    `${sorted[0].code}/${sorted[1].code}`
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
    dimensions.I = 50;
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
