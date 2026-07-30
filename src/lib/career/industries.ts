// A wizard érdeklődés-kérdései (iparágak) és a katalógus ISCO-besorolása közti
// híd. A v1 saját iparág-kulcsokkal dolgozott; a v2 katalógus ISCO-08 alapú,
// ezért az iparág = ISCO-alcsoportok (2 jegyű) halmaza.
//
// A leképezés szándékosan bőkezű: az érdeklődés SZŰKÍT, nem kizár, és a
// felhasználó bármikor kérheti a teljes listát.

import type { Occupation } from "./types";

export const INDUSTRY_ISCO: Record<string, string[]> = {
  // IT / szoftver
  tech: ["25", "35"],
  // Egészségügy / gondoskodás
  health: ["22", "32", "53"],
  // Oktatás / képzés
  education: ["23", "34"],
  // Pénzügy / számvitel
  finance: ["24", "33", "41", "42"],
  // Értékesítés / ügyfélkapcsolat
  sales: ["52", "42", "33"],
  // Marketing / kreatív
  creative: ["21", "26", "34"],
  // Média / kommunikáció
  media: ["26", "34", "35"],
  // Gyártás / logisztika
  operations: ["31", "81", "82", "83", "93"],
  // HR / szervezetfejlesztés
  people: ["12", "24", "33"],
  // Jog / közszféra
  public: ["26", "33", "34", "54", "11"],
  // Építőipar / mérnöki
  engineering: ["21", "31", "71", "72"],
  // Vendéglátás / turizmus
  hospitality: ["34", "51", "94"],
  // Tudomány / kutatás
  science: ["21", "22", "31"],
  // Szakmák / ipar
  trades: ["71", "72", "73", "74", "75"],
  // Közlekedés / szállítmányozás
  transport: ["83", "43", "93"],
  // Személyi szolgáltatás / wellness
  services: ["51", "53", "91"],
};

/** Az érdeklődésként megjelölt iparágakhoz tartozó ISCO-alcsoport-prefixek. */
export function iscoPrefixesFor(industryKeys: string[] | undefined): Set<string> {
  const set = new Set<string>();
  for (const key of industryKeys ?? []) {
    for (const prefix of INDUSTRY_ISCO[key] ?? []) set.add(prefix);
  }
  return set;
}

export function matchesIndustries(occupation: Occupation, prefixes: Set<string>): boolean {
  if (prefixes.size === 0) return true;
  const isco = occupation.isco ?? "";
  return prefixes.has(isco.slice(0, 2));
}
