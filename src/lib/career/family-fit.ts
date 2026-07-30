// Családszintű illeszkedés — a karrier-iránytű elsődleges kimenete.
//
// Miért nem az egyedi szakma a válasz: 477 tétellel és egy 60 itemes
// műszerrel a 3. és a 12. hely közti különbség mérési hibán belül van.
// Egy CSALÁD viszont viselkedésileg homogén (a besorolás a profil-alakon,
// a preferencia-tengelyeken és a RIASEC-vektoron fut), ezért családszinten
// az állítás védhető. Levezetés: docs/product/career-families.md

import { getOccupations } from "./catalog";
import { SMALL_FAMILY_THRESHOLD, getCareerFamily } from "./families";
import { bandFor } from "./psychometrics";
import type { OccupationFit } from "./types";

/**
 * Családonkénti teljes katalógus-méret. A `small` jelölés ezen fut, nem az
 * adott futásban pontozott darabszámon — különben egy szűk scope minden
 * családot „kicsinek" mutatna.
 */
const CATALOG_SIZE: Map<string, number> = (() => {
  const counts = new Map<string, number>();
  for (const occupation of getOccupations()) {
    if (!occupation.family) continue;
    counts.set(occupation.family, (counts.get(occupation.family) ?? 0) + 1);
  }
  return counts;
})();

export interface FamilyFit {
  key: string;
  /** hány pontozott szakma esett ide ebben a futásban (szűrések után) */
  scored: number;
  /** hány tétel tartozik ide a TELJES katalógusban — a kis-család jelöléshez */
  size: number;
  /** családszintű illeszkedés 0-100: a legjobban illeszkedő tagok átlaga */
  fit: number;
  /** a becslés bizonytalansága (konzervatív — ld. lent) */
  se: number;
  band: { low: number; high: number };
  /**
   * Kis család: a családszintű átlag maga is zajos, mert kevés tagból
   * számol. A felületen halkabban, „tájékoztató jellegű" jelöléssel.
   */
  small: boolean;
  /** a család legjobban illeszkedő tagjai, sorrendben */
  top: OccupationFit[];
}

/**
 * Hány tagból számoljuk a család pontszámát.
 *
 * Nem az ÖSSZES tagból: egy nagy család akkor is jó válasz lehet, ha a
 * tagjainak fele nem illik hozzád — a kérdés az, hogy „a legjobb esetben
 * mennyire való nekem ez az irány". És nem is a legjobb EGY tagból: az egy
 * kiugró tétel zajára ülne rá az egész család pontszáma.
 */
function topCount(n: number): number {
  return Math.max(1, Math.min(8, Math.min(n, Math.ceil(n / 3))));
}

/**
 * Családszintű aggregálás a pontozott szakmákból.
 *
 * A `fits` a TELJES pontozott halmaz legyen (a limit és a diverzifikálás
 * ELŐTT) — különben a családok pontszáma attól függne, hány tételük fért be
 * a megjelenített listába.
 */
export function aggregateFamilyFits(fits: OccupationFit[]): FamilyFit[] {
  const grouped = new Map<string, OccupationFit[]>();
  for (const fit of fits) {
    if (!fit.family) continue;
    if (!grouped.has(fit.family)) grouped.set(fit.family, []);
    grouped.get(fit.family)!.push(fit);
  }

  const out: FamilyFit[] = [];
  for (const [key, members] of grouped) {
    const family = getCareerFamily(key);
    if (!family) continue;

    const sorted = [...members].sort((a, b) => b.rank - a.rank);
    const k = topCount(sorted.length);
    const top = sorted.slice(0, k);

    const fit = Math.round(top.reduce((sum, m) => sum + m.rank, 0) / k);
    // A tag-pontszámok ERŐSEN korreláltak (ugyanaz a személy, hasonló
    // szerepek), ezért NEM osztunk gyök(k)-val, ahogy független mintáknál
    // tennénk — az hamis pontosságot mutatna. A tagok hibájának átlagát
    // vesszük, ami konzervatív, de őszinte.
    const se = Math.round((top.reduce((sum, m) => sum + m.rankSe, 0) / k) * 10) / 10;

    const size = CATALOG_SIZE.get(key) ?? members.length;
    out.push({
      key,
      scored: members.length,
      size,
      fit,
      se,
      band: bandFor(fit, se),
      small: size < SMALL_FAMILY_THRESHOLD,
      top,
    });
  }

  return out.sort((a, b) => b.fit - a.fit);
}

/**
 * Két család közti különbség érdemi-e, vagy mérési hibán belül van?
 * A felület ezen dönti el, mikor mondhat sorrendet, és mikor kell
 * „nagyjából egyformán illik" megfogalmazást használni.
 */
export function familiesAreDistinguishable(a: FamilyFit, b: FamilyFit): boolean {
  return Math.abs(a.fit - b.fit) > Math.max(a.se, b.se);
}
