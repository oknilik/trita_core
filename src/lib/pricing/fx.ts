import type { Locale } from "@/lib/i18n/core";

// ─────────────────────────────────────────────────────────────────────
// Árfolyam és pénzformázás a publikus árakhoz.
//
// Az ár FORINTBAN van rögzítve és forintban számlázunk (díjkártya). Az angol
// felület tájékoztató jelleggel EURÓBAN mutatja ugyanazt az összeget, a
// napi középárfolyamon váltva (MNB; ha nem elérhető: EKB referencia-
// árfolyam; ha az sem: rögzített tartalék-árfolyam). Az euró-összeg egész
// euróra kerekített, mert egy „-tól" listaárnál a tizedes csak zaj.
//
// Keretmentes modul (nincs React, nincs fetch): a szerver-oldali betöltés
// az fx.server.ts-ben él, a parser-ek itt, hogy minta-XML-lel tesztelhetők
// legyenek.
// ─────────────────────────────────────────────────────────────────────

export type FxSource = "mnb" | "ecb" | "fallback";

export interface FxRate {
  /** Hány forint egy euró. */
  hufPerEur: number;
  /** Az árfolyam napja (ISO, YYYY-MM-DD); tartalék-árfolyamnál üres. */
  date: string;
  source: FxSource;
}

/**
 * Tartalék-árfolyam, ha sem az MNB, sem az EKB nem elérhető (build idején,
 * hálózati hibánál). Tudatosan kerek, konzervatív szám — a következő
 * ISR-körben a napi árfolyam átveszi a helyét.
 */
export const FALLBACK_HUF_PER_EUR = 400;

export const FALLBACK_FX: FxRate = { hufPerEur: FALLBACK_HUF_PER_EUR, date: "", source: "fallback" };

function decodeXmlEntities(xml: string): string {
  return xml
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Az MNB `GetCurrentExchangeRates` SOAP-válasza. A tartalom egy XML-be
 * ágyazott (entitásokkal escape-elt) XML:
 *   <MNBCurrentExchangeRates><Day date="2026-09-08">
 *     <Rate unit="1" curr="EUR">395,12</Rate> …
 * Elfogadja a nyers belső XML-t is (teszthez, illetve ha valaki a
 * feldolgozott stringet adja át). Tizedesvessző → pont; `unit` osztó.
 */
export function parseMnbRates(xml: string): FxRate | null {
  const decoded = decodeXmlEntities(xml);
  const day = decoded.match(/<Day\s+date="(\d{4}-\d{2}-\d{2})"\s*>([\s\S]*?)<\/Day>/);
  if (!day) return null;
  const rate = day[2].match(/<Rate\s+unit="(\d+)"\s+curr="EUR"\s*>([\d.,]+)<\/Rate>/);
  if (!rate) return null;
  const unit = Number(rate[1]) || 1;
  const value = Number(rate[2].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;
  return { hufPerEur: value / unit, date: day[1], source: "mnb" };
}

/**
 * Az EKB napi referencia-árfolyam XML-je (eurofxref-daily.xml):
 *   <Cube time='2026-09-08'> … <Cube currency='HUF' rate='395.12'/>
 */
export function parseEcbRates(xml: string): FxRate | null {
  const time = xml.match(/<Cube\s+time=['"](\d{4}-\d{2}-\d{2})['"]/);
  const huf = xml.match(/<Cube\s+currency=['"]HUF['"]\s+rate=['"]([\d.]+)['"]/);
  if (!time || !huf) return null;
  const value = Number(huf[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return { hufPerEur: value, date: time[1], source: "ecb" };
}

/** Forint → egész euró, a megadott árfolyamon. */
export function toEur(huf: number, fx: FxRate): number {
  return Math.round(huf / fx.hufPerEur);
}

export interface MoneyParts {
  /** A szám, ezres tagolással (hu: „35 000", en: „88"). */
  amount: string;
  /** „Ft" vagy „€". */
  currency: string;
  /** Igaz, ha a pénznem a szám ELÉ kerül (€88); hamis, ha utána (35 000 Ft). */
  currencyFirst: boolean;
}

const HUF_NUMBER = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 });
const EUR_NUMBER = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

/** A pénz részei a lokálnak megfelelő pénznemben — a nagy szám + kis egység elrendezéshez. */
export function formatMoneyParts(huf: number, locale: Locale, fx: FxRate): MoneyParts {
  if (locale === "en") {
    return { amount: EUR_NUMBER.format(toEur(huf, fx)), currency: "€", currencyFirst: true };
  }
  return { amount: HUF_NUMBER.format(Math.round(huf)), currency: "Ft", currencyFirst: false };
}

/** Folyószövegbe: „35 000 Ft" / „€88". */
export function formatMoney(huf: number, locale: Locale, fx: FxRate): string {
  const parts = formatMoneyParts(huf, locale, fx);
  return parts.currencyFirst ? `${parts.currency}${parts.amount}` : `${parts.amount} ${parts.currency}`;
}

/**
 * Kiemelt ár egy egység-címkével: a nagy betűs rész és a kis betűs rész.
 * hu: big „35 000", small „Ft / fő + ÁFA" · en: big „€88", small „/ person + VAT".
 */
export function moneyDisplay(
  huf: number,
  locale: Locale,
  fx: FxRate,
  unit: string,
): { big: string; small: string } {
  const parts = formatMoneyParts(huf, locale, fx);
  if (parts.currencyFirst) {
    return { big: `${parts.currency}${parts.amount}`, small: unit };
  }
  return { big: parts.amount, small: `${parts.currency} ${unit}`.trim() };
}

/** Az árfolyam napja olvashatóan (en: „8 Sept 2026", hu: „2026. szept. 8."); üres dátumnál üres. */
export function formatFxDate(date: string, locale: Locale): string {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(locale === "en" ? "en-GB" : "hu-HU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
