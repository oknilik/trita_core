// ─────────────────────────────────────────────────────────────────────
// Személyiség-típus címke a két legerősebb TRITAN-dimenzióból.
//
// Elv (2026-07-22, elnevezés-revízió): a domináns dimenzió adja a FŐNÉVI
// archetípust (ki vagy), a második legerősebb a MELLÉKNÉVI színezetet
// (hogyan) — természetes magyar szórenddel: „Energikus újító", nem
// „Innovátor Energikus". Az angol ugyanígy: "Energetic Innovator".
// A korábbi mechanikus címke-összefűzés (`${a} ${b}`) nyelvtanilag rossz
// és steril neveket adott; ez a modul a results- és a share-oldal közös
// forrása (a duplikált logika helyett).
// ─────────────────────────────────────────────────────────────────────

export type PersonalityLocale = "hu" | "en";

interface TypeParts {
  /** Főnévi archetípus, ha ez a DOMINÁNS dimenzió. */
  noun: { hu: string; en: string };
  /** Melléknévi színezet, ha ez a MÁSODIK legerősebb dimenzió. */
  adjective: { hu: string; en: string };
}

export const PERSONALITY_TYPE_PARTS: Record<string, TypeParts> = {
  INTE: {
    noun: { hu: "értékőr", en: "Value Guardian" },
    adjective: { hu: "elvhű", en: "Principled" },
  },
  RESO: {
    noun: { hu: "empata", en: "Empath" },
    adjective: { hu: "empatikus", en: "Empathetic" },
  },
  TEMP: {
    noun: { hu: "hajtóerő", en: "Driving Force" },
    adjective: { hu: "energikus", en: "Energetic" },
  },
  ADAP: {
    noun: { hu: "hídépítő", en: "Bridge-Builder" },
    adjective: { hu: "együttműködő", en: "Collaborative" },
  },
  THOR: {
    noun: { hu: "rendszerépítő", en: "Architect" },
    adjective: { hu: "módszeres", en: "Methodical" },
  },
  OPEN: {
    noun: { hu: "újító", en: "Innovator" },
    adjective: { hu: "kísérletező", en: "Inventive" },
  },
};

function capitalizeFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Címke a (domináns, második) dimenzió-párból.
 * HU: „Energikus újító" (mondatszerű kapitalizáció);
 * EN: "Energetic Innovator" (title case).
 * Ismeretlen kódnál null — a hívó adjon fallbacket.
 */
export function resolvePersonalityTypeLabel(
  primaryCode: string,
  secondaryCode: string,
  locale: PersonalityLocale,
): string | null {
  const primary = PERSONALITY_TYPE_PARTS[primaryCode];
  const secondary = PERSONALITY_TYPE_PARTS[secondaryCode];
  if (!primary || !secondary) return null;
  if (locale === "hu") {
    return capitalizeFirst(`${secondary.adjective.hu} ${primary.noun.hu}`);
  }
  return `${secondary.adjective.en} ${primary.noun.en}`;
}

/**
 * Kényelmi wrapper: pontozott dimenzió-listából (score szerint rendezve
 * választja ki a top kettőt). Kevesebb mint két dimenziónál null.
 */
export function resolvePersonalityTypeFromScores(
  dimensions: ReadonlyArray<{ code: string; score: number }>,
  locale: PersonalityLocale,
): string | null {
  if (dimensions.length < 2) return null;
  const [first, second] = [...dimensions].sort((a, b) => b.score - a.score);
  return resolvePersonalityTypeLabel(first.code, second.code, locale);
}
