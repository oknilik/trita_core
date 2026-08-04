// ─────────────────────────────────────────────────────────────────────
// Érdeklődés-kérdőív (RIASEC / Holland-kód) — 30 tevékenység-item,
// betűnként 5, az O*NET Interest Profiler (Mini-IP) mintájára.
// Az O*NET Interest Profiler a US Department of Labor közkincs (public
// domain) eszköze; az itemek annak tartalmi köréből adaptált saját
// megfogalmazások (HU+EN). Skála: 1 (egyáltalán nem szívesen) …
// 5 (nagyon szívesen). Betű-pontszám: az 5 item átlaga 0-100-ra vetítve.
// Hivatkozás: https://www.onetcenter.org/IP.html
// ─────────────────────────────────────────────────────────────────────

import type { RiasecLetter } from "@/lib/career/types";

export interface RiasecItem {
  id: number;
  letter: RiasecLetter;
  hu: string;
  en: string;
}

export const RIASEC_ITEMS: RiasecItem[] = [
  // R — Realistic (gyakorlati)
  { id: 1, letter: "R", hu: "Konyhabútort vagy polcrendszert építenék", en: "Build kitchen cabinets or shelving" },
  { id: 2, letter: "R", hu: "Háztartási gépeket javítanék", en: "Repair household appliances" },
  { id: 3, letter: "R", hu: "Elektronikai alkatrészeket szerelnék össze", en: "Assemble electronic parts" },
  { id: 4, letter: "R", hu: "Növényeket gondoznék egy kertészetben", en: "Tend plants in a nursery" },
  { id: 5, letter: "R", hu: "Teherautót vagy munkagépet vezetnék", en: "Drive a truck or operate machinery" },
  // I — Investigative (kutató)
  { id: 6, letter: "I", hu: "Kémiai kísérleteket végeznék", en: "Conduct chemical experiments" },
  { id: 7, letter: "I", hu: "A vízszennyezés csökkentésének módjait vizsgálnám", en: "Study ways to reduce water pollution" },
  { id: 8, letter: "I", hu: "Új gyógymód kifejlesztésén dolgoznék", en: "Work on developing a new treatment" },
  { id: 9, letter: "I", hu: "Vérmintákat elemeznék mikroszkóppal", en: "Examine blood samples using a microscope" },
  { id: 10, letter: "I", hu: "Adatokban keresnék mintázatokat", en: "Look for patterns in data" },
  // A — Artistic (alkotó)
  { id: 11, letter: "A", hu: "Zenét szereznék vagy hangszerelnék", en: "Compose or arrange music" },
  { id: 12, letter: "A", hu: "Illusztrációkat rajzolnék", en: "Draw illustrations" },
  { id: 13, letter: "A", hu: "Színdarabot rendeznék", en: "Direct a play" },
  { id: 14, letter: "A", hu: "Filmes látványelemeket terveznék", en: "Design visual effects for films" },
  { id: 15, letter: "A", hu: "Verset vagy novellát írnék", en: "Write poems or short stories" },
  // S — Social (segítő)
  { id: 16, letter: "S", hu: "Pályaválasztási tanácsot adnék embereknek", en: "Give career guidance to people" },
  { id: 17, letter: "S", hu: "Önkénteskednék egy civil szervezetnél", en: "Do volunteer work at a non-profit" },
  { id: 18, letter: "S", hu: "Személyes gondokkal küzdőknek segítenék", en: "Help people with personal problems" },
  { id: 19, letter: "S", hu: "Gyerekeket tanítanék olvasni", en: "Teach children how to read" },
  { id: 20, letter: "S", hu: "Mozgássorokat tanítanék be valakinek", en: "Teach someone an exercise routine" },
  // E — Enterprising (vállalkozó)
  { id: 21, letter: "E", hu: "Értékpapírokkal kereskednék", en: "Buy and sell stocks and bonds" },
  { id: 22, letter: "E", hu: "Üzletet vezetnék", en: "Manage a retail store" },
  { id: 23, letter: "E", hu: "Saját vállalkozást indítanék", en: "Start my own business" },
  { id: 24, letter: "E", hu: "Egy nagyobb csapat munkáját irányítanám", en: "Lead a larger team's work" },
  { id: 25, letter: "E", hu: "Terméket mutatnék be ügyfeleknek", en: "Present a product to clients" },
  // C — Conventional (rendszerező)
  { id: 26, letter: "C", hu: "Táblázatokat építenék adatok rendszerezésére", en: "Build spreadsheets to organize data" },
  { id: 27, letter: "C", hu: "Nyomtatványokat, nyilvántartásokat ellenőriznék", en: "Proofread records or forms" },
  { id: 28, letter: "C", hu: "Készlet- és szállítási nyilvántartást vezetnék", en: "Keep shipping and inventory records" },
  { id: 29, letter: "C", hu: "Számlákat és bizonylatokat dolgoznék fel", en: "Process invoices and receipts" },
  { id: 30, letter: "C", hu: "Iratokat rendszereznék pontos szabályok szerint", en: "File documents by precise rules" },
];

export const RIASEC_LETTERS: RiasecLetter[] = ["R", "I", "A", "S", "E", "C"];

/**
 * Betűnkénti pontszám 0-100: az adott betű itemeire adott 1-5 válaszok
 * átlaga lineárisan vetítve ((átlag - 1) / 4 * 100). Hiányos kitöltésnél
 * null — a mért kód csak teljes kitöltésből születik.
 */
export function scoreRiasec(
  answers: Record<number, number>,
): Record<RiasecLetter, number> | null {
  if (Object.keys(answers).length < RIASEC_ITEMS.length) return null;
  const result = {} as Record<RiasecLetter, number>;
  for (const letter of RIASEC_LETTERS) {
    const items = RIASEC_ITEMS.filter((item) => item.letter === letter);
    let sum = 0;
    for (const item of items) {
      const value = answers[item.id];
      if (typeof value !== "number" || value < 1 || value > 5) return null;
      sum += value;
    }
    const mean = sum / items.length;
    result[letter] = Math.round(((mean - 1) / 4) * 100);
  }
  return result;
}
