// ─────────────────────────────────────────────────────────────────────
// Pszichometriai mag — reliabilitás → mérési hiba (SEM) → konfidencia-sáv.
//
// A pontszám önértékelés-alapú BECSLÉS: ahol a különbség a mérési hibán
// belül van, ott NEM állítunk sorrendet/címkét — ez a termék hitelességi
// alapelve. Ez a modul a KÖZÖS mag (fő személyiség-út + karrier-motor);
// a karrier-specifikus terjesztés (observer-keverés, fit-SE, klaszterezés)
// a src/lib/career/psychometrics.ts-ben él, és innen re-exportál.
//
// FIGYELEM (bundle): az item-számok a kérdésbankból (questions/tritan.ts)
// származnak MODULBETÖLTÉSKOR, így ez a modul behúzza a bankot — kliens-
// komponensből NE importáld (a kliens-felület a kerekített SEM-et proppal
// kapja, ld. profile/results/page.tsx → DimensionAccordion).
// ─────────────────────────────────────────────────────────────────────

import type { AssessmentForm } from "@/lib/questions/types";
import { tritanConfig } from "@/lib/questions/tritan";
import { HEXACO_ORDER, type HexacoCode } from "@/lib/hexaco";

// ── Item-számok a TSFI bankból származtatva ──────────────────────────
// A hat fő dimenzió itemei számítanak (a kiegészítő altruizmus-skála nem);
// a korábbi kézzel átlagolt konstansok (9.5 / 2.5) helyett a bank a
// forrás — invariáns-teszt: tests/unit/scoring/psychometrics.test.ts.
//
// 2026-08-11 óta a rövid forma MINDEN itemje fő-dimenziós: 60 item,
// dimenziónként pontosan 10 (korábban 58 + 2 altruizmus). A küszöb (
// DIFF_MIN_GAP) nem itt él (kliens-bundle), hanem a personality-type.ts
// literáljában, amit a fenti invariáns-teszt köt ide.
const MAIN_DIM_CODES = new Set<string>(HEXACO_ORDER);
const mainItems = tritanConfig.questions.filter((q) =>
  MAIN_DIM_CODES.has(q.dimension),
);
const shortMainItems = mainItems.filter((q) => q.short === true);
const mainFacetCount = new Set(
  mainItems.map((q) => q.facet).filter((f): f is string => Boolean(f)),
).size;

if (mainItems.length === 0 || shortMainItems.length === 0 || mainFacetCount === 0) {
  // Sérült bank mellett a SEM-számítás értelmezhetetlen — inkább hangosan.
  throw new Error("psychometrics: a TSFI bankból nem származtatható item-szám");
}

/** Átlagos item-szám dimenziónként, kérdőív-formánként (a reliabilitás alapja). */
export const ITEMS_PER_DIM: Record<AssessmentForm, number> = {
  short: shortMainItems.length / HEXACO_ORDER.length,
  full: mainItems.length / HEXACO_ORDER.length,
};

/** Átlagos item-szám facetenként, kérdőív-formánként. */
export const ITEMS_PER_FACET: Record<AssessmentForm, number> = {
  short: shortMainItems.length / mainFacetCount,
  full: mainItems.length / mainFacetCount,
};

// ── MÉRT reliabilitás-konstansok (2026-08-11) ────────────────────────
// FORRÁS: `docs/research/ipip-reference-2026-08.md` — az IPIP–HEXACO
// nyílt adatcsomag (openpsychometrics.org) a TSFI-be átvett item-
// részhalmazon, a SAJÁT pontozó-motorunkkal (POMP) újrapontozva.
//   n = 21 681 (rövid forma), minőség-szűrés után; futtatás: 2026-08-11.
//
// A MINTA JELLEGE (ezért KÖZELÍTŐ referencia, nem norma): nemzetközi,
// ANGOL nyelvű, ÖNSZELEKTÁLT online kitöltők. Nem a magyar nyelvű
// kitöltést és nem az ügyfél-populációt képviseli — ezek a számok
// kizárólag BELSŐ kalibrációra valók (mérési-hiba küszöbök), a felületi
// percentilis továbbra is TILTOTT (`norms.ts` `ACTIVE_NORM_TABLE`
// érintetlen). A MAGYAR PILOT ADATA EZEKET LE FOGJA VÁLTANI.
//
// KORÁBBI ÉRTÉKEK (kézzel beállított priorok, 2026-08-11-ig — auditálható
// nyom): MEAN_ITEM_R = 0.22, SCORE_SD = 20. Ezekből SEM(rövid) = 10,23 és
// √2·SEM = 14,47 jött; a mért adat szerint a prior ~25%-kal pesszimista
// volt, azaz VALÓS különbségeket nyomtunk el (alul-állítottunk).
//
// A mért mögöttes tábla (rövid forma): α átlag .769 (.694 O … .803 X),
// r̄ átlag .264 (.192 O … .340 X), SD átlag 16,2 (11,9 O … 19,6 X).
// FIGYELEM: a mérés a MOSTANI bank-összeállításon futott (60 rövid item,
// dimenziónként pontosan 10). Ha a bank összetétele változik, a mért
// oszlop újrafuttatandó — az itemhalmaz-specifikus.

/**
 * Átlagos item-item korreláció a hat fő skálán — MÉRT (0.264), korábban
 * kézi prior (0.22). Dimenziónkénti bontás: MEASURED_MEAN_ITEM_R_BY_DIM.
 */
export const MEAN_ITEM_R = 0.264;
/**
 * A pontszám-eloszlás szórása a 0-100 (POMP) skálán — MÉRT átlag (16.2 a
 * rövid formán; a teljes formán 15.5), korábban kézi prior (20).
 * Dimenziónkénti bontás: MEASURED_SCORE_SD_BY_DIM.
 */
export const SCORE_SD = 16.2;

/**
 * MÉRT szórás dimenziónként (rövid forma, 0-100 POMP) — a globális
 * SCORE_SD bontása. Az X értéke felfelé torzított: a social_self_esteem
 * facet (4 item) nincs az IPIP-adatban, így az X 8/10 itemen közelített.
 */
export const MEASURED_SCORE_SD_BY_DIM: Record<HexacoCode, number> = {
  H: 16.5,
  E: 16.8,
  X: 19.6,
  A: 16.5,
  C: 15.7,
  O: 11.9,
};

/**
 * MÉRT átlagos item-item korreláció dimenziónként — a globális MEAN_ITEM_R
 * bontása. (Az X-é a 8 leképezett itemen mért érték.)
 */
export const MEASURED_MEAN_ITEM_R_BY_DIM: Record<HexacoCode, number> = {
  H: 0.234,
  E: 0.283,
  X: 0.340,
  A: 0.271,
  C: 0.262,
  O: 0.192,
};

function isHexacoCode(code: string): code is HexacoCode {
  return (HEXACO_ORDER as readonly string[]).includes(code);
}

/** Spearman–Brown / Cronbach-α becslés item-számból és átlagos item-korrelációból. */
export function alphaFromItems(k: number, meanR = MEAN_ITEM_R): number {
  return (k * meanR) / (1 + (k - 1) * meanR);
}

/**
 * Mérési hiba (SEM) egy dimenzió-pontszámon, a kérdőív-forma szerint.
 *
 * PER-DIMENZIÓ (opcionális, 2026-08-11): ha a hívó megad egy HEXACO-kódot,
 * a mért dimenzió-specifikus SD-ből és r̄-ból számolunk. Ismeretlen/hiányzó
 * kódnál a GLOBÁLIS mért értékre esünk vissza — NaN nem keletkezhet.
 *
 * MIÉRT nem ez a felületi alapértelmezés (döntés, 2026-08-11): a nyers SD
 * heterogenitása nagy (11,9 O … 19,6 X, 65% szórás), DE a magasabb SD-jű
 * skálák α-ja is magasabb, és a kettő KIOLTJA egymást: a rövid formán a
 * √2·SEM dimenziónként 9,2 (O) … 11,6 (H), a globális 10,7 körül. A
 * megjelenítést kapuzó küszöb (DIFF_MIN_GAP) így dimenziónként legfeljebb
 * ±1-2 ponttal térne el — cserébe minden hívó helyre (kliens-komponensek,
 * PDF, dossié, jelölt-oldal) dimenzió-argumentumot kellene átvezetni, és a
 * felületen dimenziónként MÁS küszöb jelenne meg („itt 9 pont már eltérés,
 * ott 12 még nem"), amit nem tudunk elmagyarázni. A tábla itt van, a
 * függvény tud vele számolni — a váltás a pilot-adat után értékelendő újra.
 */
export function dimStandardError(form: AssessmentForm, code?: string): number {
  const sd = code && isHexacoCode(code) ? MEASURED_SCORE_SD_BY_DIM[code] : SCORE_SD;
  const meanR =
    code && isHexacoCode(code) ? MEASURED_MEAN_ITEM_R_BY_DIM[code] : MEAN_ITEM_R;
  const alpha = alphaFromItems(ITEMS_PER_DIM[form], meanR);
  return sd * Math.sqrt(Math.max(0, 1 - alpha));
}

/** Facet-szintű SEM — mindig NAGYOBB, mint a dimenzióé (kevesebb item). */
export function facetStandardError(form: AssessmentForm): number {
  const alpha = alphaFromItems(ITEMS_PER_FACET[form]);
  return SCORE_SD * Math.sqrt(Math.max(0, 1 - alpha));
}

export function bandFor(score: number, se: number): { low: number; high: number } {
  return {
    low: Math.max(0, Math.round(score - se)),
    high: Math.min(100, Math.round(score + se)),
  };
}

/**
 * Két FÜGGETLEN pontszám KÜLÖNBSÉGÉNEK standard hibája: SE(diff) = √2·SEM.
 * Minden „a sorrend/gap a mérési hibán belül van?" döntés EZT használja, nem az
 * egy-pontos SEM-et — két hiba-bearing pont különbsége √2-szer zajosabb, mint
 * egy pont. (A korábbi 1×SEM-kapu ~40%-kal alul-becsülte a különbség hibáját.)
 *
 * FONTOS: ez BELSŐ logikai küszöb — eldönti, MIKOR NE állítsunk sorrendet/
 * címkét. A felületen mérési-hiba SZÁM (±) NEM jelenik meg (2026-08-11 termék-
 * döntés: a ± nem kerül ki a UI-ra, a magyarázat külön, központi leírásban él).
 *
 * A `code` opcionális — ld. dimStandardError: a felületi kapuk GLOBÁLIS
 * értéket használnak, a per-dimenzió számítás belső elemzésre/pilot-
 * kalibrációra érhető el. Ismeretlen kódnál globális fallback.
 */
export function diffStandardError(form: AssessmentForm, code?: string): number {
  return Math.SQRT2 * dimStandardError(form, code);
}

/**
 * Két FÜGGETLEN átlag különbségének standard hibája az egyéni pontszámok
 * SEM-jéből: √(SEM₁²/n₁ + SEM₂²/n₂).
 *
 * Érvénytelen vagy üres mintánál végtelent adunk, nem dobunk: a riport-
 * összehasonlító így biztonságosan zárva marad, és sérült/örökölt
 * pillanatképből sem állít mérési hibán túli változást.
 */
export function independentMeanDiffStandardError(
  standardError1: number,
  sampleSize1: number,
  standardError2: number,
  sampleSize2: number,
): number {
  if (
    !Number.isFinite(standardError1) ||
    standardError1 < 0 ||
    !Number.isFinite(standardError2) ||
    standardError2 < 0 ||
    !Number.isFinite(sampleSize1) ||
    sampleSize1 <= 0 ||
    !Number.isFinite(sampleSize2) ||
    sampleSize2 <= 0
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.sqrt(
    standardError1 ** 2 / sampleSize1 + standardError2 ** 2 / sampleSize2,
  );
}

/**
 * Két csapat dimenzió-ÁTLAGÁNAK különbségi hibája. A két kör jelenleg
 * ugyanazt a kérdőív-formát használja; a dimenzió-kód opcionális, és a
 * dimStandardError kanonikus mért kalibrációjára támaszkodik.
 */
export function teamMeanDiffStandardError(
  form: AssessmentForm,
  sampleSize1: number,
  sampleSize2: number,
  code?: string,
): number {
  const sem = dimStandardError(form, code);
  return independentMeanDiffStandardError(sem, sampleSize1, sem, sampleSize2);
}
