// Katalógus-betöltés. A foglalkozás-készlet STATIKUS referencia-adat, ezért
// fájlban él a repóban (nem DB-ben): verziózva a kóddal, review-zható diffként,
// migráció nélkül, és a motor tiszta függvényként tesztelhető marad.
// DB-be az kerül, ami felhasználói adat: a wizard-háttér és a visszajelzések.
//
// Forrás és licenc: O*NET 30.3 Database (U.S. DOL/ETA, CC BY 4.0) + ESCO v1.2
// (Európai Bizottság) + KSH ISCO→FEOR fordítókulcs. Részletek:
// docs/product/occupation-catalog-sources.md

import coreData from "./catalog/occupations.core.json";
import type { Occupation, OccupationContent } from "./types";

interface CoreFile {
  meta: {
    version: string;
    reviewedBy: string;
    activeCount: number;
    archivedCount: number;
    sources: Record<string, string>;
  };
  occupations: Occupation[];
}

const core = coreData as unknown as CoreFile;

export const CATALOG_VERSION = core.meta.version;
export const CATALOG_SOURCES = core.meta.sources;

/** A termékben aktív foglalkozások (T1+T2, kézzel ellenőrizve). */
export function getOccupations(): Occupation[] {
  return core.occupations;
}

const byId = new Map(core.occupations.map((occupation) => [occupation.id, occupation]));

export function getOccupation(id: string): Occupation | undefined {
  return byId.get(id);
}

/**
 * Leírások, aliasok, hivatalos nevek — külön fájlban, mert csak a megjelenítéshez
 * kell, a rangsoroláshoz nem. Szerver-oldalon, igény szerint töltjük be.
 */
let contentCache: Map<string, OccupationContent> | null = null;

export async function getContentMap(): Promise<Map<string, OccupationContent>> {
  if (!contentCache) {
    const file = (await import("./catalog/occupations.content.json")) as unknown as {
      default: { content: OccupationContent[] };
    };
    const list = (file.default ?? (file as unknown as { content: OccupationContent[] })).content;
    contentCache = new Map(list.map((entry) => [entry.id, entry]));
  }
  return contentCache;
}

export async function getContent(id: string): Promise<OccupationContent | undefined> {
  return (await getContentMap()).get(id);
}
