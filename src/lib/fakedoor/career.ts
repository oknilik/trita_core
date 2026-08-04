// ─────────────────────────────────────────────────────────────────────
// Karrier-iránytű fake door — a MÉRÉS szerződése.
//
// Az oldal nem eladni akar, hanem három kérdésre megbízható választ adni:
//   1. van-e fizetési szándék?
//   2. milyen áron?
//   3. melyik problémát oldaná meg vele a felhasználó?
//
// Ami itt konstans, az a mérés definíciója — ha bármelyik változik, a korábbi
// válaszok MÁS kérdésre adott válaszok, és külön mintaként kezelendők.
//
// Őszinteségi keret (nem opcionális): az oldal kimondja, hogy a funkció még
// nem létezik, nincs fizetési folyamat, és bankkártya-adatot nem kérünk.
// ─────────────────────────────────────────────────────────────────────

/** Modul-kulcs a FakeDoorView/FakeDoorResponse sorokban. */
export const CAREER_FAKE_DOOR_MODULE = "career_compass";

/**
 * Ársávok (Ft). HÁROM sáv, nem egy: egyetlen áron mért fake door csak arról
 * mond valamit, hogy 9 900-nál mi a helyzet — a keresleti görbe alakjáról, és
 * arról, hol törik meg a szándék, semmit.
 *
 * A sorrend rögzített: a sorsolás index alapján dolgozik, tehát átrendezés
 * esetén a korábbi minta besorolása csúszna el.
 */
export const CAREER_PRICE_VARIANTS = [4900, 9900, 14900] as const;
export type CareerPriceVariant = (typeof CAREER_PRICE_VARIANTS)[number];

export function isCareerPriceVariant(value: number): value is CareerPriceVariant {
  return (CAREER_PRICE_VARIANTS as readonly number[]).includes(value);
}

/**
 * Ki válaszolt. A tanácsadó válasza NEM a 9 900 Ft-os egyéni vevőről szól —
 * ha egy számba keverednének, a mért szándék használhatatlan lenne.
 */
export const FAKE_DOOR_AUDIENCES = [
  "individual",
  "candidate",
  "consultant",
  "anon",
] as const;
export type FakeDoorAudience = (typeof FAKE_DOOR_AUDIENCES)[number];

/** Honnan érkezett — a szándék minőségét ez keretezi. */
export const FAKE_DOOR_SOURCES = ["results", "dashboard", "direct"] as const;
export type FakeDoorSource = (typeof FAKE_DOOR_SOURCES)[number];

export function isFakeDoorSource(value: string): value is FakeDoorSource {
  return (FAKE_DOOR_SOURCES as readonly string[]).includes(value);
}

/**
 * „Igen" ág: mit oldana meg vele. A kattintás önmagában olcsó jelzés — ez a
 * kérdés mondja meg, MELYIK terméket kellene megépíteni.
 *
 * A `skipped` teljes értékű válasz: az átugrás nem ronthatja a konverziót, de
 * tudnunk kell, hányan hagyták ki (különben a megoszlás felfelé torzul).
 */
export const CAREER_VALUE_GOALS = [
  "fit",        // megtudni, milyen munkák illenek hozzám
  "switch",     // pályaváltás előtt dönteni
  "interview",  // állásinterjúra felkészülni
  "confirm",    // megerősítést kapni, hogy jó helyen vagyok
  "other",
  "skipped",
] as const;
export type CareerValueGoal = (typeof CAREER_VALUE_GOALS)[number];

/**
 * „Nem" ág: miért nem. Termékdöntés szempontjából gyakran ez az értékesebb —
 * a „drága" ár-probléma, a „nem hinném, hogy pontos" bizonyíték-probléma, és
 * a kettő teljesen más fejlesztést indokol.
 *
 * A korábbi „ingyen kipróbálnám, fizetve nem" opció KIKERÜLT: az ár-csúszka
 * ugyanazt méri, csak pontosabban — aki semennyit nem adna, az nullára húzza,
 * és így nem bináris válasz lesz belőle, hanem egy összeg.
 */
export const CAREER_NO_REASONS = [
  "price",      // drágának tartom → utána csúszkán megadja, mennyit adna
  "accuracy",   // nem hiszem, hogy elég pontos lenne
  "no_need",    // most nincs karrierkérdésem
  "other",
  // Az átugrás itt is teljes értékű válasz: enélkül a `null` nem
  // megkülönböztethető attól, aki még nem jutott el a kérdésig — a „nem"
  // ág megoszlása pedig némán hiányos lenne.
  "skipped",
] as const;
export type CareerNoReason = (typeof CAREER_NO_REASONS)[number];

/**
 * Az ár-csúszka lépésköze (Ft).
 *
 * 100, nem 500: a HTML range a `min`-től rácsozza a lépéseket, és mindhárom
 * ársáv (4900 / 9900 / 14900) csak százasokra esik. 500-zal a csúszka a
 * MEGNYITÁSKOR lecsúszott volna a látott ár alá (14 900 → 14 500), és a
 * kiindulópont már eleve egy le nem adott engedmény lett volna.
 */
export const CAREER_PRICE_STEP = 100;

/** Az „egyéb" szabad szöveg felső határa — a UI és a szerver ugyanezt méri. */
export const FAKE_DOOR_OTHER_MAX = 200;

/**
 * Ársáv-sorsolás a munkamenet azonosítójából, FNV-1a hash-sel.
 *
 * DETERMINISZTIKUS, szándékosan: aki visszatér, ugyanazt az árat lássa.
 * Ha az ár váltakozna, a válasz nem egy árra vonatkozó döntés lenne, hanem
 * zaj — és a felhasználó felé is tisztességtelen.
 */
export function assignPriceVariant(sessionId: string): CareerPriceVariant {
  let hash = 0x811c9dc5;
  for (let i = 0; i < sessionId.length; i += 1) {
    hash ^= sessionId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return CAREER_PRICE_VARIANTS[hash % CAREER_PRICE_VARIANTS.length];
}

/** Ft-formátum a kimondott árhoz. Egy helyen, hogy a mérés és a UI ne csússzon. */
export function formatPrice(amount: number, locale: "hu" | "en"): string {
  return new Intl.NumberFormat(locale === "hu" ? "hu-HU" : "en-GB", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(amount);
}
