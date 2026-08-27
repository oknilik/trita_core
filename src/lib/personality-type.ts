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

import { rankDimensionScores } from "./hexaco";

export type PersonalityLocale = "hu" | "en";

interface TypeParts {
  /** Főnévi archetípus, ha ez a DOMINÁNS dimenzió. */
  noun: { hu: string; en: string };
  /** Melléknévi színezet, ha ez a MÁSODIK legerősebb dimenzió. */
  adjective: { hu: string; en: string };
}

export const PERSONALITY_TYPE_PARTS: Record<string, TypeParts> = {
  H: {
    noun: { hu: "értékőr", en: "Value Guardian" },
    adjective: { hu: "elvhű", en: "Principled" },
  },
  // 2026-08-11, valencia-revízió: a korábbi „empata"/"Empath" NEM a mért
  // konstruktum — az Emocionalitás facetjei a Félelem / Szorongás /
  // Dependencia / Érzelmi kötődés, az empátia (mások iránti törődés) nem
  // ezen a skálán mérődik. A helyére a ráhangolódás-család került: leíró,
  // nem erény — nem ígér empátiát, törődést vagy „érzelmi mélységet".
  // (EN: a „ráhangolódó" főnévi helyzetben angolul nem áll meg jelzővel —
  // „Energetic Attuned" nyelvtanilag rossz —, ezért a főnév leíró
  // szókapcsolat, a melléknévi színezet marad „Attuned".)
  E: {
    noun: { hu: "ráhangolódó", en: "Signal Reader" },
    adjective: { hu: "ráhangolódó", en: "Attuned" },
  },
  X: {
    noun: { hu: "hajtóerő", en: "Driving Force" },
    adjective: { hu: "energikus", en: "Energetic" },
  },
  A: {
    noun: { hu: "hídépítő", en: "Bridge-Builder" },
    adjective: { hu: "együttműködő", en: "Collaborative" },
  },
  C: {
    noun: { hu: "rendszerépítő", en: "Architect" },
    adjective: { hu: "módszeres", en: "Methodical" },
  },
  O: {
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
 * Megjelenítésre kész FŐNÉVI archetípus („Újító", "Innovator") – ez a
 * címke akkor jár egy dimenziónak, ha az a DOMINÁNS.
 *
 * Azért exportált, hogy a típust VÁLASZTÓ felületek (pl. az interakció-
 * szimuláció archetípus-választója) ugyanazt a szókincset kínálják, amit a
 * profil megjelenít – különben a felhasználónak fejben kellene leképeznie a
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
 * Megjelenítésre kész MELLÉKNÉVI színezet („Energikus", "Energetic") – ez a
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
 * KÜLÖNBSÉGÉNEK hibája, nem egy ponté – a korábbi 10 (= 1×SEM) ~40%-kal
 * alul-becsülte, ezért olyan sorrendeket is „biztosnak" vett, amik a mérési
 * hibán belül voltak. SZÁNDÉKOSAN literál: ezt a modult kliens-komponensek is
 * importálják (guest-teaser, TypeGlyphPlate…), a psychometrics a teljes
 * kérdésbankot húzná a bundle-be. Drift ellen invariáns-teszt:
 * tests/unit/scoring/psychometrics.test.ts.
 *
 * 15 → 14 (2026-08-11, bank-átsúlyozás): a kiegészítő altruizmus-skála két
 * itemje kikerült a rövid formából, helyettük két FŐ-dimenziós item lépett be
 * (9,67 → 10 item/dimenzió), így α 0,7317 → 0,7383, SEM 10,36 → 10,23.
 *
 * 14 → 11 (2026-08-11, MÉRT reliabilitás): a psychometrics.ts kézi priorjai
 * (r̄ = 0,22, SD = 20) helyére mért értékek kerültek (r̄ = 0,264, SD = 16,2 –
 * IPIP–HEXACO nyílt adat, n = 21 681, ld. docs/research/ipip-reference-2026-08.md
 * és a psychometrics.ts forrás-blokkja). A prior ~25%-kal pesszimista volt:
 * α 0,7383 → 0,7820, SEM 10,23 → 7,56, SE(diff) 14,47 → 10,70 → kerekítve 11.
 * A kapu nem „lazult": eddig a 11-13 pontos, VALÓS különbségeket is elnyeltük.
 * A minta nemzetközi, angol nyelvű, önszelektált – közelítő referencia; a
 * magyar pilot adata ezt a számot felülírja.
 */
export const DIFF_MIN_GAP = 11;

/** @deprecated Használd a DIFF_MIN_GAP-et – azonos küszöb (√2·SEM). */
export const TYPE_ADJECTIVE_MIN_GAP = DIFF_MIN_GAP;

/**
 * Kényelmi wrapper: pontozott dimenzió-listából választja ki a top kettőt
 * (rankDimensionScores: pontszám csökkenő, holtversenynél HEXACO_ORDER –
 * így a vendég-teaser és a belépett felületek azonos címkét adnak).
 * Kevesebb mint két (ismert) dimenziónál null.
 *
 * Csak az archetípus-nyelvtan által ismert kódok rangsorolódnak: az
 * intersticiális altruizmus-skála ("I") és bármely sérült kulcs kiesik –
 * különben a rangsort és a gap-szabályt olyan skála torzítaná, amiből
 * címke úgysem képezhető (nyers scores.dimensions bemenetnél ez élő eset).
 *
 * Melléknév-óvatosság: ha a 2. és 3. helyezett közti különbség a mérési
 * hibán belül van (< TYPE_ADJECTIVE_MIN_GAP), csak a főnévi archetípus
 * megy ki ("Újító" / "Innovator") – a melléknévi színezet nem állítható
 * megbízhatóan.
 *
 * Top-pár óvatosság (motor-audit v3, interpr. S3): ugyanez a kapu az 1. és
 * 2. helyezettre is fut – ha a két LEGERŐSEBB dimenzió van egy SEM-en belül,
 * a főnév/melléknév kiosztás (melyik a domináns) a mérési hibán belüli
 * sorrend műterméke lenne, pedig pont ez határozza meg a fő archetípust.
 * Ilyenkor is főnév-only címke megy ki, a determinisztikus rangsor (pontszám,
 * holtversenynél HEXACO_ORDER) szerinti első főnevével – ugyanaz a
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
 * belül van (< DIFF_MIN_GAP = √2·SEM) – ilyenkor a domináns/másodlagos sorrend
 * bizonytalan, és a próza (glyph-plate „a második legerősebb …", interakció-
 * subtitle „Energikus + Újító") NEM nevezheti meg a másodikat, hedge-elnie kell.
 * A címke-logika (resolvePersonalityTypeFromScores) ugyanezt a kaput futtatja –
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

/**
 * Igaz, ha a MÁSODLAGOS dimenzió (a melléknévi színezet) megnevezése bizonytalan
 * – VAGY a top-pár van a mérési hibán belül (a domináns sem biztos), VAGY a 2–3.
 * hely (a melléknév) van azon belül. Ez PONTOSAN a címke-lefokozás kapuja
 * (resolvePersonalityTypeFromScores: `topPairUncertain || adjectiveUncertain`),
 * ezért a prózát (glyph-plate „X × Y", „a második legerősebb …", archetípus-
 * sztori) EHHEZ kell kötni – az `isTopPairUncertain` csak a top-párt nézi, így a
 * 2–3. bizonytalanság esetén a próza megnevezte a másodikat, miközben a címke már
 * főnév-only volt (motor-audit v6, interp F1). Belső jelzés: nem hoz ± számot.
 */
export function isSecondaryUncertain(
  dimensions: ReadonlyArray<{ code: string; score: number }>,
): boolean {
  const known = dimensions.filter((d) => PERSONALITY_TYPE_PARTS[d.code]);
  if (known.length < 2) return false;
  const ranked = rankDimensionScores(known);
  const [first, second, third] = ranked;
  const topPairUncertain = first.score - second.score < DIFF_MIN_GAP;
  const adjectiveUncertain = third ? second.score - third.score < DIFF_MIN_GAP : false;
  return topPairUncertain || adjectiveUncertain;
}
