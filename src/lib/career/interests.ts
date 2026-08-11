// Holland-kód (RIASEC) kezelés: teljes hat-vektoros congruence.
//
// A v1 csak a top-2 betűt használta mindkét oldalon; a katalógus v2-ben minden
// foglalkozáshoz MÉRT hat-elemű érdeklődés-profil tartozik (O*NET), így a
// congruence a két profil alakjának egyezése lehet.

import {
  RIASEC_LETTERS,
  type AxisKey,
  type DimCode,
  type Occupation,
  type RiasecLetter,
} from "./types";

/**
 * Érdeklődés-címke → Holland-betűk. A wizard gyors címke-választása ebből lesz
 * BECSÜLT érdeklődés-profil (a mért kérdőív ennél mindig erősebb forrás).
 */
export const TAG_LETTERS: Record<string, RiasecLetter[]> = {
  nature: ["R", "I"],
  numbers: ["I", "C"],
  helping: ["S"],
  building: ["R"],
  design: ["A"],
  teaching: ["S", "A"],
  business: ["E", "C"],
  research: ["I"],
  stage: ["A", "E"],
  logic: ["I", "C"],
  caring: ["S"],
  society: ["S", "E"],
};

/** Címkékből becsült érdeklődés-vektor (0-100). Üres címkelistánál null. */
export function interestsFromTags(
  tagKeys: string[] | undefined,
): Partial<Record<RiasecLetter, number>> | null {
  const counts = new Map<RiasecLetter, number>();
  for (const key of tagKeys ?? []) {
    for (const letter of TAG_LETTERS[key] ?? []) {
      counts.set(letter, (counts.get(letter) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  const max = Math.max(...counts.values());
  const vector: Partial<Record<RiasecLetter, number>> = {};
  for (const letter of RIASEC_LETTERS) {
    const hits = counts.get(letter) ?? 0;
    vector[letter] = Math.round(25 + (hits / max) * 60);
  }
  return vector;
}

/**
 * Személyiség- és preferencia-alapú érdeklődés-becslés — a leggyengébb forrás,
 * csak ha se mért kérdőív, se címke nincs. A v1-hez képest a hat betű skálája
 * AZONOS (mindegyik 0-100-ra normált súlyozott átlag), így egyik betű sem
 * strukturálisan előnyös.
 */
export function estimateInterests(
  dims: Partial<Record<DimCode, number>>,
  prefs: Partial<Record<AxisKey, -1 | 0 | 1>> | undefined,
): Partial<Record<RiasecLetter, number>> {
  const dim = (code: DimCode) => dims[code] ?? 50;
  const axis = (key: AxisKey) => ((prefs?.[key] ?? 0) + 1) * 50; // -1|0|1 → 0|50|100
  const mix = (parts: Array<[number, number]>) => {
    const total = parts.reduce((sum, [, weight]) => sum + weight, 0) || 1;
    return Math.round(parts.reduce((sum, [value, weight]) => sum + value * weight, 0) / total);
  };
  return {
    R: mix([[100 - axis("people"), 0.4], [100 - axis("creation"), 0.2], [dim("C"), 0.4]]),
    I: mix([[dim("O"), 0.5], [100 - axis("people"), 0.2], [dim("C"), 0.3]]),
    A: mix([[dim("O"), 0.5], [axis("creation"), 0.4], [100 - dim("C"), 0.1]]),
    S: mix([[dim("A"), 0.4], [axis("people"), 0.4], [dim("E"), 0.2]]),
    E: mix([[dim("X"), 0.5], [axis("people"), 0.3], [axis("variety"), 0.2]]),
    C: mix([[dim("C"), 0.6], [100 - axis("variety"), 0.4]]),
  };
}

/**
 * Teljes-e a MÉRT érdeklődés-vektor. A `scoreRiasec` csak a hiánytalan (mind a
 * hat betűs) kérdőív-kitöltésből ad eredményt — ezért „measured"-nek is csak a
 * teljes vektor számíthat. Egy parciális (pl. négybetűs) vektor kliens-állítás
 * lehet, de nem valódi mérés; a forrás-létrán tags/estimated felé kell esnie
 * (person.ts), és a mentő route is ezt a teljességi szabályt kényszeríti
 * (career-background/route.ts). Enélkül egy csonka vektor „measured"-ként a
 * legmagasabb súlyt kapná, és megnyitná az interest-led rangsort.
 */
export function isCompleteRiasecVector(
  vector: Partial<Record<RiasecLetter, number>>,
): boolean {
  return RIASEC_LETTERS.every((letter) => typeof vector[letter] === "number");
}

/** Profil-korreláció alapú congruence 0-100. A szintet kiszűrjük: az ALAK számít. */
export function interestCongruence(
  user: Partial<Record<RiasecLetter, number>>,
  role: Record<RiasecLetter, number>,
): number | null {
  const pairs = RIASEC_LETTERS.map((letter) => [user[letter], role[letter]] as const).filter(
    (pair): pair is readonly [number, number] => typeof pair[0] === "number",
  );
  if (pairs.length < 4) return null;
  const meanA = pairs.reduce((s, [a]) => s + a, 0) / pairs.length;
  const meanB = pairs.reduce((s, [, b]) => s + b, 0) / pairs.length;
  let num = 0;
  let da = 0;
  let db = 0;
  for (const [a, b] of pairs) {
    num += (a - meanA) * (b - meanB);
    da += (a - meanA) ** 2;
    db += (b - meanB) ** 2;
  }
  if (da === 0 || db === 0) return 50;
  const r = num / Math.sqrt(da * db);
  return Math.round(((r + 1) / 2) * 100);
}

/**
 * Differenciáltság: mennyire tagolt a user érdeklődés-profilja. Alacsonynál a
 * Holland-alapú rangsorolás gyenge jel — a UI ezt kiírja, a motor a súlyt csökkenti.
 */
export function interestDifferentiation(
  user: Partial<Record<RiasecLetter, number>>,
): "low" | "ok" | null {
  const values = RIASEC_LETTERS.map((l) => user[l]).filter(
    (v): v is number => typeof v === "number",
  );
  if (values.length < 4) return null;
  return Math.max(...values) - Math.min(...values) < 20 ? "low" : "ok";
}

/** A foglalkozás három legerősebb Holland-betűje (megjelenítéshez). */
export function roleTopLetters(occupation: Occupation, count = 3): string {
  return [...RIASEC_LETTERS]
    .sort((a, b) => occupation.riasec[b] - occupation.riasec[a])
    .slice(0, count)
    .join("");
}

/** A user három legerősebb betűje. */
export function userTopLetters(
  user: Partial<Record<RiasecLetter, number>>,
  count = 3,
): string {
  return RIASEC_LETTERS.filter((l) => typeof user[l] === "number")
    .sort((a, b) => (user[b] ?? 0) - (user[a] ?? 0))
    .slice(0, count)
    .join("");
}
