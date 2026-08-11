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
 * Sorrend-megbízhatósági küszöb: ha KÉT dimenzió pontkülönbsége ennél kisebb,
 * a köztük lévő sorrend a mérési hibán belül van → NEM állítjuk (a címke
 * főnév-only, a próza nem nevezi meg a másodikat).
 *
 * Érték = Math.round(diffStandardError("short")) = round(√2·SEM): két pont
 * KÜLÖNBSÉGÉNEK hibája, nem egy ponté — a korábbi 10 (= 1×SEM) ~40%-kal
 * alul-becsülte, ezért olyan sorrendeket is „biztosnak" vett, amik a mérési
 * hibán belül voltak. SZÁNDÉKOSAN literál: ezt a modult kliens-komponensek is
 * importálják (guest-teaser, TypeGlyphPlate…), a psychometrics a teljes
 * kérdésbankot húzná a bundle-be. Drift ellen invariáns-teszt:
 * tests/unit/scoring/psychometrics.test.ts.
 */
export const DIFF_MIN_GAP = 15;

/** @deprecated Használd a DIFF_MIN_GAP-et — azonos küszöb (√2·SEM). */
export const TYPE_ADJECTIVE_MIN_GAP = DIFF_MIN_GAP;

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
 * megbízhatóan.
 *
 * Top-pár óvatosság (motor-audit v3, interpr. S3): ugyanez a kapu az 1. és
 * 2. helyezettre is fut — ha a két LEGERŐSEBB dimenzió van egy SEM-en belül,
 * a főnév/melléknév kiosztás (melyik a domináns) a mérési hibán belüli
 * sorrend műterméke lenne, pedig pont ez határozza meg a fő archetípust.
 * Ilyenkor is főnév-only címke megy ki, a determinisztikus rangsor (pontszám,
 * holtversenynél TRITAN_ORDER) szerinti első főnevével — ugyanaz a
 * degradáció, ami a 2-3. helyezett közeli esetében már élt (a teljes
 * holtverseny eddig is így viselkedett). Pontosan két dimenziónál nincs
 * 3. helyezett, ott csak a top-pár kapu fut.
 */
export function resolvePersonalityTypeFromScores(
  dimensions: ReadonlyArray<{ code: string; score: number }>,
  locale: PersonalityLocale,
): string | null {
  const known = dimensions.filter((d) => PERSONALITY_TYPE_PARTS[d.code]);
  if (known.length < 2) return null;
  const ranked = rankDimensionScores(known);
  const [first, second, third] = ranked;
  const topPairUncertain = first.score - second.score < DIFF_MIN_GAP;
  const adjectiveUncertain = third
    ? second.score - third.score < DIFF_MIN_GAP
    : false;
  if (topPairUncertain || adjectiveUncertain) {
    return personalityNoun(first.code, locale);
  }
  return resolvePersonalityTypeLabel(first.code, second.code, locale);
}

/**
 * Igaz, ha a két legerősebb (ismert) dimenzió pontkülönbsége a mérési hibán
 * belül van (< DIFF_MIN_GAP = √2·SEM) — ilyenkor a domináns/másodlagos sorrend
 * bizonytalan, és a próza (glyph-plate „a második legerősebb …", interakció-
 * subtitle „Energikus + Újító") NEM nevezheti meg a másodikat, hedge-elnie kell.
 * A címke-logika (resolvePersonalityTypeFromScores) ugyanezt a kaput futtatja —
 * így az ábra melletti szöveg és a címke sosem mond ellent egymásnak.
 * Ez BELSŐ jelzés: nem hoz felszínre mérési-hiba számot, csak a szöveget kapuzza.
 */
export function isTopPairUncertain(
  dimensions: ReadonlyArray<{ code: string; score: number }>,
): boolean {
  const known = dimensions.filter((d) => PERSONALITY_TYPE_PARTS[d.code]);
  if (known.length < 2) return false;
  const ranked = rankDimensionScores(known);
  return ranked[0].score - ranked[1].score < DIFF_MIN_GAP;
}
