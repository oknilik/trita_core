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

import { rankDimensionScores } from "./tritan";

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
 * Megjelenítésre kész FŐNÉVI archetípus („Újító", "Innovator") — ez a
 * címke akkor jár egy dimenziónak, ha az a DOMINÁNS.
 *
 * Azért exportált, hogy a típust VÁLASZTÓ felületek (pl. az interakció-
 * szimuláció archetípus-választója) ugyanazt a szókincset kínálják, amit a
 * profil megjelenít — különben a felhasználónak fejben kellene leképeznie a
 * dimenzió-nevet az archetípus-névre.
 */
export function personalityNoun(
  code: string,
  locale: PersonalityLocale,
): string | null {
  const parts = PERSONALITY_TYPE_PARTS[code];
  if (!parts) return null;
  return capitalizeFirst(locale === "hu" ? parts.noun.hu : parts.noun.en);
}

/**
 * Megjelenítésre kész MELLÉKNÉVI színezet („Energikus", "Energetic") — ez a
 * címke akkor jár egy dimenziónak, ha az a MÁSODIK legerősebb.
 */
export function personalityAdjective(
  code: string,
  locale: PersonalityLocale,
): string | null {
  const parts = PERSONALITY_TYPE_PARTS[code];
  if (!parts) return null;
  return capitalizeFirst(
    locale === "hu" ? parts.adjective.hu : parts.adjective.en,
  );
}

/**
 * A melléknévi színezet megbízhatósági küszöbe: ha a 2. és 3. helyezett
 * dimenzió pontkülönbsége ennél kisebb, a "második legerősebb" kijelölése
 * a mérési hibán belüli sorrend — a melléknév ilyenkor műtermék lenne.
 *
 * Érték = Math.round(dimStandardError("short")) a közös pszichometriai
 * magból (src/lib/psychometrics.ts). SZÁNDÉKOSAN literál: ezt a modult
 * kliens-komponensek is importálják (guest-teaser, TypeGlyphPlate…), a
 * psychometrics viszont a teljes kérdésbankot húzná a bundle-be. A drift
 * ellen invariáns-teszt véd: tests/unit/scoring/psychometrics.test.ts.
 */
export const TYPE_ADJECTIVE_MIN_GAP = 10;

/**
 * Kényelmi wrapper: pontozott dimenzió-listából választja ki a top kettőt
 * (rankDimensionScores: pontszám csökkenő, holtversenynél TRITAN_ORDER —
 * így a vendég-teaser és a belépett felületek azonos címkét adnak).
 * Kevesebb mint két (ismert) dimenziónál null.
 *
 * Csak az archetípus-nyelvtan által ismert kódok rangsorolódnak: az
 * intersticiális altruizmus-skála ("I") és bármely sérült kulcs kiesik —
 * különben a rangsort és a gap-szabályt olyan skála torzítaná, amiből
 * címke úgysem képezhető (nyers scores.dimensions bemenetnél ez élő eset).
 *
 * Melléknév-óvatosság: ha a 2. és 3. helyezett közti különbség a mérési
 * hibán belül van (< TYPE_ADJECTIVE_MIN_GAP), csak a főnévi archetípus
 * megy ki ("Újító" / "Innovator") — a melléknévi színezet nem állítható
 * megbízhatóan. Pontosan két dimenziónál nincs 3. helyezett, ilyenkor a
 * teljes címke marad.
 */
export function resolvePersonalityTypeFromScores(
  dimensions: ReadonlyArray<{ code: string; score: number }>,
  locale: PersonalityLocale,
): string | null {
  const known = dimensions.filter((d) => PERSONALITY_TYPE_PARTS[d.code]);
  if (known.length < 2) return null;
  const ranked = rankDimensionScores(known);
  const [first, second, third] = ranked;
  if (third && second.score - third.score < TYPE_ADJECTIVE_MIN_GAP) {
    return personalityNoun(first.code, locale);
  }
  return resolvePersonalityTypeLabel(first.code, second.code, locale);
}
