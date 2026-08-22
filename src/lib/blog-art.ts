import { hashString } from "@/lib/miro-primitives";

/**
 * A blog-vizuál két független tengelye.
 *
 *  - family: HOGYAN rajzolunk (kézírás / kompozíciós rendszer)
 *  - concept: MIRŐL szól a jelenet (szerkesztői jelentés, nem mérési adat)
 *
 * A kettő szétválasztása ad változatosságot anélkül, hogy négy egymástól
 * független arculatot építenénk. Egy "tension" jelenet például lehet
 * konstelláció vagy élő vonal, miközben mindkettő ugyanazt a Trita-palettát
 * és kísérőjeleket használja.
 */
export const BLOG_ART_FAMILIES = ["constellation", "modular", "flow"] as const;
export type BlogArtFamily = (typeof BLOG_ART_FAMILIES)[number];

export const BLOG_ART_CONCEPTS = [
  "connection",
  "balance",
  "tension",
  "threshold",
  "signal",
  "growth",
] as const;
export type BlogArtConcept = (typeof BLOG_ART_CONCEPTS)[number];

export function isBlogArtFamily(value: unknown): value is BlogArtFamily {
  return typeof value === "string" && BLOG_ART_FAMILIES.includes(value as BlogArtFamily);
}

export function isBlogArtConcept(value: unknown): value is BlogArtConcept {
  return typeof value === "string" && BLOG_ART_CONCEPTS.includes(value as BlogArtConcept);
}

export const BLOG_ART_FAMILY_LABELS_HU: Record<BlogArtFamily, string> = {
  constellation: "Konstelláció",
  modular: "Lágy Bauhaus",
  flow: "Élő vonal",
};

export const BLOG_ART_CONCEPT_LABELS_HU: Record<BlogArtConcept, string> = {
  connection: "Kapcsolódás",
  balance: "Egyensúly",
  tension: "Feszültség",
  threshold: "Átjáró / változás",
  signal: "Jel / mintázat",
  growth: "Növekedés",
};

export type LegacyBlogArtMotif = "radar" | "network" | "bars" | "waves";

export function isLegacyBlogArtMotif(value: unknown): value is LegacyBlogArtMotif {
  return typeof value === "string" && ["radar", "network", "bars", "waves"].includes(value);
}

const LEGACY_SELECTION: Record<
  LegacyBlogArtMotif,
  { family: BlogArtFamily; concept: BlogArtConcept }
> = {
  radar: { family: "modular", concept: "signal" },
  network: { family: "constellation", concept: "connection" },
  bars: { family: "modular", concept: "growth" },
  waves: { family: "flow", concept: "tension" },
};

export interface BlogArtSource {
  slug: string;
  title?: string;
  tags?: string[];
  seed?: number;
  family?: BlogArtFamily;
  concept?: BlogArtConcept;
  /** Régi frontmatter támogatása. Új választásnál már nem írjuk ki. */
  motif?: LegacyBlogArtMotif;
}

export interface ResolvedBlogArt {
  family: BlogArtFamily;
  concept: BlogArtConcept;
  seed: number;
  /** Igaz, ha explicit régi motívumot kell bitre az előző módon rajzolni. */
  legacyMotif?: LegacyBlogArtMotif;
}

function searchable(source: Pick<BlogArtSource, "slug" | "title" | "tags">): string {
  return [source.slug, source.title ?? "", ...(source.tags ?? [])]
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Szerkesztői fogalom becslése cím + tag + slug alapján. Ez NEM pszichológiai
 * állítás, csak a cikkillusztráció kompozíciós témája; az admin bármikor
 * felülbírálhatja.
 */
export function inferBlogArtConcept(
  source: Pick<BlogArtSource, "slug" | "title" | "tags">,
): BlogArtConcept {
  const text = searchable(source);

  if (/pszichometri|psychometr|meres|merhet|measure|assessment|tritan|mbti|profil|profile|adat|data/.test(text)) {
    return "signal";
  }
  if (/csapatdinam|team dynamics|bizalom|trust|kapcsol|connect|egyuttmuk|collabor|team role|csapatszerep/.test(text)) {
    return "connection";
  }
  if (/hazud|lies|fluktu|turnover|konflikt|conflict|kockazat|risk|tor(es|ik)|gap/.test(text)) {
    return "tension";
  }
  if (/bevezetes|introduc|valtoz|change|rollout|atmenet|transition|implement|adopt/.test(text)) {
    return "threshold";
  }
  if (/mobilit|mobility|megtart|retention|fejlod|develop|karrier|career|novek|growth/.test(text)) {
    return "growth";
  }
  if (/biztonsag|safety|vezetes|leadership|stabil|egyensuly|balance/.test(text)) {
    return "balance";
  }

  return BLOG_ART_CONCEPTS[hashString(`${source.slug}:concept`) % BLOG_ART_CONCEPTS.length];
}

export function inferBlogArtFamily(slug: string): BlogArtFamily {
  return BLOG_ART_FAMILIES[hashString(`${slug}:family`) % BLOG_ART_FAMILIES.length];
}

export function resolveBlogArt(source: BlogArtSource): ResolvedBlogArt {
  // Az explicit új mezők mindig elsőbbséget élveznek. Ha CSAK régi artMotif
  // van, a komponens a legacy rajzolót használja, így egy korábban kézzel
  // kiválasztott cikk képe nem változik meg egy deploytól.
  const legacy = source.motif && !source.family && !source.concept
    ? LEGACY_SELECTION[source.motif]
    : undefined;

  const family = source.family ?? legacy?.family ?? inferBlogArtFamily(source.slug);
  const concept = source.concept ?? legacy?.concept ?? inferBlogArtConcept(source);
  const seed = Number.isInteger(source.seed) && Number(source.seed) > 0
    ? Math.min(9999, Number(source.seed))
    : 1 + (hashString(`${source.slug}:blog-art-v2`) % 9999);

  return {
    family,
    concept,
    seed,
    ...(legacy && source.motif ? { legacyMotif: source.motif } : {}),
  };
}

export interface BlogArtCandidate {
  family: BlogArtFamily;
  seed: number;
}

/** Hat stabil előnézet: családonként kettő. Az új kör más hat seedet ad. */
export function blogArtCandidates(slug: string, round = 0): BlogArtCandidate[] {
  const usedSeeds = new Set<number>();
  const candidates: BlogArtCandidate[] = [];

  for (const family of BLOG_ART_FAMILIES) {
    for (const index of [0, 1]) {
      let seed = 1 + (hashString(`${slug || "uj-cikk"}:preview:${round}:${family}:${index}`) % 9999);
      while (usedSeeds.has(seed)) seed = 1 + (seed % 9999);
      usedSeeds.add(seed);
      candidates.push({ family, seed });
    }
  }

  return candidates;
}
